package cmd

import (
	"fmt"
	"os"

	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/config"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/context"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/ui"
	"github.com/spf13/cobra"
)

// NewRootCommand creates the root vault command
func NewRootCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "vault",
		Short: "Aether Vault CLI - DevOps & Security Tool",
		Long: `Aether Vault is a comprehensive DevOps and security tool for secret management.

Use 'vault help' to see available commands or 'vault <command> --help' for command-specific help.

Available modes:
  - Local: Offline secret storage and management
  - Cloud: Connected to Aether Vault cloud services

Quick start:
  vault init     Initialize local environment
  vault status   Check current status
  vault login    Connect to cloud services`,
		RunE: func(cmd *cobra.Command, args []string) error {
			// If no arguments, show help and status
			if len(args) == 0 {
				return runRootCommand(cmd)
			}
			return fmt.Errorf("unknown command '%s'", args[0])
		},
	}

	// Global flags
	cmd.PersistentFlags().String("format", "table", "Output format (json, yaml, table)")
	cmd.PersistentFlags().Bool("verbose", false, "Enable verbose output")
	cmd.PersistentFlags().String("config", "", "Config file path (default is ~/.aether/vault/config.yaml)")

	// Add subcommands
	cmd.AddCommand(newVersionCommand())
	cmd.AddCommand(newInitCommand())
	cmd.AddCommand(newAuthCommand())
	cmd.AddCommand(newStatusCommand())
	cmd.AddCommand(newHelpCommand())

	return cmd
}

// runRootCommand executes the root command behavior
func runRootCommand(cmd *cobra.Command) error {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: Failed to load configuration: %v\n", err)
		cfg = config.Defaults()
	}

	// Create context
	ctx, err := context.New(cfg)
	if err != nil {
		return fmt.Errorf("failed to create context: %w", err)
	}

	// Display welcome banner
	if err := ui.DisplayBanner(); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: Failed to display banner: %v\n", err)
	}

	// Show current status
	status, err := ctx.GetStatus()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: Failed to get status: %v\n", err)
	} else {
		ui.DisplayStatus(status)
	}

	// Show available commands
	fmt.Println("\nAvailable commands:")
	fmt.Println("  init      Initialize local Vault environment")
	fmt.Println("  login     Connect to Aether Vault cloud")
	fmt.Println("  status    Show current Vault status")
	fmt.Println("  version   Display CLI version information")
	fmt.Println("  help      Show help for commands")

	fmt.Println("\nUse 'vault <command> --help' for detailed help.")

	return nil
}
