package capability

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

// Auditor represents the audit system
type Auditor struct {
	// Audit configuration
	config *AuditConfig

	// Audit log file
	logFile *os.File

	// Audit mutex
	mutex sync.RWMutex

	// In-memory buffer
	buffer []*AuditEvent

	// Buffer size
	bufferSize int

	// Flush interval
	flushInterval time.Duration

	// Shutdown channel
	shutdown chan struct{}

	// Wait group
	wg sync.WaitGroup

	// Running state
	running bool
}

// AuditConfig represents audit configuration
type AuditConfig struct {
	// Enable audit logging
	EnableLogging bool `json:"enableLogging"`

	// Log file path
	LogFilePath string `json:"logFilePath"`

	// Enable in-memory buffering
	EnableBuffer bool `json:"enableBuffer"`

	// Buffer size
	BufferSize int `json:"bufferSize"`

	// Flush interval in seconds
	FlushInterval int64 `json:"flushInterval"`

	// Enable log rotation
	EnableRotation bool `json:"enableRotation"`

	// Max file size in bytes
	MaxFileSize int64 `json:"maxFileSize"`

	// Max backup files
	MaxBackupFiles int `json:"maxBackupFiles"`

	// Enable compression
	EnableCompression bool `json:"enableCompression"`

	// Enable digital signatures
	EnableSignature bool `json:"enableSignature"`

	// Signature key file
	SignatureKeyFile string `json:"signatureKeyFile,omitempty"`

	// Log level
	LogLevel string `json:"logLevel"`

	// Enable SIEM integration
	EnableSIEM bool `json:"enableSIEM"`

	// SIEM endpoint
	SIEMEndpoint string `json:"siemEndpoint,omitempty"`

	// SIEM format (json, syslog,cef)
	SIEMFormat string `json:"siemFormat,omitempty"`
}

// AuditEvent represents an audit event
type AuditEvent struct {
	// Event ID
	ID string `json:"id"`

	// Event timestamp
	Timestamp time.Time `json:"timestamp"`

	// Event type
	Type string `json:"type"`

	// Event category
	Category string `json:"category"`

	// Event severity
	Severity string `json:"severity"`

	// Source identity
	SourceIdentity string `json:"sourceIdentity,omitempty"`

	// Target resource
	TargetResource string `json:"targetResource,omitempty"`

	// Action performed
	Action string `json:"action,omitempty"`

	// Event outcome
	Outcome string `json:"outcome"`

	// Event description
	Description string `json:"description,omitempty"`

	// Capability ID (if applicable)
	CapabilityID string `json:"capabilityId,omitempty"`

	// Policy ID (if applicable)
	PolicyID string `json:"policyId,omitempty"`

	// Request ID (if applicable)
	RequestID string `json:"requestId,omitempty"`

	// Session ID (if applicable)
	SessionID string `json:"sessionId,omitempty"`

	// Client information
	Client *ClientInfo `json:"client,omitempty"`

	// Resource information
	Resource *ResourceInfo `json:"resource,omitempty"`

	// Error information
	Error *ErrorInfo `json:"error,omitempty"`

	// Additional context
	Context map[string]interface{} `json:"context,omitempty"`

	// Event hash (for integrity)
	Hash string `json:"hash,omitempty"`

	// Digital signature
	Signature string `json:"signature,omitempty"`

	// Chain hash (for immutability)
	ChainHash string `json:"chainHash,omitempty"`
}

// ClientInfo represents client information
type ClientInfo struct {
	// Client IP
	IP string `json:"ip,omitempty"`

	// Client user agent
	UserAgent string `json:"userAgent,omitempty"`

	// Client platform
	Platform string `json:"platform,omitempty"`

	// Client version
	Version string `json:"version,omitempty"`

	// Process ID
	PID int `json:"pid,omitempty"`

	// Container information
	Container *ContainerInfo `json:"container,omitempty"`
}

// ContainerInfo represents container information
type ContainerInfo struct {
	// Container ID
	ID string `json:"id,omitempty"`

	// Container name
	Name string `json:"name,omitempty"`

	// Container image
	Image string `json:"image,omitempty"`

	// Container namespace
	Namespace string `json:"namespace,omitempty"`

	// Container labels
	Labels map[string]string `json:"labels,omitempty"`
}

