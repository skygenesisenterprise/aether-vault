package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/audit"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/auth"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/config"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/injector"
	"github.com/skygenesisenterprise/aether-vault/package/docker/internal/runtime"
)

const (
	version = "1.0.0"
)

func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	if len(os.Args) < 2 {
		logger.Fatal("Usage: aether-runtime <command> [args...]")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Setup signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.WithField("signal", sig.String()).Info("Received signal, shutting down")
		cancel()
	}()

	logger.WithField("version", version).Info("Starting Aether Vault Runtime")

	// 1. Bootstrap sécurisé
	vaultAddr := os.Getenv("AETHER_VAULT_ADDR")
	if vaultAddr == "" {
		vaultAddr = "https://vault:8200"
	}

	vaultToken := os.Getenv("AETHER_VAULT_TOKEN")
	// In production, this should use proper auth methods (Kubernetes, etc.)

	authClient, err := auth.NewClient(auth.Config{
		Address: vaultAddr,
		Token:   vaultToken,
		Logger:  logger,
	})
	if err != nil {
		logger.WithError(err).Fatal("Failed to create auth client")
	}

	// 2. Découverte du contexte
	discovery := config.NewDiscovery(logger)
	appContext, err := discovery.Discover(ctx)
	if err != nil {
		logger.WithError(err).Fatal("Failed to discover application context")
	}

	logger.WithFields(logrus.Fields{
		"service":     appContext.Service,
		"environment": appContext.Environment,
		"role":        appContext.Role,
	}).Info("Discovered application context")

	// 3. Récupération de la configuration
	resolver := config.NewResolver(authClient, logger)
	cfg, err := resolver.Resolve(ctx, appContext)
	if err != nil {
		logger.WithError(err).Fatal("Failed to resolve configuration")
	}

	// 4. Injection sécurisée
	inj := injector.NewInjector(logger)
	env := inj.BuildEnvironment(cfg)

	// 5. Audit
	auditLogger := audit.NewLogger(authClient, logger)
	auditLogger.LogSecretAccess(ctx, appContext, cfg)

	// 6. Exécution contrôlée
	rt := runtime.NewManager(logger, auditLogger)

	cmd := os.Args[1:]
	cmd = append([]string{cmd[0]}, cmd[1:]...)

	exitCode, err := rt.Execute(ctx, cmd, env)
	if err != nil {
		logger.WithError(err).Error("Runtime execution failed")
	}

	// Cleanup
	auditLogger.LogShutdown(ctx, appContext)
	authClient.RevokeToken(ctx)

	os.Exit(exitCode)
}
