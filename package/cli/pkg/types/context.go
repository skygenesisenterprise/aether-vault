package types

// ExecutionMode represents the execution mode of the CLI
type ExecutionMode string

const (
	// LocalMode represents offline/local execution
	LocalMode ExecutionMode = "local"

	// CloudMode represents connected/cloud execution
	CloudMode ExecutionMode = "cloud"
)

// Context represents the execution context
type Context struct {
	// Current execution mode
	Mode ExecutionMode

	// Configuration
	Config *Config

	// Runtime information
	Runtime *RuntimeInfo

	// Authentication state
	Auth *AuthState
}

// RuntimeInfo contains runtime environment information
type RuntimeInfo struct {
	// Operating system
	OS string

	// Architecture
	Arch string

	// Go version
	GoVersion string

	// CLI version
	Version string

	// Build information
	Build *BuildInfo

	// Environment variables
	Env map[string]string
}

// BuildInfo contains build information
type BuildInfo struct {
	// Git commit hash
	Commit string

	// Build timestamp
	Timestamp string

	// Build environment (dev, prod)
	Environment string

	// Build tools version
	ToolsVersion string
}

// AuthState represents authentication state
type AuthState struct {
	// Is authenticated
	Authenticated bool

	// Authentication method
	Method string

	// Token information
	Token *TokenInfo

	// User information
	User *UserInfo

	// Expiration time
	ExpiresAt *int64
}

// TokenInfo contains token information
type TokenInfo struct {
	// Access token
	AccessToken string

	// Refresh token
	RefreshToken string

	// Token type
	Type string

	// Token scope
	Scope string
}

// UserInfo contains user information
type UserInfo struct {
	// User ID
	ID string

	// Username
	Username string

	// Email
	Email string

	// Display name
	DisplayName string

	// Organization
	Organization string
}
