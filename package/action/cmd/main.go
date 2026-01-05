package main

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
	"github.com/skygenesisenterprise/package/action/internal/config"
	"github.com/skygenesisenterprise/package/action/internal/vault"
)

func main() {
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	cfg, err := config.Load()
	if err != nil {
		logger.WithError(err).Fatal("Failed to load configuration")
	}

	logger.WithFields(logrus.Fields{
		"vault_url":   cfg.VaultURL,
		"auth_method": cfg.AuthMethod,
		"role":        cfg.Role,
		"policy_mode": cfg.PolicyMode,
	}).Info("Starting Aether Vault Action")

	vaultClient := vault.NewClient(cfg, logger)

	token, err := vaultClient.Authenticate()
	if err != nil {
		logger.WithError(err).Fatal("Authentication failed")
	}

	status, reportID, err := vaultClient.ExecutePolicyCheck(token)
	if err != nil {
		logger.WithError(err).Fatal("Policy check failed")
	}

	if status == "violation" && cfg.PolicyMode == "enforce" {
		logger.WithFields(logrus.Fields{
			"status":    status,
			"report_id": reportID,
		}).Fatal("Policy violation detected - job failed")
	}

	outputs := map[string]string{
		"status":    status,
		"report_id": reportID,
	}

	if cfg.AllowTokenOutput {
		outputs["vault_token"] = token
	}

	for key, value := range outputs {
		outputFile := fmt.Sprintf("/github/workspace/output_%s.txt", key)
		if err := os.WriteFile(outputFile, []byte(value), 0644); err != nil {
			logger.WithError(err).Errorf("Failed to write output %s", key)
		}
		fmt.Printf("::set-output name=%s::%s\n", key, value)
	}

	logger.WithFields(logrus.Fields{
		"status":    status,
		"report_id": reportID,
	}).Info("Aether Vault Action completed successfully")
}
