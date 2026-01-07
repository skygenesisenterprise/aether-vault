package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
	"gopkg.in/yaml.v3"
)

// Manager handles configuration operations
type Manager interface {
	Load() (*types.Config, error)
	Save(config *types.Config) error
	GetDefaults() *types.Config
	Validate(config *types.Config) error
}

// Load loads configuration from default location
func Load() (*types.Config, error) {
	configPath := getDefaultConfigPath()

	// Check if config exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Return defaults if no config exists
		return Defaults(), nil
	}

	return LoadFromFile(configPath)
}

// LoadFromFile loads configuration from specific file
func LoadFromFile(path string) (*types.Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config types.Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Apply environment variable overrides
	if err := applyEnvOverrides(&config); err != nil {
		return nil, fmt.Errorf("failed to apply environment overrides: %w", err)
	}

	// Validate configuration
	if err := Validate(&config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return &config, nil
}

// Save saves configuration to default location
func Save(config *types.Config) error {
	configPath := getDefaultConfigPath()

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	return SaveToFile(config, configPath)
}

// SaveToFile saves configuration to specific file
func SaveToFile(config *types.Config, path string) error {
	// Validate before saving
	if err := Validate(config); err != nil {
		return fmt.Errorf("invalid configuration: %w", err)
	}

	data, err := yaml.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// Defaults returns default configuration
func Defaults() *types.Config {
	return &types.Config{
		General: types.GeneralConfig{
			DefaultFormat: "table",
			Verbose:       false,
			Timeout:       30 * 1000000000, // 30 seconds
		},
		Local: types.LocalConfig{
			Path:            getDefaultVaultPath(),
			KeyFile:         filepath.Join(getDefaultVaultPath(), "keys", "vault.key"),
			AutoLockTimeout: 10 * 60 * 1000000000, // 10 minutes
		},
		Cloud: types.CloudConfig{
			URL:        "https://cloud.aethervault.com",
			AuthMethod: "oauth",
			OAuth: types.OAuthConfig{
				ClientID:    "vault-cli",
				Scopes:      []string{"vault:read", "vault:write"},
				RedirectURL: "http://localhost:8080/callback",
			},
		},
		UI: types.UIConfig{
			Color:      true,
			Spinner:    true,
			TableStyle: "default",
		},
	}
}

// Validate validates configuration
func Validate(config *types.Config) error {
	if config == nil {
		return fmt.Errorf("config cannot be nil")
	}

	// Validate general config
	if config.General.DefaultFormat == "" {
		return fmt.Errorf("default format cannot be empty")
	}

	// Validate local config
	if config.Local.Path == "" {
		return fmt.Errorf("local path cannot be empty")
	}

	if config.Local.KeyFile == "" {
		return fmt.Errorf("key file path cannot be empty")
	}

	// Validate cloud config
	if config.Cloud.URL == "" {
		return fmt.Errorf("cloud URL cannot be empty")
	}

	if config.Cloud.AuthMethod == "" {
		return fmt.Errorf("auth method cannot be empty")
	}

	return nil
}

// getDefaultConfigPath returns the default configuration file path
func getDefaultConfigPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "./config.yaml"
	}
	return filepath.Join(home, ".aether", "vault", "config.yaml")
}

// getDefaultVaultPath returns the default vault directory path
func getDefaultVaultPath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "./.aether-vault"
	}
	return filepath.Join(home, ".aether", "vault")
}

// applyEnvOverrides applies environment variable overrides
func applyEnvOverrides(config *types.Config) error {
	// General overrides
	if format := os.Getenv("VAULT_FORMAT"); format != "" {
		config.General.DefaultFormat = format
	}

	if verbose := os.Getenv("VAULT_VERBOSE"); verbose != "" {
		config.General.Verbose = verbose == "true"
	}

	// Local overrides
	if path := os.Getenv("VAULT_PATH"); path != "" {
		config.Local.Path = path
	}

	// Cloud overrides
	if url := os.Getenv("VAULT_URL"); url != "" {
		config.Cloud.URL = url
	}

	if token := os.Getenv("VAULT_TOKEN"); token != "" {
		config.Cloud.Token = token
	}

	// UI overrides
	if color := os.Getenv("VAULT_COLOR"); color != "" {
		config.UI.Color = color == "true"
	}

	return nil
}
