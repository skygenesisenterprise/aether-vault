package capability

import (
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Engine represents the capability engine
type Engine struct {
	// Ed25519 private key for signing
	privateKey ed25519.PrivateKey

	// Ed25519 public key for verification
	publicKey ed25519.PublicKey

	// Capability store
	store types.CapabilityStore

	// Engine configuration
	config *EngineConfig
}

// EngineConfig represents engine configuration
type EngineConfig struct {
	// Default TTL in seconds
	DefaultTTL int64 `json:"defaultTTL"`

	// Maximum TTL in seconds
	MaxTTL int64 `json:"maxTTL"`

	// Maximum uses per capability
	MaxUses int `json:"maxUses"`

	// Issuer identifier
	Issuer string `json:"issuer"`

	// Enable usage tracking
	EnableUsageTracking bool `json:"enableUsageTracking"`

	// Cleanup interval in seconds
	CleanupInterval int64 `json:"cleanupInterval"`

	// Signature algorithm
	SignatureAlgorithm string `json:"signatureAlgorithm"`
}

// DefaultEngineConfig returns default engine configuration
func DefaultEngineConfig() *EngineConfig {
	return &EngineConfig{
		DefaultTTL:          300,  // 5 minutes
		MaxTTL:              3600, // 1 hour
		MaxUses:             100,
		Issuer:              "aether-vault-agent",
		EnableUsageTracking: true,
		CleanupInterval:     60, // 1 minute
		SignatureAlgorithm:  "ed25519",
	}
}

// NewEngine creates a new capability engine
func NewEngine(config *EngineConfig, store types.CapabilityStore) (*Engine, error) {
	if config == nil {
		config = DefaultEngineConfig()
	}

	// Generate Ed25519 key pair
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	engine := &Engine{
		privateKey: privateKey,
		publicKey:  publicKey,
		store:      store,
		config:     config,
	}

	// Start cleanup routine
	go engine.startCleanupRoutine()

	return engine, nil
}

// NewEngineWithKeys creates a new engine with existing keys
func NewEngineWithKeys(config *EngineConfig, store types.CapabilityStore, publicKey, privateKey []byte) (*Engine, error) {
	if config == nil {
		config = DefaultEngineConfig()
	}

	if len(publicKey) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(publicKey))
	}

	if len(privateKey) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("invalid private key size: expected %d, got %d", ed25519.PrivateKeySize, len(privateKey))
	}

	engine := &Engine{
		privateKey: ed25519.PrivateKey(privateKey),
		publicKey:  ed25519.PublicKey(publicKey),
		store:      store,
		config:     config,
	}

	// Start cleanup routine
	go engine.startCleanupRoutine()

	return engine, nil
}

// GenerateCapability generates a new capability
func (e *Engine) GenerateCapability(request *types.CapabilityRequest) (*types.CapabilityResponse, error) {
	startTime := time.Now()

	// Validate request
	if err := e.validateRequest(request); err != nil {
		return &types.CapabilityResponse{
			Status:         "denied",
			Message:        fmt.Sprintf("Invalid request: %v", err),
			RequestID:      e.generateRequestID(),
			ProcessingTime: time.Since(startTime),
		}, nil
	}

	// Create capability
	capability, err := e.createCapability(request)
	if err != nil {
		return &types.CapabilityResponse{
			Status:         "error",
			Message:        fmt.Sprintf("Failed to create capability: %v", err),
			RequestID:      e.generateRequestID(),
			ProcessingTime: time.Since(startTime),
		}, nil
	}

	// Sign capability
	if err := e.signCapability(capability); err != nil {
		return &types.CapabilityResponse{
			Status:         "error",
			Message:        fmt.Sprintf("Failed to sign capability: %v", err),
			RequestID:      e.generateRequestID(),
			ProcessingTime: time.Since(startTime),
		}, nil
	}

	// Store capability
	if err := e.store.Store(capability); err != nil {
		return &types.CapabilityResponse{
			Status:         "error",
			Message:        fmt.Sprintf("Failed to store capability: %v", err),
			RequestID:      e.generateRequestID(),
			ProcessingTime: time.Since(startTime),
		}, nil
	}

	return &types.CapabilityResponse{
		Capability:     capability,
		Status:         "granted",
		Message:        "Capability granted successfully",
		RequestID:      e.generateRequestID(),
		ProcessingTime: time.Since(startTime),
	}, nil
}

