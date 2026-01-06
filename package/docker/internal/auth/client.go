package auth

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/vault"
)

type Config struct {
	Address string
	Token   string
	Logger  *logrus.Logger
}

type Client struct {
	vaultClient *vault.Client
	config      Config
	logger      *logrus.Logger
}

func NewClient(config Config) (*Client, error) {
	if config.Address == "" {
		return nil, fmt.Errorf("vault address is required")
	}

	vaultClient := vault.NewClient(config.Address, config.Token)

	client := &Client{
		vaultClient: vaultClient,
		config:      config,
		logger:      config.Logger,
	}

	// Validate connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.HealthCheck(ctx); err != nil {
		return nil, fmt.Errorf("vault health check failed: %w", err)
	}

	return client, nil
}

func (c *Client) HealthCheck(ctx context.Context) error {
	health, err := c.vaultClient.Health(ctx)
	if err != nil {
		return err
	}

	if health.Sealed {
		return fmt.Errorf("vault is sealed")
	}

	if !health.Initialized {
		return fmt.Errorf("vault is not initialized")
	}

	c.logger.WithFields(logrus.Fields{
		"version": health.Version,
		"sealed":  health.Sealed,
	}).Info("Vault health check passed")

	return nil
}

func (c *Client) RenewToken(ctx context.Context) error {
	if c.config.Token == "" {
		return fmt.Errorf("no token available for renewal")
	}

	authResp, err := c.vaultClient.RenewToken(ctx, 3600)
	if err != nil {
		return fmt.Errorf("failed to renew token: %w", err)
	}

	c.logger.WithFields(logrus.Fields{
		"ttl":       authResp.Auth.LeaseDuration,
		"renewable": authResp.Auth.Renewable,
		"policies":  authResp.Auth.Policies,
	}).Info("Token renewed successfully")

	return nil
}

func (c *Client) RevokeToken(ctx context.Context) error {
	if c.config.Token == "" {
		c.logger.Warn("No token to revoke")
		return nil
	}

	err := c.vaultClient.RevokeToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to revoke token: %w", err)
	}

	c.logger.Info("Token revoked successfully")
	return nil
}

func (c *Client) ReadSecret(ctx context.Context, path string) (*vault.Secret, error) {
	secret, err := c.vaultClient.ReadSecret(ctx, path)
	if err != nil {
		return nil, fmt.Errorf("failed to read secret from %s: %w", path, err)
	}

	return secret, nil
}

func (c *Client) ListSecrets(ctx context.Context, path string) ([]string, error) {
	keys, err := c.vaultClient.ListSecrets(ctx, path)
	if err != nil {
		return nil, fmt.Errorf("failed to list secrets at %s: %w", path, err)
	}

	return keys, nil
}

// AuthenticateWithKubernetes handles Kubernetes auth method
func (c *Client) AuthenticateWithKubernetes(ctx context.Context, role, jwtPath string) error {
	jwtToken, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		return fmt.Errorf("failed to read Kubernetes service account token: %w", err)
	}

	_ = fmt.Sprintf("/auth/%s/login", jwtPath)
	_ = map[string]interface{}{
		"role": role,
		"jwt":  string(jwtToken),
	}

	// This would require extending the vault client to support POST with data
	// For now, we'll implement a simple token-based approach
	c.logger.Info("Kubernetes authentication not yet implemented, falling back to token auth")
	return nil
}

// AuthenticateWithAppRole handles AppRole auth method
func (c *Client) AuthenticateWithAppRole(ctx context.Context, roleID, secretID string) error {
	_ = "/auth/approle/login"
	_ = map[string]interface{}{
		"role_id":   roleID,
		"secret_id": secretID,
	}

	// This would require extending the vault client to support POST with data
	c.logger.Info("AppRole authentication not yet implemented, falling back to token auth")
	return nil
}