// ResourceInfo represents resource information
type ResourceInfo struct {
	// Resource type
	Type string `json:"type,omitempty"`

	// Resource path
	Path string `json:"path,omitempty"`

	// Resource owner
	Owner string `json:"owner,omitempty"`

	// Resource permissions
	Permissions []string `json:"permissions,omitempty"`

	// Resource metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// ErrorInfo represents error information
type ErrorInfo struct {
	// Error code
	Code string `json:"code,omitempty"`

	// Error message
	Message string `json:"message,omitempty"`

	// Error stack trace
	StackTrace string `json:"stackTrace,omitempty"`

	// Error context
	Context map[string]interface{} `json:"context,omitempty"`
}

// DefaultAuditConfig returns default audit configuration
func DefaultAuditConfig() *AuditConfig {
	homeDir, _ := os.UserHomeDir()
	return &AuditConfig{
		EnableLogging:     true,
		LogFilePath:       filepath.Join(homeDir, ".aether-vault", "audit.log"),
		EnableBuffer:      true,
		BufferSize:        1000,
		FlushInterval:     60, // 1 minute
		EnableRotation:    true,
		MaxFileSize:       100 * 1024 * 1024, // 100MB
		MaxBackupFiles:    10,
		EnableCompression: false,
		EnableSignature:   false,
		LogLevel:          "info",
		EnableSIEM:        false,
		SIEMFormat:        "json",
	}
}

// NewAuditor creates a new auditor
func NewAuditor(config *AuditConfig) (*Auditor, error) {
	if config == nil {
		config = DefaultAuditConfig()
	}

	auditor := &Auditor{
		config:        config,
		buffer:        make([]*AuditEvent, 0, config.BufferSize),
		bufferSize:    config.BufferSize,
		flushInterval: time.Duration(config.FlushInterval) * time.Second,
		shutdown:      make(chan struct{}),
	}

	// Open log file
	if config.EnableLogging {
		if err := auditor.openLogFile(); err != nil {
			return nil, fmt.Errorf("failed to open log file: %w", err)
		}
	}

	return auditor, nil
}

// Start starts the auditor
func (a *Auditor) Start() error {
	if a.running {
		return fmt.Errorf("auditor already running")
	}

	a.running = true

	// Start flush routine if buffering is enabled
	if a.config.EnableBuffer {
		a.wg.Add(1)
		go a.flushRoutine()
	}

	return nil
}

// Stop stops the auditor
func (a *Auditor) Stop() error {
	if !a.running {
		return nil
	}

	a.running = false

	// Close shutdown channel
	close(a.shutdown)

	// Wait for flush routine
	a.wg.Wait()

	// Flush remaining events
	if a.config.EnableBuffer {
		a.flushBuffer()
	}

	// Close log file
	if a.logFile != nil {
		a.logFile.Close()
	}

	return nil
}

// LogEvent logs an audit event
func (a *Auditor) LogEvent(event *AuditEvent) error {
	if !a.running {
		return fmt.Errorf("auditor not running")
	}

	// Generate event ID and timestamp
	if event.ID == "" {
		event.ID = a.generateEventID()
	}
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Generate hash
	if err := a.generateHash(event); err != nil {
		return fmt.Errorf("failed to generate hash: %w", err)
	}

	// Generate signature if enabled
	if a.config.EnableSignature {
		if err := a.generateSignature(event); err != nil {
			return fmt.Errorf("failed to generate signature: %w", err)
		}
	}

	// Add to buffer if enabled
	if a.config.EnableBuffer {
		a.mutex.Lock()
		a.buffer = append(a.buffer, event)
		if len(a.buffer) >= a.bufferSize {
			// Buffer full, flush immediately
			go a.flushBuffer()
		}
		a.mutex.Unlock()
	}

	// Write directly to log if buffering is disabled
	if !a.config.EnableBuffer {
		return a.writeEvent(event)
	}

	// Send to SIEM if enabled
	if a.config.EnableSIEM {
		go a.sendToSIEM(event)
	}

	return nil
}

// LogCapabilityRequest logs a capability request
func (a *Auditor) LogCapabilityRequest(request *types.CapabilityRequest, response *types.CapabilityResponse, clientInfo *ClientInfo) error {
	event := &AuditEvent{
		Type:           "capability_request",
		Category:       "security",
		Severity:       "info",
		SourceIdentity: request.Identity,
		TargetResource: request.Resource,
		Action:         fmt.Sprintf("request:%s", request.Actions),
		Outcome:        response.Status,
		Description:    fmt.Sprintf("Capability request for %s", request.Resource),
		RequestID:      response.RequestID,
		Client:         clientInfo,
		Context:        make(map[string]interface{}),
	}

	// Add request context
	if request.Context != nil {
		event.Context["request_context"] = request.Context
	}

	// Add response context
	if response.PolicyResult != nil {
		event.PolicyID = fmt.Sprintf("%v", response.PolicyResult.AppliedPolicies)
		event.Context["policy_result"] = response.PolicyResult
	}

	// Add error information if failed
	if response.Status == "error" || response.Status == "denied" {
		event.Error = &ErrorInfo{
			Message: response.Message,
		}
	}

	return a.LogEvent(event)
}

// LogCapabilityValidation logs a capability validation
func (a *Auditor) LogCapabilityValidation(capabilityID string, result *types.ValidationResult, clientInfo *ClientInfo) error {
	severity := "info"
	outcome := "success"
	description := "Capability validation successful"

	if !result.Valid {
		severity = "warning"
		outcome = "failed"
		description = "Capability validation failed"
	}

	event := &AuditEvent{
		Type:           "capability_validation",
		Category:       "security",
		Severity:       severity,
		TargetResource: capabilityID,
		Action:         "validate",
		Outcome:        outcome,
		Description:    description,
		CapabilityID:   capabilityID,
		Client:         clientInfo,
		Context:        make(map[string]interface{}),
	}

	// Add validation context
	event.Context["validation_result"] = result
	event.Context["errors"] = result.Errors
	event.Context["warnings"] = result.Warnings

	return a.LogEvent(event)
}

// LogCapabilityRevocation logs a capability revocation
func (a *Auditor) LogCapabilityRevocation(capabilityID, reason, revokedBy string, clientInfo *ClientInfo) error {
	event := &AuditEvent{
		Type:           "capability_revocation",
		Category:       "security",
		Severity:       "warning",
		SourceIdentity: revokedBy,
		TargetResource: capabilityID,
		Action:         "revoke",
		Outcome:        "success",
		Description:    fmt.Sprintf("Capability %s revoked: %s", capabilityID, reason),
		CapabilityID:   capabilityID,
		Client:         clientInfo,
		Context:        make(map[string]interface{}),
	}

	// Add revocation context
	event.Context["reason"] = reason
	event.Context["revoked_by"] = revokedBy

	return a.LogEvent(event)
}

// LogPolicyEvaluation logs a policy evaluation
func (a *Auditor) LogPolicyEvaluation(request *types.CapabilityRequest, result *capability.PolicyResult, clientInfo *ClientInfo) error {
	severity := "info"
	if result.Decision == "deny" {
		severity = "warning"
	}

	event := &AuditEvent{
		Type:           "policy_evaluation",
		Category:       "security",
		Severity:       severity,
		SourceIdentity: request.Identity,
		TargetResource: request.Resource,
		Action:         "evaluate_policy",
		Outcome:        result.Decision,
		Description:    fmt.Sprintf("Policy evaluation: %s", result.Decision),
		PolicyID:       fmt.Sprintf("%v", result.AppliedPolicies),
		Client:         clientInfo,
		Context:        make(map[string]interface{}),
	}

	// Add policy context
	event.Context["policy_result"] = result
	event.Context["applied_rules"] = result.AppliedRules
	event.Context["conditions"] = result.Conditions

	return a.LogEvent(event)
}

// LogSecurityEvent logs a generic security event
func (a *Auditor) LogSecurityEvent(eventType, category, severity, description string, context map[string]interface{}) error {
	event := &AuditEvent{
		Type:        eventType,
		Category:    category,
		Severity:    severity,
		Outcome:     "logged",
		Description: description,
		Context:     context,
	}

	return a.LogEvent(event)
}

// SearchEvents searches audit events
func (a *Auditor) SearchEvents(query *AuditQuery) ([]*AuditEvent, error) {
	// TODO: Implement event search
	return []*AuditEvent{}, nil
}

// GetEvent retrieves a specific event by ID
func (a *Auditor) GetEvent(eventID string) (*AuditEvent, error) {
	// TODO: Implement event retrieval
	return nil, fmt.Errorf("not implemented")
}

// openLogFile opens the audit log file
func (a *Auditor) openLogFile() error {
	// Create directory if it doesn't exist
	logDir := filepath.Dir(a.config.LogFilePath)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	// Open log file
	file, err := os.OpenFile(a.config.LogFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	a.logFile = file
	return nil
}

// writeEvent writes an event to the log file
func (a *Auditor) writeEvent(event *AuditEvent) error {
	if a.logFile == nil {
		return fmt.Errorf("log file not open")
	}

	// Serialize event
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to serialize event: %w", err)
	}

	// Write to file
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if _, err := a.logFile.Write(append(data, '\n')); err != nil {
		return fmt.Errorf("failed to write event: %w", err)
	}

	// Sync to disk
	return a.logFile.Sync()
}

// flushRoutine flushes the buffer periodically
func (a *Auditor) flushRoutine() {
	defer a.wg.Done()

	ticker := time.NewTicker(a.flushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-a.shutdown:
			return
		case <-ticker.C:
			a.flushBuffer()
		}
	}
}

