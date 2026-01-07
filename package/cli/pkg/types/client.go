package types

// Client represents the Vault client interface
type Client interface {
	// GetSecret retrieves a secret
	GetSecret(path string) (*Secret, error)

	// SetSecret stores a secret
	SetSecret(path string, secret *Secret) error

	// DeleteSecret removes a secret
	DeleteSecret(path string) error

	// ListSecrets lists secrets at a path
	ListSecrets(path string) ([]string, error)

	// GetStatus returns client status
	GetStatus() (*ClientStatus, error)

	// Authenticate performs authentication
	Authenticate(method string, credentials interface{}) error

	// Close closes the client
	Close() error
}

// Secret represents a secret
type Secret struct {
	// Secret path
	Path string

	// Secret data
	Data map[string]interface{}

	// Metadata
	Metadata *SecretMetadata

	// Version
	Version int64
}

// SecretMetadata contains secret metadata
type SecretMetadata struct {
	// Creation timestamp
	CreatedAt int64

	// Last modification timestamp
	UpdatedAt int64

	// Created by
	CreatedBy string

	// Last modified by
	UpdatedBy string

	// Tags
	Tags []string

	// TTL
	TTL int64
}

// ClientStatus represents client status
type ClientStatus struct {
	// Is connected
	Connected bool

	// Connection mode
	Mode ExecutionMode

	// Server URL (cloud mode)
	ServerURL string

	// Last sync timestamp
	LastSync *int64

	// Local storage path (local mode)
	LocalPath string

	// Authentication status
	Authenticated bool
}

// SecretFilter represents secret filtering options
type SecretFilter struct {
	// Path pattern
	Path string

	// Tags filter
	Tags []string

	// Created after
	CreatedAfter *int64

	// Updated after
	UpdatedAfter *int64

	// Limit results
	Limit int

	// Offset for pagination
	Offset int
}
