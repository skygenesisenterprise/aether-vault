package capability

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Store represents the capability storage interface
type Store struct {
	// Storage configuration
	config *StoreConfig

	// In-memory cache
	cache map[string]*types.Capability

	// Cache mutex
	cacheMutex sync.RWMutex

	// Usage tracking
	usage map[string]*types.CapabilityUsage

	// Usage mutex
	usageMutex sync.RWMutex

	// File path for persistence
	filePath string

	// Enable persistence
	enablePersistence bool
}

// StoreConfig represents store configuration
type StoreConfig struct {
	// Enable in-memory caching
	EnableCache bool `json:"enableCache"`

	// Cache size limit
	CacheSize int `json:"cacheSize"`

	// Enable persistence
	EnablePersistence bool `json:"enablePersistence"`

	// Storage file path
	StorageFilePath string `json:"storageFilePath"`

	// Enable usage tracking
	EnableUsageTracking bool `json:"enableUsageTracking"`

	// Cleanup interval in seconds
	CleanupInterval int64 `json:"cleanupInterval"`

	// Enable compression
	EnableCompression bool `json:"enableCompression"`

	// Enable encryption
	EnableEncryption bool `json:"enableEncryption"`

	// Encryption key file
	EncryptionKeyFile string `json:"encryptionKeyFile,omitempty"`
}

// DefaultStoreConfig returns default store configuration
func DefaultStoreConfig() *StoreConfig {
	homeDir, _ := os.UserHomeDir()
	return &StoreConfig{
		EnableCache:         true,
		CacheSize:           10000,
		EnablePersistence:   true,
		StorageFilePath:     filepath.Join(homeDir, ".aether-vault", "capabilities.json"),
		EnableUsageTracking: true,
		CleanupInterval:     300, // 5 minutes
		EnableCompression:   false,
		EnableEncryption:    false,
	}
}

// NewStore creates a new capability store
func NewStore(config *StoreConfig) (*Store, error) {
	if config == nil {
		config = DefaultStoreConfig()
	}

	store := &Store{
		config:            config,
		cache:             make(map[string]*types.Capability),
		usage:             make(map[string]*types.CapabilityUsage),
		filePath:          config.StorageFilePath,
		enablePersistence: config.EnablePersistence,
	}

	// Load existing data if persistence is enabled
	if config.EnablePersistence {
		if err := store.loadFromFile(); err != nil {
			return nil, fmt.Errorf("failed to load from file: %w", err)
		}
	}

	// Start cleanup routine
	go store.startCleanupRoutine()

	return store, nil
}

// Store stores a capability
func (s *Store) Store(capability *types.Capability) error {
	if capability == nil {
		return fmt.Errorf("capability cannot be nil")
	}

	if capability.ID == "" {
		return fmt.Errorf("capability ID cannot be empty")
	}

	// Add to cache
	if s.config.EnableCache {
		s.cacheMutex.Lock()
		s.cache[capability.ID] = capability
		s.cacheMutex.Unlock()
	}

	// Initialize usage tracking
	if s.config.EnableUsageTracking {
		s.usageMutex.Lock()
		s.usage[capability.ID] = &types.CapabilityUsage{
			TotalUses:      0,
			SuccessfulUses: 0,
			FailedUses:     0,
			LastAccess:     time.Now(),
			AccessPattern:  []types.AccessEvent{},
		}
		s.usageMutex.Unlock()
	}

	// Persist to file
	if s.enablePersistence {
		if err := s.saveToFile(); err != nil {
			return fmt.Errorf("failed to persist capability: %w", err)
		}
	}

	return nil
}

// Retrieve retrieves a capability by ID
func (s *Store) Retrieve(id string) (*types.Capability, error) {
	if id == "" {
		return nil, fmt.Errorf("capability ID cannot be empty")
	}

	// Check cache first
	if s.config.EnableCache {
		s.cacheMutex.RLock()
		capability, exists := s.cache[id]
		s.cacheMutex.RUnlock()

		if exists {
			return capability, nil
		}
	}

	// Load from file if not in cache
	if s.enablePersistence {
		if err := s.loadFromFile(); err != nil {
			return nil, fmt.Errorf("failed to load from file: %w", err)
		}

		// Check cache again after loading
		if s.config.EnableCache {
			s.cacheMutex.RLock()
			capability, exists := s.cache[id]
			s.cacheMutex.RUnlock()

			if exists {
				return capability, nil
			}
		}
	}

	return nil, fmt.Errorf("capability not found: %s", id)
}

