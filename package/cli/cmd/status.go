package cmd

import (
	"fmt"
	"os"
	"runtime"

	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/config"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/context"
	"github.com/spf13/cobra"
)

// newStatusCommand creates the status command
func newStatusCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show Vault status information",
		Long: `Display comprehensive status information including:
  - Current execution mode (local/cloud)
  - Configuration status
  - Runtime environment
  - Authentication state
  - Connection status`,
		RunE: runStatusCommand,
	}

	cmd.Flags().Bool("verbose", false, "Show detailed status information")
	cmd.Flags().String("format", "table", "Output format (json, yaml, table)")

	return cmd
}

// runStatusCommand executes the status command
func runStatusCommand(cmd *cobra.Command, args []string) error {
	verbose, _ := cmd.Flags().GetBool("verbose")
	format, _ := cmd.Flags().GetString("format")

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

	// Get status
	status, err := ctx.GetStatus()
	if err != nil {
		return fmt.Errorf("failed to get status: %w", err)
	}

	// Build status information
	statusInfo := buildStatusInfo(status, verbose)

	// Output based on format
	switch format {
	case "json":
		return outputStatusJSON(statusInfo)
	case "yaml":
		return outputStatusYAML(statusInfo)
	default:
		return outputStatusTable(statusInfo, verbose)
	}
}

// buildStatusInfo builds comprehensive status information
func buildStatusInfo(status *context.Status, verbose bool) map[string]interface{} {
	info := map[string]interface{}{
		"mode":          string(status.Mode),
		"configured":    status.Configured,
		"authenticated": status.Authenticated,
		"connected":     status.Connected,
	}

	if verbose {
		info["runtime"] = map[string]interface{}{
			"os":         runtime.GOOS,
			"arch":       runtime.GOARCH,
			"go_version": runtime.Version(),
		}

		if status.ConfigPath != "" {
			info["config_path"] = status.ConfigPath
		}

		if status.ServerURL != "" {
			info["server_url"] = status.ServerURL
		}

		if status.LocalPath != "" {
			info["local_path"] = status.LocalPath
		}

		if status.LastSync != nil {
			info["last_sync"] = status.LastSync
		}
	}

	return info
}

// outputStatusTable displays status in table format
func outputStatusTable(info map[string]interface{}, verbose bool) error {
	fmt.Printf("Aether Vault Status\n")
	fmt.Printf("===================\n\n")

	// Basic status
	fmt.Printf("Mode:          %s\n", info["mode"])
	fmt.Printf("Configured:    %s\n", getBoolStatus(info["configured"].(bool)))
	fmt.Printf("Authenticated: %s\n", getBoolStatus(info["authenticated"].(bool)))
	fmt.Printf("Connected:     %s\n", getBoolStatus(info["connected"].(bool)))

	// Verbose information
	if verbose {
		if runtime, ok := info["runtime"].(map[string]interface{}); ok {
			fmt.Printf("\nRuntime:\n")
			fmt.Printf("  OS:        %s\n", runtime["os"])
			fmt.Printf("  Arch:      %s\n", runtime["arch"])
			fmt.Printf("  Go:        %s\n", runtime["go_version"])
		}

		if configPath, ok := info["config_path"].(string); ok && configPath != "" {
			fmt.Printf("\nConfig Path: %s\n", configPath)
		}

		if serverURL, ok := info["server_url"].(string); ok && serverURL != "" {
			fmt.Printf("Server URL:  %s\n", serverURL)
		}

		if localPath, ok := info["local_path"].(string); ok && localPath != "" {
			fmt.Printf("Local Path:  %s\n", localPath)
		}
	}

	// Mode-specific information
	switch info["mode"] {
	case "local":
		fmt.Printf("\n✓ Running in local mode - offline operation\n")
	case "cloud":
		fmt.Printf("\n✓ Connected to Aether Vault cloud\n")
	}

	return nil
}

// outputStatusJSON outputs status as JSON
func outputStatusJSON(info map[string]interface{}) error {
	// TODO: Implement JSON output
	fmt.Printf("JSON output not yet implemented\n")
	return nil
}

// outputStatusYAML outputs status as YAML
func outputStatusYAML(info map[string]interface{}) error {
	// TODO: Implement YAML output
	fmt.Printf("YAML output not yet implemented\n")
	return nil
}

// getBoolStatus returns a formatted boolean status
func getBoolStatus(status bool) string {
	if status {
		return "✓ Yes"
	}
	return "✗ No"
}