// ValidateCapability validates a capability
func (e *Engine) ValidateCapability(capabilityID string, context *types.RequestContext) (*types.ValidationResult, error) {
	startTime := time.Now()

	// Retrieve capability
	capability, err := e.store.Retrieve(capabilityID)
	if err != nil {
		return &types.ValidationResult{
			Valid:          false,
			ValidationTime: time.Since(startTime),
			Errors: []types.ValidationError{
				{
					Code:    "CAP_NOT_FOUND",
					Message: fmt.Sprintf("Capability not found: %v", err),
				},
			},
		}, nil
	}

	// Perform validation
	result := &types.ValidationResult{
		Valid:          true,
		ValidationTime: time.Since(startTime),
		Errors:         []types.ValidationError{},
		Warnings:       []types.ValidationWarning{},
		Context:        make(map[string]interface{}),
	}

	// Validate signature
	if err := e.validateSignature(capability); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, types.ValidationError{
			Code:    "INVALID_SIGNATURE",
			Message: fmt.Sprintf("Invalid signature: %v", err),
		})
	}

	// Validate expiration
	if err := e.validateExpiration(capability); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, types.ValidationError{
			Code:    "EXPIRED",
			Message: fmt.Sprintf("Capability expired: %v", err),
		})
	}

	// Validate usage limits
	if err := e.validateUsage(capability); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, types.ValidationError{
			Code:    "USAGE_LIMIT_EXCEEDED",
			Message: fmt.Sprintf("Usage limit exceeded: %v", err),
		})
	}

	// Validate constraints
	if err := e.validateConstraints(capability, context); err != nil {
		result.Valid = false
		result.Errors = append(result.Errors, types.ValidationError{
			Code:    "CONSTRAINT_VIOLATION",
			Message: fmt.Sprintf("Constraint violation: %v", err),
		})
	}

	// Update usage if valid
	if result.Valid && e.config.EnableUsageTracking {
		event := &types.AccessEvent{
			Timestamp: time.Now(),
			Action:    "validate",
			Resource:  capability.Resource,
			Success:   result.Valid,
		}
		e.store.UpdateUsage(capabilityID, event)
	}

	return result, nil
}

// RevokeCapability revokes a capability
func (e *Engine) RevokeCapability(capabilityID, reason, revokedBy string) error {
	return e.store.Revoke(capabilityID, reason, revokedBy)
}

// ListCapabilities lists capabilities with filtering
func (e *Engine) ListCapabilities(filter *types.CapabilityFilter) ([]*types.Capability, error) {
	return e.store.List(filter)
}

// GetCapabilityStatus returns capability status
func (e *Engine) GetCapabilityStatus(capabilityID string) (*types.CapabilityStatus, error) {
	capability, err := e.store.Retrieve(capabilityID)
	if err != nil {
		return nil, err
	}

	status := &types.CapabilityStatus{
		ID:     capabilityID,
		Status: "active",
	}

	// Check expiration
	if time.Now().After(capability.ExpiresAt) {
		status.Status = "expired"
	}

	// Get usage statistics
	if e.config.EnableUsageTracking {
		usage, err := e.store.GetUsage(capabilityID)
		if err == nil {
			status.Usage = usage
			status.LastUsed = &usage.LastAccess
		}
	}

	return status, nil
}

// GetPublicKey returns the public key for verification
func (e *Engine) GetPublicKey() []byte {
	return []byte(e.publicKey)
}

// validateRequest validates a capability request
func (e *Engine) validateRequest(request *types.CapabilityRequest) error {
	if request == nil {
		return fmt.Errorf("request cannot be nil")
	}

	if request.Identity == "" {
		return fmt.Errorf("identity cannot be empty")
	}

	if request.Resource == "" {
		return fmt.Errorf("resource cannot be empty")
	}

	if len(request.Actions) == 0 {
		return fmt.Errorf("actions cannot be empty")
	}

	// Validate TTL
	if request.TTL <= 0 {
		request.TTL = e.config.DefaultTTL
	} else if request.TTL > e.config.MaxTTL {
		return fmt.Errorf("TTL exceeds maximum allowed: %d seconds", e.config.MaxTTL)
	}

	// Validate max uses
	if request.MaxUses <= 0 {
		request.MaxUses = e.config.MaxUses
	} else if request.MaxUses > e.config.MaxUses {
		return fmt.Errorf("max uses exceeds maximum allowed: %d", e.config.MaxUses)
	}

	return nil
}

