package audit

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/auth"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/config"
)

type Logger struct {
	authClient *auth.Client
	logger     *logrus.Logger
}

func NewLogger(authClient *auth.Client, logger *logrus.Logger) *Logger {
	return &Logger{
		authClient: authClient,
		logger:     logger,
	}
}

func (a *Logger) LogSecretAccess(ctx context.Context, appContext *config.Context, cfg *config.Configuration) {
	event := AuditEvent{
		Timestamp:    time.Now().Unix(),
		EventType:    "secret_access",
		Service:      appContext.Service,
		Environment:  appContext.Environment,
		Role:         appContext.Role,
		Namespace:    appContext.Namespace,
		PodName:      appContext.PodName,
		SecretsCount: len(cfg.Secrets),
		ConfigCount:  len(cfg.Config),
	}

	a.logEvent(ctx, event)
}

func (a *Logger) LogShutdown(ctx context.Context, appContext *config.Context) {
	event := AuditEvent{
		Timestamp:   time.Now().Unix(),
		EventType:   "runtime_shutdown",
		Service:     appContext.Service,
		Environment: appContext.Environment,
		Role:        appContext.Role,
		Namespace:   appContext.Namespace,
		PodName:     appContext.PodName,
	}

	a.logEvent(ctx, event)
}

func (a *Logger) LogProcessExecution(ctx context.Context, cmd []string, exitCode int, err error) {
	event := AuditEvent{
		Timestamp: time.Now().Unix(),
		EventType: "process_execution",
		Command:   fmt.Sprintf("%v", cmd),
		ExitCode:  exitCode,
		Success:   exitCode == 0 && err == nil,
	}

	if err != nil {
		event.Error = err.Error()
	}

	a.logEvent(ctx, event)
}

func (a *Logger) LogTokenRenewal(ctx context.Context, success bool, ttl int) {
	event := AuditEvent{
		Timestamp: time.Now().Unix(),
		EventType: "token_renewal",
		Success:   success,
		TTL:       ttl,
	}

	a.logEvent(ctx, event)
}

func (a *Logger) LogConfigurationResolution(ctx context.Context, appContext *config.Context, paths []string, success bool) {
	event := AuditEvent{
		Timestamp:   time.Now().Unix(),
		EventType:   "config_resolution",
		Service:     appContext.Service,
		Environment: appContext.Environment,
		Role:        appContext.Role,
		Paths:       paths,
		Success:     success,
	}

	a.logEvent(ctx, event)
}

type AuditEvent struct {
	Timestamp    int64    `json:"timestamp"`
	EventType    string   `json:"event_type"`
	Service      string   `json:"service,omitempty"`
	Environment  string   `json:"environment,omitempty"`
	Role         string   `json:"role,omitempty"`
	Namespace    string   `json:"namespace,omitempty"`
	PodName      string   `json:"pod_name,omitempty"`
	Command      string   `json:"command,omitempty"`
	ExitCode     int      `json:"exit_code,omitempty"`
	Success      bool     `json:"success"`
	Error        string   `json:"error,omitempty"`
	SecretsCount int      `json:"secrets_count,omitempty"`
	ConfigCount  int      `json:"config_count,omitempty"`
	TTL          int      `json:"ttl,omitempty"`
	Paths        []string `json:"paths,omitempty"`
}

func (a *Logger) logEvent(ctx context.Context, event AuditEvent) {
	// Log locally (without secrets)
	a.logger.WithFields(map[string]interface{}{
		"event_type":  event.EventType,
		"service":     event.Service,
		"environment": event.Environment,
		"role":        event.Role,
		"success":     event.Success,
		"timestamp":   event.Timestamp,
	}).Info("Audit event logged")

	// Send to Vault for centralized audit logging
	if err := a.sendToVault(ctx, event); err != nil {
		a.logger.WithError(err).Warn("Failed to send audit event to Vault")
	}
}

func (a *Logger) sendToVault(ctx context.Context, event AuditEvent) error {
	// Build audit path
	auditPath := fmt.Sprintf("aether/audit/%s/%s", event.Environment, event.Service)

	// Prepare audit data
	auditData := map[string]interface{}{
		"timestamp":       event.Timestamp,
		"event_type":      event.EventType,
		"service":         event.Service,
		"environment":     event.Environment,
		"role":            event.Role,
		"namespace":       event.Namespace,
		"pod_name":        event.PodName,
		"success":         event.Success,
		"runtime_version": "1.0.0",
	}

	// Add optional fields
	if event.Command != "" {
		auditData["command"] = event.Command
	}
	if event.ExitCode != 0 {
		auditData["exit_code"] = event.ExitCode
	}
	if event.Error != "" {
		auditData["error"] = event.Error
	}
	if event.SecretsCount > 0 {
		auditData["secrets_count"] = event.SecretsCount
	}
	if event.ConfigCount > 0 {
		auditData["config_count"] = event.ConfigCount
	}
	if event.TTL > 0 {
		auditData["ttl"] = event.TTL
	}
	if len(event.Paths) > 0 {
		auditData["paths"] = event.Paths
	}

	// This would require extending the vault client to support writing data
	// For now, we'll just log the intent
	a.logger.WithField("audit_path", auditPath).Debug("Audit event would be sent to Vault")

	return nil
}
