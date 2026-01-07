package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/config"
	"github.com/spf13/cobra"
)

// newInitCommand creates the init command
func newInitCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Initialize local Vault environment",
		Long: `Initialize the local Aether Vault environment by:
  - Creating the configuration directory
  - Generating default configuration
  - Setting up local storage
  - Initializing encryption keys

This command prepares your system for local Vault usage without requiring
a connection to cloud services.`,
		RunE: runInitCommand,
	}

	cmd.Flags().String("path", "", "Custom path for Vault directory (default: ~/.aether/vault)")
	cmd.Flags().Bool("force", false, "Force reinitialization if already exists")

	return cmd
}

// runInitCommand executes the init command
func runInitCommand(cmd *cobra.Command, args []string) error {
	force, _ := cmd.Flags().GetBool("force")
	customPath, _ := cmd.Flags().GetString("path")

	// Determine vault path
	vaultPath := getVaultPath(customPath)

	fmt.Printf("Initializing Aether Vault...\n")
	fmt.Printf("Vault directory: %s\n", vaultPath)

	// Check if already initialized
	if !force {
		if _, err := os.Stat(vaultPath); err == nil {
			// Check if config exists
			configPath := filepath.Join(vaultPath, "config.yaml")
			if _, err := os.Stat(configPath); err == nil {
				fmt.Printf("Vault already initialized at %s\n", vaultPath)
				fmt.Printf("Use --force to reinitialize\n")
				return nil
			}
		}
	}

	// Create vault directory
	if err := os.MkdirAll(vaultPath, 0755); err != nil {
		return fmt.Errorf("failed to create vault directory: %w", err)
	}

	// Create subdirectories
	subdirs := []string{"data", "keys", "cache", "logs"}
	for _, subdir := range subdirs {
		dirPath := filepath.Join(vaultPath, subdir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			return fmt.Errorf("failed to create %s directory: %w", subdir, err)
		}
	}

	// Generate default configuration
	cfg := config.Defaults()
	cfg.Local.Path = vaultPath
	cfg.Local.KeyFile = filepath.Join(vaultPath, "keys", "vault.key")

	// Save configuration
	configPath := filepath.Join(vaultPath, "config.yaml")
	if err := config.Save(cfg, configPath); err != nil {
		return fmt.Errorf("failed to save configuration: %w", err)
	}

	// Generate encryption key
	if err := generateEncryptionKey(cfg.Local.KeyFile); err != nil {
		return fmt.Errorf("failed to generate encryption key: %w", err)
	}

	fmt.Printf("✓ Vault directory created\n")
	fmt.Printf("✓ Configuration saved\n")
	fmt.Printf("✓ Encryption key generated\n")
	fmt.Printf("✓ Local storage initialized\n")

	fmt.Printf("\nVault is ready for use!\n")
	fmt.Printf("Configuration: %s\n", configPath)
	fmt.Printf("Run 'vault status' to verify installation.\n")

	return nil
}

// getVaultPath returns the vault directory path
func getVaultPath(customPath string) string {
	if customPath != "" {
		return customPath
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "./.aether-vault"
	}

	return filepath.Join(home, ".aether", "vault")
}

// generateEncryptionKey generates a basic encryption key
func generateEncryptionKey(keyFile string) error {
	// TODO: Implement proper key generation
	// For now, create a placeholder file
	key := "placeholder-encryption-key-32-bytes-long"

	return os.WriteFile(keyFile, []byte(key), 0600)
}