// createCapability creates a capability from a request
func (e *Engine) createCapability(request *types.CapabilityRequest) (*types.Capability, error) {
	now := time.Now()

	capability := &types.Capability{
		ID:          e.generateCapabilityID(),
		Type:        e.determineCapabilityType(request.Actions),
		Resource:    request.Resource,
		Actions:     request.Actions,
		Identity:    request.Identity,
		Issuer:      e.config.Issuer,
		IssuedAt:    now,
		ExpiresAt:   now.Add(time.Duration(request.TTL) * time.Second),
		TTL:         request.TTL,
		MaxUses:     request.MaxUses,
		UsedCount:   0,
		Signature:   nil, // Will be set during signing
		Metadata:    make(map[string]interface{}),
		Constraints: request.Constraints,
	}

	// Add metadata
	if request.Context != nil {
		capability.Metadata["context"] = request.Context
	}

	if request.Purpose != "" {
		capability.Metadata["purpose"] = request.Purpose
	}

	return capability, nil
}

// signCapability signs a capability
func (e *Engine) signCapability(capability *types.Capability) error {
	// Create capability data for signing
	data, err := e.createCapabilityData(capability)
	if err != nil {
		return fmt.Errorf("failed to create capability data: %w", err)
	}

	// Sign the data
	signature := ed25519.Sign(e.privateKey, data)
	capability.Signature = signature

	return nil
}

// validateSignature validates a capability signature
func (e *Engine) validateSignature(capability *types.Capability) error {
	// Create capability data for verification
	data, err := e.createCapabilityData(capability)
	if err != nil {
		return fmt.Errorf("failed to create capability data: %w", err)
	}

	// Verify the signature
	if !ed25519.Verify(e.publicKey, data, capability.Signature) {
		return fmt.Errorf("invalid signature")
	}

	return nil
}

// validateExpiration validates capability expiration
func (e *Engine) validateExpiration(capability *types.Capability) error {
	if time.Now().After(capability.ExpiresAt) {
		return fmt.Errorf("capability expired at %s", capability.ExpiresAt.Format(time.RFC3339))
	}
	return nil
}

// validateUsage validates usage limits
func (e *Engine) validateUsage(capability *types.Capability) error {
	if capability.UsedCount >= capability.MaxUses {
		return fmt.Errorf("usage limit exceeded: %d/%d", capability.UsedCount, capability.MaxUses)
	}
	return nil
}

// validateConstraints validates capability constraints
func (e *Engine) validateConstraints(capability *types.Capability, context *types.RequestContext) error {
	if capability.Constraints == nil {
		return nil
	}

	constraints := capability.Constraints

	// Validate IP addresses
	if len(constraints.IPAddresses) > 0 {
		if context == nil || context.SourceIP == "" {
			return fmt.Errorf("IP address constraint violation: no source IP provided")
		}

		allowed := false
		for _, ip := range constraints.IPAddresses {
			if ip == context.SourceIP {
				allowed = true
				break
			}
		}

		if !allowed {
			return fmt.Errorf("IP address constraint violation: %s not in allowed list", context.SourceIP)
		}
	}

	// Validate time window
	if constraints.TimeWindow != nil {
		if err := e.validateTimeWindow(constraints.TimeWindow); err != nil {
			return fmt.Errorf("time window constraint violation: %w", err)
		}
	}

	// Validate environment
	if len(constraints.Environment) > 0 {
		if context == nil || context.Runtime == nil {
			return fmt.Errorf("environment constraint violation: no runtime context provided")
		}

		for key, expectedValue := range constraints.Environment {
			actualValue := e.getRuntimeValue(key, context.Runtime)
			if actualValue != expectedValue {
				return fmt.Errorf("environment constraint violation: %s=%s (expected %s)", key, actualValue, expectedValue)
			}
		}
	}

	return nil
}

