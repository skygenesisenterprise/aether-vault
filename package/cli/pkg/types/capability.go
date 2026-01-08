package types

import (
	"time"
)

// CapabilityType represents the type of capability
type CapabilityType string

const (
	// CapabilityRead grants read access
	CapabilityRead CapabilityType = "read"
	// CapabilityWrite grants write access
	CapabilityWrite CapabilityType = "write"
	// CapabilityDelete grants delete access
	CapabilityDelete CapabilityType = "delete"
	// CapabilityExecute grants execute access
	CapabilityExecute CapabilityType = "execute"
	// CapabilityAdmin grants administrative access
	CapabilityAdmin CapabilityType = "admin"
)

// Capability represents a cryptographic capability token
type Capability struct {
	// Unique identifier
	ID string `json:"id"`

	// Type of capability
	Type CapabilityType `json:"type"`

	// Resource path (e.g., "secret:/db/primary", "policy:/team/dev")
	Resource string `json:"resource"`

	// Actions allowed (subset of type)
	Actions []string `json:"actions"`

	// Identity that requested the capability
	Identity string `json:"identity"`

	// Issuer (agent ID)
	Issuer string `json:"issuer"`

	// Creation timestamp
	IssuedAt time.Time `json:"issued_at"`

	// Expiration timestamp
	ExpiresAt time.Time `json:"expires_at"`

	// Time-to-live in seconds
	TTL int64 `json:"ttl"`

	// Usage limits
	MaxUses   int `json:"maxUses,omitempty"`
	UsedCount int `json:"usedCount,omitempty"`

	// Cryptographic signature
	Signature []byte `json:"signature,omitempty"`

	// Metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Constraints
	Constraints *CapabilityConstraints `json:"constraints,omitempty"`
}

// CapabilityConstraints represents capability constraints
type CapabilityConstraints struct {
	// IP address constraints
	IPAddresses []string `json:"ipAddresses,omitempty"`

	// Time window constraints
	TimeWindow *TimeWindow `json:"timeWindow,omitempty"`

	// Environment constraints
	Environment map[string]string `json:"environment,omitempty"`

	// Geographic constraints
	Geography *GeographicConstraints `json:"geography,omitempty"`

	// Rate limiting
	RateLimit *RateLimit `json:"rateLimit,omitempty"`
}

// TimeWindow represents time-based constraints
type TimeWindow struct {
	// Allowed hours (24-hour format)
	Hours []int `json:"hours,omitempty"`

	// Allowed days of week (0-6, Sunday=0)
	DaysOfWeek []int `json:"daysOfWeek,omitempty"`

	// Allowed timezones
	Timezones []string `json:"timezones,omitempty"`

	// Blackout periods
	BlackoutPeriods []TimeRange `json:"blackoutPeriods,omitempty"`
}

// TimeRange represents a time range
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// GeographicConstraints represents geographic constraints
type GeographicConstraints struct {
	// Allowed countries (ISO 3166-1 alpha-2)
	Countries []string `json:"countries,omitempty"`

	// Allowed regions/states
	Regions []string `json:"regions,omitempty"`

	// GPS coordinates bounds
	BoundingBox *BoundingBox `json:"boundingBox,omitempty"`
}

// BoundingBox represents geographic bounds
type BoundingBox struct {
	MinLat float64 `json:"minLat"`
	MaxLat float64 `json:"maxLat"`
	MinLng float64 `json:"minLng"`
	MaxLng float64 `json:"maxLng"`
}

// RateLimit represents rate limiting constraints
type RateLimit struct {
	// Requests per second
	RequestsPerSecond float64 `json:"requestsPerSecond"`

	// Burst size
	Burst int `json:"burst"`

	// Window duration in seconds
	WindowDuration int64 `json:"windowDuration"`
}

// CapabilityRequest represents a request for a capability
type CapabilityRequest struct {
	// Requesting identity
	Identity string `json:"identity"`

	// Resource path
	Resource string `json:"resource"`

	// Requested actions
	Actions []string `json:"actions"`

	// Requested TTL
	TTL int64 `json:"ttl,omitempty"`

	// Usage limits
	MaxUses int `json:"maxUses,omitempty"`

	// Constraints
	Constraints *CapabilityConstraints `json:"constraints,omitempty"`

	// Context information
	Context *RequestContext `json:"context,omitempty"`

	// Justification/purpose
	Purpose string `json:"purpose,omitempty"`
}

