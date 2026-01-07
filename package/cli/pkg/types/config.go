package types

import "time"

// Config represents the CLI configuration
type Config struct {
	// General settings
	General GeneralConfig `yaml:"general"`

	// Local storage settings
	Local LocalConfig `yaml:"local"`

	// Cloud connection settings
	Cloud CloudConfig `yaml:"cloud"`

	// UI settings
	UI UIConfig `yaml:"ui"`
}

// GeneralConfig contains general CLI settings
type GeneralConfig struct {
	// Default output format (json, yaml, table)
	DefaultFormat string `yaml:"default_format"`

	// Enable verbose output
	Verbose bool `yaml:"verbose"`

	// Timeout for operations
	Timeout time.Duration `yaml:"timeout"`
}

// LocalConfig contains local storage settings
type LocalConfig struct {
	// Path to local vault directory
	Path string `yaml:"path"`

	// Encryption key file
	KeyFile string `yaml:"key_file"`

	// Auto-lock timeout
	AutoLockTimeout time.Duration `yaml:"auto_lock_timeout"`
}

// CloudConfig contains cloud connection settings
type CloudConfig struct {
	// Aether Vault cloud URL
	URL string `yaml:"url"`

	// Authentication method (oauth, token)
	AuthMethod string `yaml:"auth_method"`

	// API token (if token auth)
	Token string `yaml:"token"`

	// OAuth settings
	OAuth OAuthConfig `yaml:"oauth"`
}

// OAuthConfig contains OAuth authentication settings
type OAuthConfig struct {
	// Client ID
	ClientID string `yaml:"client_id"`

	// OAuth scopes
	Scopes []string `yaml:"scopes"`

	// Redirect URL for local flow
	RedirectURL string `yaml:"redirect_url"`
}

// UIConfig contains user interface settings
type UIConfig struct {
	// Enable colors
	Color bool `yaml:"color"`

	// Enable progress spinners
	Spinner bool `yaml:"spinner"`

	// Table style (default, minimal, full)
	TableStyle string `yaml:"table_style"`
}