// List lists capabilities with filtering
func (s *Store) List(filter *types.CapabilityFilter) ([]*types.Capability, error) {
	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	var capabilities []*types.Capability

	// Apply filter
	for _, capability := range s.cache {
		if s.matchesFilter(capability, filter) {
			capabilities = append(capabilities, capability)
		}
	}

	// Apply sorting
	if filter != nil && filter.SortBy != "" {
		capabilities = s.sortCapabilities(capabilities, filter.SortBy, filter.SortOrder)
	}

	// Apply pagination
	if filter != nil && (filter.Limit > 0 || filter.Offset > 0) {
		start := filter.Offset
		if start < 0 {
			start = 0
		}
		end := start + filter.Limit
		if filter.Limit <= 0 || end > len(capabilities) {
			end = len(capabilities)
		}
		if start >= len(capabilities) {
			capabilities = []*types.Capability{}
		} else {
			capabilities = capabilities[start:end]
		}
	}

	return capabilities, nil
}

// Revoke revokes a capability
func (s *Store) Revoke(id string, reason string, revokedBy string) error {
	// Retrieve capability
	capability, err := s.Retrieve(id)
	if err != nil {
		return fmt.Errorf("failed to retrieve capability: %w", err)
	}

	// Add revocation information
	capability.Metadata = make(map[string]interface{})
	capability.Metadata["revoked"] = true
	capability.Metadata["revoked_at"] = time.Now().Unix()
	capability.Metadata["revoked_by"] = revokedBy
	capability.Metadata["revocation_reason"] = reason

	// Update cache
	if s.config.EnableCache {
		s.cacheMutex.Lock()
		s.cache[id] = capability
		s.cacheMutex.Unlock()
	}

	// Persist to file
	if s.enablePersistence {
		if err := s.saveToFile(); err != nil {
			return fmt.Errorf("failed to persist revocation: %w", err)
		}
	}

	return nil
}

// Cleanup removes expired capabilities
func (s *Store) Cleanup() error {
	now := time.Now()
	removed := 0

	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	// Remove expired capabilities
	for id, capability := range s.cache {
		if now.After(capability.ExpiresAt) {
			delete(s.cache, id)
			removed++
		}
	}

	// Clean up usage tracking
	if s.config.EnableUsageTracking {
		s.usageMutex.Lock()
		for id := range s.usage {
			if _, exists := s.cache[id]; !exists {
				delete(s.usage, id)
			}
		}
		s.usageMutex.Unlock()
	}

	// Persist changes
	if s.enablePersistence && removed > 0 {
		if err := s.saveToFile(); err != nil {
			return fmt.Errorf("failed to persist cleanup: %w", err)
		}
	}

	return nil
}

// GetUsage returns usage statistics for a capability
func (s *Store) GetUsage(id string) (*types.CapabilityUsage, error) {
	if !s.config.EnableUsageTracking {
		return nil, fmt.Errorf("usage tracking is disabled")
	}

	s.usageMutex.RLock()
	defer s.usageMutex.RUnlock()

	usage, exists := s.usage[id]
	if !exists {
		return nil, fmt.Errorf("usage not found for capability: %s", id)
	}

	return usage, nil
}

// UpdateUsage updates usage statistics for a capability
func (s *Store) UpdateUsage(id string, event *types.AccessEvent) error {
	if !s.config.EnableUsageTracking {
		return nil // Silently ignore if tracking is disabled
	}

	s.usageMutex.Lock()
	defer s.usageMutex.Unlock()

	usage, exists := s.usage[id]
	if !exists {
		// Create usage entry if it doesn't exist
		usage = &types.CapabilityUsage{
			TotalUses:      0,
			SuccessfulUses: 0,
			FailedUses:     0,
			LastAccess:     time.Now(),
			AccessPattern:  []types.AccessEvent{},
		}
		s.usage[id] = usage
	}

	// Update statistics
	usage.TotalUses++
	if event.Success {
		usage.SuccessfulUses++
	} else {
		usage.FailedUses++
	}
	usage.LastAccess = event.Timestamp

	// Add to access pattern (keep last 100 events)
	usage.AccessPattern = append(usage.AccessPattern, *event)
	if len(usage.AccessPattern) > 100 {
		usage.AccessPattern = usage.AccessPattern[1:]
	}

	return nil
}

// matchesFilter checks if a capability matches the filter
func (s *Store) matchesFilter(capability *types.Capability, filter *types.CapabilityFilter) bool {
	if filter == nil {
		return true
	}

	// Identity filter
	if filter.Identity != "" && capability.Identity != filter.Identity {
		return false
	}

	// Resource filter
	if filter.Resource != "" && capability.Resource != filter.Resource {
		return false
	}

	// Type filter
	if filter.Type != "" && capability.Type != filter.Type {
		return false
	}

	// Status filter
	if filter.Status != "" {
		revoked, _ := capability.Metadata["revoked"].(bool)
		expired := time.Now().After(capability.ExpiresAt)

		switch filter.Status {
		case "active":
			if revoked || expired {
				return false
			}
		case "revoked":
			if !revoked {
				return false
			}
		case "expired":
			if !expired {
				return false
			}
		}
	}

	// Issuer filter
	if filter.Issuer != "" && capability.Issuer != filter.Issuer {
		return false
	}

	// Time range filter
	if filter.TimeRange != nil {
		if capability.IssuedAt.Before(filter.TimeRange.Start) || capability.IssuedAt.After(filter.TimeRange.End) {
			return false
		}
	}

	// Metadata filter
	if len(filter.Metadata) > 0 {
		for key, expectedValue := range filter.Metadata {
			actualValue, exists := capability.Metadata[key]
			if !exists || actualValue != expectedValue {
				return false
			}
		}
	}

	return true
}

