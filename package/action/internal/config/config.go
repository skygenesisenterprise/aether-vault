package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	VaultURL         string
	AuthMethod       string
	Role             string
	PolicyMode       string
	AllowTokenOutput bool
	GithubToken      string
	Audience         string
}

func Load() (*Config, error) {
	cfg := &Config{
		VaultURL:         getEnv("VAULT_URL", ""),
		AuthMethod:       getEnv("AUTH_METHOD", "github-oidc"),
		Role:             getEnv("ROLE", ""),
		PolicyMode:       getEnv("POLICY_MODE", "enforce"),
		AllowTokenOutput: getBoolEnv("ALLOW_TOKEN_OUTPUT", false),
		GithubToken:      getEnv("GITHUB_TOKEN", ""),
		Audience:         getEnv("AUDIENCE", "aether-vault"),
	}

	if cfg.VaultURL == "" {
		return nil, fmt.Errorf("VAULT_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}