// RequestContext represents request context
type RequestContext struct {
	// Source IP
	SourceIP string `json:"sourceIP,omitempty"`

	// User agent
	UserAgent string `json:"userAgent,omitempty"`

	// Runtime environment
	Runtime *RuntimeContext `json:"runtime,omitempty"`

	// Session information
	Session *SessionContext `json:"session,omitempty"`

	// Additional metadata
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// RuntimeContext represents runtime context
type RuntimeContext struct {
	// Runtime type (docker, k8s, ci, host)
	Type string `json:"type"`

	// Runtime identifier
	ID string `json:"id"`

	// Runtime version
	Version string `json:"version,omitempty"`

	// Container/pod information
	Container *ContainerContext `json:"container,omitempty"`

	// Host information
	Host *HostContext `json:"host,omitempty"`
}

// ContainerContext represents container context
type ContainerContext struct {
	// Container ID
	ID string `json:"id"`

	// Container name
	Name string `json:"name,omitempty"`

	// Image
	Image string `json:"image,omitempty"`

	// Namespace
	Namespace string `json:"namespace,omitempty"`

	// Labels
	Labels map[string]string `json:"labels,omitempty"`
}

// HostContext represents host context
type HostContext struct {
	// Hostname
	Hostname string `json:"hostname,omitempty"`

	// Platform
	Platform string `json:"platform,omitempty"`

	// Architecture
	Architecture string `json:"architecture,omitempty"`

	// Process ID
	PID int `json:"pid,omitempty"`
}

// SessionContext represents session context
type SessionContext struct {
	// Session ID
	ID string `json:"id,omitempty"`

	// Session start time
	StartedAt time.Time `json:"startedAt,omitempty"`

	// Session duration
	Duration time.Duration `json:"duration,omitempty"`

	// Authentication method
	AuthMethod string `json:"authMethod,omitempty"`
}

// CapabilityResponse represents the response to a capability request
type CapabilityResponse struct {
	// Granted capability
	Capability *Capability `json:"capability,omitempty"`

	// Request status
	Status string `json:"status"`

	// Status message
	Message string `json:"message,omitempty"`

	// Request ID
	RequestID string `json:"requestId"`

	// Processing time
	ProcessingTime time.Duration `json:"processingTime"`

	// Policy evaluation result
	PolicyResult *PolicyResult `json:"policyResult,omitempty"`

	// Errors or warnings
	Issues []Issue `json:"issues,omitempty"`
}

// PolicyResult represents policy evaluation result
type PolicyResult struct {
	// Decision (allow, deny, allow_with_conditions)
	Decision string `json:"decision"`

	// Applied policies
	AppliedPolicies []string `json:"appliedPolicies,omitempty"`

	// Conditions
	Conditions []string `json:"conditions,omitempty"`

	// Reasoning
	Reasoning string `json:"reasoning,omitempty"`

	// Evaluation time
	EvaluationTime time.Duration `json:"evaluationTime"`
}

// Issue represents an issue or warning
type Issue struct {
	// Issue severity (error, warning, info)
	Severity string `json:"severity"`

	// Issue code
	Code string `json:"code"`

	// Issue message
	Message string `json:"message"`

	// Issue details
	Details map[string]interface{} `json:"details,omitempty"`
}

// CapabilityStatus represents capability status
type CapabilityStatus struct {
	// Capability ID
	ID string `json:"id"`

	// Current status
	Status string `json:"status"`

	// Usage statistics
	Usage *CapabilityUsage `json:"usage,omitempty"`

	// Last used timestamp
	LastUsed *time.Time `json:"lastUsed,omitempty"`

	// Revocation information
	Revocation *RevocationInfo `json:"revocation,omitempty"`

	// Validation errors
	ValidationErrors []string `json:"validationErrors,omitempty"`
}

// CapabilityUsage represents capability usage statistics
type CapabilityUsage struct {
	// Total uses
	TotalUses int `json:"totalUses"`

	// Successful uses
	SuccessfulUses int `json:"successfulUses"`

	// Failed uses
	FailedUses int `json:"failedUses"`

	// Last access timestamp
	LastAccess time.Time `json:"lastAccess"`

	// Access pattern
	AccessPattern []AccessEvent `json:"accessPattern,omitempty"`
}

// AccessEvent represents an access event
type AccessEvent struct {
	// Timestamp
	Timestamp time.Time `json:"timestamp"`

	// Action performed
	Action string `json:"action"`

	// Resource accessed
	Resource string `json:"resource"`

	// Success status
	Success bool `json:"success"`

	// Duration
	Duration time.Duration `json:"duration,omitempty"`

	// Error message
	Error string `json:"error,omitempty"`
}

// RevocationInfo represents revocation information
type RevocationInfo struct {
	// Revocation timestamp
	RevokedAt time.Time `json:"revokedAt"`

	// Revocation reason
	Reason string `json:"reason"`

	// Revoked by
	RevokedBy string `json:"revokedBy"`

	// Revocation method
	Method string `json:"method"`
}

// CapabilityFilter represents filtering options for capabilities
type CapabilityFilter struct {
	// Identity filter
	Identity string `json:"identity,omitempty"`

	// Resource filter
	Resource string `json:"resource,omitempty"`

	// Type filter
	Type CapabilityType `json:"type,omitempty"`

	// Status filter
	Status string `json:"status,omitempty"`

	// Issuer filter
	Issuer string `json:"issuer,omitempty"`

	// Time range
	TimeRange *TimeRange `json:"timeRange,omitempty"`

	// Metadata filter
	Metadata map[string]interface{} `json:"metadata,omitempty"`

	// Pagination
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`

	// Sort order
	SortBy    string `json:"sortBy,omitempty"`
	SortOrder string `json:"sortOrder,omitempty"`
}

// CapabilityStore represents the interface for capability storage
type CapabilityStore interface {
	// Store a capability
	Store(capability *Capability) error

	// Retrieve a capability by ID
	Retrieve(id string) (*Capability, error)

	// List capabilities with filtering
	List(filter *CapabilityFilter) ([]*Capability, error)

	// Revoke a capability
	Revoke(id string, reason string, revokedBy string) error

	// Cleanup expired capabilities
	Cleanup() error

	// Get usage statistics
	GetUsage(id string) (*CapabilityUsage, error)

	// Update usage
	UpdateUsage(id string, event *AccessEvent) error
}

// CapabilityValidator represents the interface for capability validation
type CapabilityValidator interface {
	// Validate a capability
	Validate(capability *Capability, context *RequestContext) (*ValidationResult, error)

	// Validate signature
	ValidateSignature(capability *Capability) error

	// Validate constraints
	ValidateConstraints(capability *Capability, context *RequestContext) error

	// Validate expiration
	ValidateExpiration(capability *Capability) error

	// Validate usage limits
	ValidateUsage(capability *Capability) error
}

// ValidationResult represents the result of capability validation
type ValidationResult struct {
	// Validation status
	Valid bool `json:"valid"`

	// Validation errors
	Errors []ValidationError `json:"errors,omitempty"`

	// Validation warnings
	Warnings []ValidationWarning `json:"warnings,omitempty"`

	// Validation time
	ValidationTime time.Duration `json:"validationTime"`

	// Additional context
	Context map[string]interface{} `json:"context,omitempty"`
}

// ValidationError represents a validation error
type ValidationError struct {
	// Error code
	Code string `json:"code"`

	// Error message
	Message string `json:"message"`

	// Error field
	Field string `json:"field,omitempty"`

	// Error details
	Details map[string]interface{} `json:"details,omitempty"`
}

// ValidationWarning represents a validation warning
type ValidationWarning struct {
	// Warning code
	Code string `json:"code"`

	// Warning message
	Message string `json:"message"`

	// Warning field
	Field string `json:"field,omitempty"`

	// Warning details
	Details map[string]interface{} `json:"details,omitempty"`
}