// validateTimeWindow validates time window constraints
func (e *Engine) validateTimeWindow(window *types.TimeWindow) error {
	now := time.Now()

	// Check allowed hours
	if len(window.Hours) > 0 {
		currentHour := now.Hour()
		allowed := false
		for _, hour := range window.Hours {
			if hour == currentHour {
				allowed = true
				break
			}
		}
		if !allowed {
			return fmt.Errorf("current hour %d not in allowed hours", currentHour)
		}
	}

	// Check allowed days of week
	if len(window.DaysOfWeek) > 0 {
		currentDay := int(now.Weekday())
		allowed := false
		for _, day := range window.DaysOfWeek {
			if day == currentDay {
				allowed = true
				break
			}
		}
		if !allowed {
			return fmt.Errorf("current day %d not in allowed days", currentDay)
		}
	}

	// Check blackout periods
	for _, period := range window.BlackoutPeriods {
		if now.After(period.Start) && now.Before(period.End) {
			return fmt.Errorf("current time is in blackout period")
		}
	}

	return nil
}

// getRuntimeValue extracts runtime value
func (e *Engine) getRuntimeValue(key string, runtime *types.RuntimeContext) string {
	switch key {
	case "type":
		return runtime.Type
	case "id":
		return runtime.ID
	case "version":
		return runtime.Version
	default:
		if runtime.Container != nil {
			switch key {
			case "container.id":
				return runtime.Container.ID
			case "container.name":
				return runtime.Container.Name
			case "container.image":
				return runtime.Container.Image
			case "container.namespace":
				return runtime.Container.Namespace
			}
		}
		if runtime.Host != nil {
			switch key {
			case "host.hostname":
				return runtime.Host.Hostname
			case "host.platform":
				return runtime.Host.Platform
			case "host.architecture":
				return runtime.Host.Architecture
			}
		}
	}
	return ""
}

// createCapabilityData creates data for signing/verification
func (e *Engine) createCapabilityData(capability *types.Capability) ([]byte, error) {
	// Create a copy without signature for signing
	data := map[string]interface{}{
		"id":         capability.ID,
		"type":       capability.Type,
		"resource":   capability.Resource,
		"actions":    capability.Actions,
		"identity":   capability.Identity,
		"issuer":     capability.Issuer,
		"issued_at":  capability.IssuedAt.Unix(),
		"expires_at": capability.ExpiresAt.Unix(),
		"ttl":        capability.TTL,
		"max_uses":   capability.MaxUses,
		"used_count": capability.UsedCount,
		"metadata":   capability.Metadata,
	}

	if capability.Constraints != nil {
		data["constraints"] = capability.Constraints
	}

	// Serialize to JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize capability data: %w", err)
	}

	// Create hash
	hash := sha256.Sum256(jsonData)

	return hash[:], nil
}

// determineCapabilityType determines capability type from actions
func (e *Engine) determineCapabilityType(actions []string) types.CapabilityType {
	// Check for admin actions
	for _, action := range actions {
		if action == "admin" || action == "*" {
			return types.CapabilityAdmin
		}
	}

	// Check for delete actions
	for _, action := range actions {
		if action == "delete" {
			return types.CapabilityDelete
		}
	}

	// Check for write actions
	for _, action := range actions {
		if action == "write" || action == "create" || action == "update" {
			return types.CapabilityWrite
		}
	}

	// Check for execute actions
	for _, action := range actions {
		if action == "execute" || action == "run" {
			return types.CapabilityExecute
		}
	}

	// Default to read
	return types.CapabilityRead
}

// generateCapabilityID generates a unique capability ID
func (e *Engine) generateCapabilityID() string {
	timestamp := time.Now().UnixNano()
	random := make([]byte, 16)
	rand.Read(random)
	return fmt.Sprintf("cap_%d_%s", timestamp, base64.URLEncoding.EncodeToString(random)[:16])
}

// generateRequestID generates a unique request ID
func (e *Engine) generateRequestID() string {
	timestamp := time.Now().UnixNano()
	random := make([]byte, 16)
	rand.Read(random)
	return fmt.Sprintf("req_%d_%s", timestamp, base64.URLEncoding.EncodeToString(random)[:16])
}

// startCleanupRoutine starts the cleanup routine
func (e *Engine) startCleanupRoutine() {
	ticker := time.NewTicker(time.Duration(e.config.CleanupInterval) * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := e.store.Cleanup(); err != nil {
			// Log error but continue
			fmt.Printf("Cleanup error: %v\n", err)
		}
	}
}
