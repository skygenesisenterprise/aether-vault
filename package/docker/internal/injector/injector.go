package injector

import (
	"fmt"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/config"
)

type Injector struct {
	logger *logrus.Logger
}

func NewInjector(logger *logrus.Logger) *Injector {
	return &Injector{
		logger: logger,
	}
}

func (i *Injector) BuildEnvironment(cfg *config.Configuration) []string {
	env := make([]string, 0, len(cfg.Secrets)+len(cfg.Config))

	// Inject secrets first (higher precedence)
	for key, value := range cfg.Secrets {
		envVar := i.formatEnvVar(key, value)
		env = append(env, envVar)

		i.logger.WithFields(map[string]interface{}{
			"key":    key,
			"prefix": "AETHER_SECRET",
		}).Debug("Injected secret as environment variable")
	}

	// Inject configuration
	for key, value := range cfg.Config {
		envVar := i.formatEnvVar(key, value)
		env = append(env, envVar)

		i.logger.WithFields(map[string]interface{}{
			"key":    key,
			"prefix": "AETHER_CONFIG",
		}).Debug("Injected config as environment variable")
	}

	// Inject metadata
	for key, value := range cfg.Metadata {
		envVar := i.formatEnvVar(key, value)
		env = append(env, envVar)

		i.logger.WithFields(map[string]interface{}{
			"key":    key,
			"prefix": "AETHER_META",
		}).Debug("Injected metadata as environment variable")
	}

	// Add Aether Vault specific environment variables
	env = append(env, fmt.Sprintf("AETHER_VAULT_INJECTED=true"))
	env = append(env, fmt.Sprintf("AETHER_VAULT_SECRETS_COUNT=%d", len(cfg.Secrets)))
	env = append(env, fmt.Sprintf("AETHER_VAULT_CONFIG_COUNT=%d", len(cfg.Config)))

	if cfg.LeaseInfo.LeaseID != "" {
		env = append(env, fmt.Sprintf("AETHER_VAULT_LEASE_ID=%s", cfg.LeaseInfo.LeaseID))
		env = append(env, fmt.Sprintf("AETHER_VAULT_LEASE_DURATION=%d", cfg.LeaseInfo.LeaseDuration))
		env = append(env, fmt.Sprintf("AETHER_VAULT_LEASE_RENEWABLE=%t", cfg.LeaseInfo.Renewable))
	}

	i.logger.WithField("env_count", len(env)).Info("Environment built successfully")

	return env
}

func (i *Injector) formatEnvVar(key, value string) string {
	// Convert key to uppercase and replace special characters with underscores
	envKey := strings.ToUpper(key)
	envKey = strings.ReplaceAll(envKey, "-", "_")
	envKey = strings.ReplaceAll(envKey, ".", "_")
	envKey = strings.ReplaceAll(envKey, "/", "_")

	// Ensure valid environment variable name
	if strings.HasPrefix(envKey, "_") {
		envKey = "AETHER_" + envKey
	} else if !strings.HasPrefix(envKey, "AETHER_") {
		envKey = "AETHER_" + envKey
	}

	return fmt.Sprintf("%s=%s", envKey, value)
}

func (i *Injector) InjectIntoProcess(env []string) error {
	// Set environment variables for the current process
	for _, envVar := range env {
		parts := strings.SplitN(envVar, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := parts[0]
		value := parts[1]

		if err := os.Setenv(key, value); err != nil {
			return fmt.Errorf("failed to set environment variable %s: %w", key, err)
		}
	}

	i.logger.WithField("env_count", len(env)).Info("Environment variables injected into process")

	return nil
}

func (i *Injector) ValidateEnvironment(cfg *config.Configuration) error {
	// Validate that all required secrets are present
	requiredSecrets := []string{
		// Add any required secret keys here
	}

	for _, requiredKey := range requiredSecrets {
		if _, exists := cfg.Secrets[requiredKey]; !exists {
			return fmt.Errorf("required secret '%s' is missing", requiredKey)
		}
	}

	// Validate environment variable naming
	for key := range cfg.Secrets {
		envKey := i.formatEnvVar(key, "")
		if !isValidEnvVarName(envKey) {
			return fmt.Errorf("invalid environment variable name derived from secret '%s': %s", key, envKey)
		}
	}

	for key := range cfg.Config {
		envKey := i.formatEnvVar(key, "")
		if !isValidEnvVarName(envKey) {
			return fmt.Errorf("invalid environment variable name derived from config '%s': %s", key, envKey)
		}
	}

	return nil
}

func isValidEnvVarName(name string) bool {
	if name == "" {
		return false
	}

	// Remove the =value part for validation
	if idx := strings.Index(name, "="); idx != -1 {
		name = name[:idx]
	}

	// Environment variable names must match: [A-Za-z_][A-Za-z0-9_]*
	for i, char := range name {
		if i == 0 {
			if !((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || char == '_') {
				return false
			}
		} else {
			if !((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') ||
				(char >= '0' && char <= '9') || char == '_') {
				return false
			}
		}
	}

	return true
}