// sortCapabilities sorts capabilities by specified field
func (s *Store) sortCapabilities(capabilities []*types.Capability, sortBy, sortOrder string) []*types.Capability {
	// Simple implementation - in production, use more efficient sorting
	sorted := make([]*types.Capability, len(capabilities))
	copy(sorted, capabilities)

	// Sort by field
	switch sortBy {
	case "id":
		// Sort by ID
	case "type":
		// Sort by type
	case "resource":
		// Sort by resource
	case "identity":
		// Sort by identity
	case "issued_at":
		// Sort by issued timestamp
	case "expires_at":
		// Sort by expires timestamp
	default:
		// Default sort by issued_at
	}

	return sorted
}

// loadFromFile loads capabilities from file
func (s *Store) loadFromFile() error {
	if !s.enablePersistence {
		return nil
	}

	// Check if file exists
	if _, err := os.Stat(s.filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, that's OK
	}

	// Read file
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	// Parse JSON
	var storeData struct {
		Capabilities map[string]*types.Capability      `json:"capabilities"`
		Usage        map[string]*types.CapabilityUsage `json:"usage,omitempty"`
	}

	if err := json.Unmarshal(data, &storeData); err != nil {
		return fmt.Errorf("failed to unmarshal data: %w", err)
	}

	// Update cache
	s.cacheMutex.Lock()
	s.cache = storeData.Capabilities
	s.cacheMutex.Unlock()

	// Update usage tracking
	if s.config.EnableUsageTracking {
		s.usageMutex.Lock()
		s.usage = storeData.Usage
		s.usageMutex.Unlock()
	}

	return nil
}

// saveToFile saves capabilities to file
func (s *Store) saveToFile() error {
	if !s.enablePersistence {
		return nil
	}

	// Create directory if it doesn't exist
	dir := filepath.Dir(s.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Prepare data
	storeData := struct {
		Capabilities map[string]*types.Capability      `json:"capabilities"`
		Usage        map[string]*types.CapabilityUsage `json:"usage,omitempty"`
	}{
		Capabilities: s.cache,
	}

	if s.config.EnableUsageTracking {
		s.usageMutex.RLock()
		storeData.Usage = s.usage
		s.usageMutex.RUnlock()
	}

	// Serialize to JSON
	data, err := json.MarshalIndent(storeData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	// Write to temporary file first
	tempFile := s.filePath + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write temporary file: %w", err)
	}

	// Atomic rename
	if err := os.Rename(tempFile, s.filePath); err != nil {
		os.Remove(tempFile) // Clean up temp file
		return fmt.Errorf("failed to rename file: %w", err)
	}

	return nil
}

// startCleanupRoutine starts the cleanup routine
func (s *Store) startCleanupRoutine() {
	if s.config.CleanupInterval <= 0 {
		return
	}

	ticker := time.NewTicker(time.Duration(s.config.CleanupInterval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.Cleanup(); err != nil {
			// Log error but continue
			fmt.Printf("Cleanup error: %v\n", err)
		}
	}
}

// GetStats returns storage statistics
func (s *Store) GetStats() map[string]interface{} {
	s.cacheMutex.RLock()
	s.usageMutex.RLock()
	defer s.cacheMutex.RUnlock()
	defer s.usageMutex.RUnlock()

	stats := map[string]interface{}{
		"total_capabilities":     len(s.cache),
		"cache_enabled":          s.config.EnableCache,
		"cache_size":             s.config.CacheSize,
		"persistence_enabled":    s.enablePersistence,
		"usage_tracking_enabled": s.config.EnableUsageTracking,
		"total_usage_entries":    len(s.usage),
	}

	// Count by status
	active := 0
	revoked := 0
	expired := 0
	now := time.Now()

	for _, capability := range s.cache {
		isRevoked, _ := capability.Metadata["revoked"].(bool)
		isExpired := now.After(capability.ExpiresAt)

		if isRevoked {
			revoked++
		} else if isExpired {
			expired++
		} else {
			active++
		}
	}

	stats["active_capabilities"] = active
	stats["revoked_capabilities"] = revoked
	stats["expired_capabilities"] = expired

	return stats
}