// flushBuffer flushes the buffer to disk
func (a *Auditor) flushBuffer() {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if len(a.buffer) == 0 {
		return
	}

	// Write all events
	for _, event := range a.buffer {
		if err := a.writeEvent(event); err != nil {
			// Log error but continue
			fmt.Printf("Failed to write audit event: %v\n", err)
		}
	}

	// Clear buffer
	a.buffer = a.buffer[:0]
}

// generateEventID generates a unique event ID
func (a *Auditor) generateEventID() string {
	return fmt.Sprintf("audit_%d", time.Now().UnixNano())
}

// generateHash generates a hash for the event
func (a *Auditor) generateHash(event *AuditEvent) error {
	// Create hash data
	hashData := map[string]interface{}{
		"id":        event.ID,
		"timestamp": event.Timestamp.Unix(),
		"type":      event.Type,
		"category":  event.Category,
		"severity":  event.Severity,
		"outcome":   event.Outcome,
		"source":    event.SourceIdentity,
		"target":    event.TargetResource,
		"action":    event.Action,
	}

	// Serialize and hash
	data, _ := json.Marshal(hashData)
	hash := sha256.Sum256(data)
	event.Hash = hex.EncodeToString(hash[:])

	return nil
}

// generateSignature generates a digital signature for the event
func (a *Auditor) generateSignature(event *AuditEvent) error {
	// TODO: Implement digital signature
	return nil
}

// sendToSIEM sends event to SIEM system
func (a *Auditor) sendToSIEM(event *AuditEvent) {
	// TODO: Implement SIEM integration
}

// AuditQuery represents a search query for audit events
type AuditQuery struct {
	// Time range
	StartTime *time.Time `json:"startTime,omitempty"`
	EndTime   *time.Time `json:"endTime,omitempty"`

	// Event type filter
	Type string `json:"type,omitempty"`

	// Category filter
	Category string `json:"category,omitempty"`

	// Severity filter
	Severity string `json:"severity,omitempty"`

	// Source identity filter
	SourceIdentity string `json:"sourceIdentity,omitempty"`

	// Target resource filter
	TargetResource string `json:"targetResource,omitempty"`

	// Action filter
	Action string `json:"action,omitempty"`

	// Outcome filter
	Outcome string `json:"outcome,omitempty"`

	// Capability ID filter
	CapabilityID string `json:"capabilityId,omitempty"`

	// Policy ID filter
	PolicyID string `json:"policyId,omitempty"`

	// Text search
	Text string `json:"text,omitempty"`

	// Pagination
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`

	// Sort order
	SortBy    string `json:"sortBy,omitempty"`
	SortOrder string `json:"sortOrder,omitempty"`
}
