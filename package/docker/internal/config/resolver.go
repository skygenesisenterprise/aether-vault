package config

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/auth"
)

type Context struct {
	Service     string
	Environment string
	Role        string
	Namespace   string
	PodName     string
	NodeName    string
}

type Discovery struct {
	logger *logrus.Logger
}

func NewDiscovery(logger *logrus.Logger) *Discovery {
	return &Discovery{
		logger: logger,
	}
}

func (d *Discovery) Discover(ctx context.Context) (*Context, error) {
	context := &Context{}

	// Discover from environment variables
	if service := os.Getenv("AETHER_SERVICE_NAME"); service != "" {
		context.Service = service
	} else {
		// Fallback to executable name
		if len(os.Args) > 1 {
			context.Service = filepath.Base(os.Args[1])
		} else {
			context.Service = "unknown"
		}
	}

	if env := os.Getenv("AETHER_ENVIRONMENT"); env != "" {
		context.Environment = env
	} else {
		context.Environment = "development"
	}

	if role := os.Getenv("AETHER_ROLE"); role != "" {
		context.Role = role
	} else {
		context.Role = "default"
	}

	// Kubernetes context discovery
	if namespace := os.Getenv("KUBERNETES_NAMESPACE"); namespace != "" {
		context.Namespace = namespace
	}
	if podName := os.Getenv("KUBERNETES_POD_NAME"); podName != "" {
		context.PodName = podName
	}
	if nodeName := os.Getenv("KUBERNETES_NODE_NAME"); nodeName != "" {
		context.NodeName = nodeName
	}

	d.logger.WithFields(map[string]interface{}{
		"service":     context.Service,
		"environment": context.Environment,
		"role":        context.Role,
		"namespace":   context.Namespace,
		"pod":         context.PodName,
	}).Info("Discovered application context")

	return context, nil
}

type Configuration struct {
	Secrets   map[string]string `json:"secrets"`
	Config    map[string]string `json:"config"`
	Metadata  map[string]string `json:"metadata"`
	LeaseInfo LeaseInfo         `json:"lease_info"`
}

type LeaseInfo struct {
	LeaseID       string `json:"lease_id"`
	LeaseDuration int    `json:"lease_duration"`
	Renewable     bool   `json:"renewable"`
}

type Resolver struct {
	authClient *auth.Client
	logger     *logrus.Logger
}

func NewResolver(authClient *auth.Client, logger *logrus.Logger) *Resolver {
	return &Resolver{
		authClient: authClient,
		logger:     logger,
	}
}

func (r *Resolver) Resolve(ctx context.Context, appContext *Context) (*Configuration, error) {
	config := &Configuration{
		Secrets:  make(map[string]string),
		Config:   make(map[string]string),
		Metadata: make(map[string]string),
	}

	// Build Vault paths based on context
	paths := r.buildVaultPaths(appContext)

	for _, path := range paths {
		r.logger.WithField("path", path).Debug("Resolving configuration from Vault")

		secret, err := r.authClient.ReadSecret(ctx, path)
		if err != nil {
			r.logger.WithFields(map[string]interface{}{
				"path":  path,
				"error": err.Error(),
			}).Warn("Failed to read secret from Vault")
			continue
		}

		// Process secret data
		if secret.Data != nil {
			r.processSecretData(secret.Data, config, path)
		}

		// Store lease information
		if secret.LeaseID != "" {
			config.LeaseInfo = LeaseInfo{
				LeaseID:       secret.LeaseID,
				LeaseDuration: secret.LeaseDuration,
				Renewable:     secret.Renewable,
			}
		}
	}

	// Add metadata about resolution
	config.Metadata["resolved_at"] = fmt.Sprintf("%d", 0) // TODO: add timestamp
	config.Metadata["service"] = appContext.Service
	config.Metadata["environment"] = appContext.Environment
	config.Metadata["role"] = appContext.Role

	r.logger.WithFields(map[string]interface{}{
		"secrets_count": len(config.Secrets),
		"config_count":  len(config.Config),
	}).Info("Configuration resolved successfully")

	return config, nil
}

func (r *Resolver) buildVaultPaths(appContext *Context) []string {
	var paths []string

	// Standard Aether Vault path structure
	// 1. Service-specific configuration
	paths = append(paths, fmt.Sprintf("aether/config/%s/%s", appContext.Environment, appContext.Service))

	// 2. Role-specific secrets
	paths = append(paths, fmt.Sprintf("aether/secrets/%s/%s/%s", appContext.Environment, appContext.Service, appContext.Role))

	// 3. Global environment configuration
	paths = append(paths, fmt.Sprintf("aether/config/%s/global", appContext.Environment))

	// 4. Service-specific secrets (if role is default)
	if appContext.Role == "default" {
		paths = append(paths, fmt.Sprintf("aether/secrets/%s/%s", appContext.Environment, appContext.Service))
	}

	// 5. Kubernetes-specific paths (if running in Kubernetes)
	if appContext.Namespace != "" {
		paths = append(paths, fmt.Sprintf("aether/k8s/%s/%s/%s", appContext.Namespace, appContext.Service, appContext.Role))
	}

	return paths
}

func (r *Resolver) processSecretData(data map[string]interface{}, config *Configuration, path string) {
	for key, value := range data {
		strValue, ok := value.(string)
		if !ok {
			r.logger.WithFields(map[string]interface{}{
				"key":  key,
				"path": path,
				"type": fmt.Sprintf("%T", value),
			}).Debug("Skipping non-string value")
			continue
		}

		// Determine if this is a secret or config based on path and key naming
		if strings.Contains(path, "/secrets/") || strings.Contains(key, "password") ||
			strings.Contains(key, "secret") || strings.Contains(key, "key") ||
			strings.Contains(key, "token") {
			config.Secrets[key] = strValue
		} else {
			config.Config[key] = strValue
		}
	}
}

func (r *Resolver) RenewLeases(ctx context.Context, config *Configuration) error {
	if config.LeaseInfo.LeaseID == "" || !config.LeaseInfo.Renewable {
		r.logger.Debug("No renewable leases to renew")
		return nil
	}

	// This would require extending the vault client to support lease renewal
	r.logger.Info("Lease renewal not yet implemented")
	return nil
}
