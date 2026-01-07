package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

// newHelpCommand creates the help command
func newHelpCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "help",
		Short: "Show help for commands",
		Long: `Display help for Aether Vault CLI commands.

Usage:
  vault help [command]     Show help for a specific command
  vault [command] --help   Show help for a specific command
  vault help               Show this global help

Available help topics:
  init     Initialize local environment
  login    Authenticate with cloud services
  status   Show current status
  version  Display version information

For more information, visit: https://docs.aethervault.com/cli`,
		RunE: runHelpCommand,
	}

	return cmd
}

// runHelpCommand executes the help command
func runHelpCommand(cmd *cobra.Command, args []string) error {
	if len(args) == 0 {
		return showGlobalHelp()
	}

	// Show help for specific command
	command := args[0]
	return showCommandHelp(command)
}

// showGlobalHelp displays global help information
func showGlobalHelp() error {
	fmt.Printf("Aether Vault CLI - DevOps & Security Tool\n")
	fmt.Printf("============================================\n\n")

	fmt.Printf("Aether Vault is a comprehensive secret management and security tool\n")
	fmt.Printf("designed for DevOps workflows and enterprise environments.\n\n")

	fmt.Printf("USAGE:\n")
	fmt.Printf("  vault [command] [flags]\n\n")

	fmt.Printf("CORE COMMANDS:\n")
	fmt.Printf("  init      Initialize local Vault environment\n")
	fmt.Printf("  login     Authenticate with Aether Vault cloud\n")
	fmt.Printf("  status    Show current Vault status\n")
	fmt.Printf("  version   Display CLI version information\n")
	fmt.Printf("  help      Show help for commands\n\n")

	fmt.Printf("MODES:\n")
	fmt.Printf("  Local     Offline secret storage and management\n")
	fmt.Printf("  Cloud     Connected to Aether Vault cloud services\n\n")

	fmt.Printf("QUICK START:\n")
	fmt.Printf("  1. vault init           Initialize local environment\n")
	fmt.Printf("  2. vault status         Check installation status\n")
	fmt.Printf("  3. vault login          Connect to cloud (optional)\n")
	fmt.Printf("  4. vault --help         Explore available commands\n\n")

	fmt.Printf("EXAMPLES:\n")
	fmt.Printf("  vault init --force      Force reinitialization\n")
	fmt.Printf("  vault login --token     Use token authentication\n")
	fmt.Printf("  vault status --verbose  Show detailed status\n")
	fmt.Printf("  vault version --json    Output version as JSON\n\n")

	fmt.Printf("GLOBAL FLAGS:\n")
	fmt.Printf("  --format string   Output format (json, yaml, table)\n")
	fmt.Printf("  --verbose          Enable verbose output\n")
	fmt.Printf("  --config string    Config file path\n\n")

	fmt.Printf("LEARN MORE:\n")
	fmt.Printf("  Documentation: https://docs.aethervault.com/cli\n")
	fmt.Printf("  GitHub:        https://github.com/aethervault/cli\n")
	fmt.Printf("  Community:     https://community.aethervault.com\n\n")

	fmt.Printf("For command-specific help, use: vault [command] --help\n")

	return nil
}

// showCommandHelp displays help for a specific command
func showCommandHelp(command string) error {
	switch command {
	case "init":
		return showInitHelp()
	case "login":
		return showLoginHelp()
	case "status":
		return showStatusHelp()
	case "version":
		return showVersionHelp()
	default:
		return fmt.Errorf("unknown command '%s'", command)
	}
}

// showInitHelp shows help for init command
func showInitHelp() error {
	fmt.Printf("vault init - Initialize local Vault environment\n")
	fmt.Printf("================================================\n\n")

	fmt.Printf("SYNOPSIS:\n")
	fmt.Printf("  vault init [--flags]\n\n")

	fmt.Printf("DESCRIPTION:\n")
	fmt.Printf("  Initialize the local Aether Vault environment by creating the\n")
	fmt.Printf("  necessary directory structure, generating default configuration,\n")
	fmt.Printf("  and setting up encryption keys for local secret storage.\n\n")

	fmt.Printf("FLAGS:\n")
	fmt.Printf("  --path string    Custom path for Vault directory\n")
	fmt.Printf("  --force          Force reinitialization if already exists\n\n")

	fmt.Printf("EXAMPLES:\n")
	fmt.Printf("  vault init                    Initialize with default settings\n")
	fmt.Printf("  vault init --path /tmp/vault  Use custom directory\n")
	fmt.Printf("  vault init --force            Reinitialize existing setup\n\n")

	fmt.Printf("FILES CREATED:\n")
	fmt.Printf("  ~/.aether/vault/config.yaml    Configuration file\n")
	fmt.Printf("  ~/.aether/vault/keys/          Encryption keys\n")
	fmt.Printf("  ~/.aether/vault/data/          Secret storage\n")
	fmt.Printf("  ~/.aether/vault/cache/         Cache directory\n")

	return nil
}

// showLoginHelp shows help for login command
func showLoginHelp() error {
	fmt.Printf("vault login - Authenticate with Aether Vault cloud\n")
	fmt.Printf("===================================================\n\n")

	fmt.Printf("SYNOPSIS:\n")
	fmt.Printf("  vault login [--flags]\n\n")

	fmt.Printf("DESCRIPTION:\n")
	fmt.Printf("  Authenticate with Aether Vault cloud services using OAuth\n")
	fmt.Printf("  or token-based authentication. This enables cloud mode\n")
	fmt.Printf("  and access to enterprise features.\n\n")

	fmt.Printf("FLAGS:\n")
	fmt.Printf("  --method string   Authentication method (oauth, token)\n")
	fmt.Printf("  --token string    API token for token-based auth\n")
	fmt.Printf("  --url string      Aether Vault cloud URL\n\n")

	fmt.Printf("EXAMPLES:\n")
	fmt.Printf("  vault login                    OAuth authentication (default)\n")
	fmt.Printf("  vault login --token abc123     Token-based authentication\n")
	fmt.Printf("  vault login --method oauth     Explicit OAuth method\n\n")

	fmt.Printf("OAUTH FLOW:\n")
	fmt.Printf("  1. Command opens browser authentication\n")
	fmt.Printf("  2. User completes authentication\n")
	fmt.Printf("  3. Authorization code returned\n")
	fmt.Printf("  4. CLI stores tokens securely\n")

	return nil
}

// showStatusHelp shows help for status command
func showStatusHelp() error {
	fmt.Printf("vault status - Show Vault status information\n")
	fmt.Printf("===============================================\n\n")

	fmt.Printf("SYNOPSIS:\n")
	fmt.Printf("  vault status [--flags]\n\n")

	fmt.Printf("DESCRIPTION:\n")
	fmt.Printf("  Display comprehensive status information including current\n")
	fmt.Printf("  execution mode, configuration status, runtime environment,\n")
	fmt.Printf("  and authentication state.\n\n")

	fmt.Printf("FLAGS:\n")
	fmt.Printf("  --verbose        Show detailed status information\n")
	fmt.Printf("  --format string  Output format (json, yaml, table)\n\n")

	fmt.Printf("EXAMPLES:\n")
	fmt.Printf("  vault status                    Basic status information\n")
	fmt.Printf("  vault status --verbose          Detailed status with runtime info\n")
	fmt.Printf("  vault status --format json      Status as JSON\n")
	fmt.Printf("  vault status --format yaml      Status as YAML\n\n")

	fmt.Printf("STATUS FIELDS:\n")
	fmt.Printf("  Mode          Current execution mode (local/cloud)\n")
	fmt.Printf("  Configured    Configuration is loaded and valid\n")
	fmt.Printf("  Authenticated User is authenticated (cloud mode)\n")
	fmt.Printf("  Connected     Connection to cloud is active\n")

	return nil
}

// showVersionHelp shows help for version command
func showVersionHelp() error {
	fmt.Printf("vault version - Display CLI version information\n")
	fmt.Printf("==================================================\n\n")

	fmt.Printf("SYNOPSIS:\n")
	fmt.Printf("  vault version [--flags]\n\n")

	fmt.Printf("DESCRIPTION:\n")
	fmt.Printf("  Display detailed version information including CLI version,\n")
	fmt.Printf("  build information, runtime environment, and system architecture.\n\n")

	fmt.Printf("FLAGS:\n")
	fmt.Printf("  --format string  Output format (json, yaml, table)\n\n")

	fmt.Printf("EXAMPLES:\n")
	fmt.Printf("  vault version                    Version in table format\n")
	fmt.Printf("  vault version --format json      Version as JSON\n")
	fmt.Printf("  vault version --format yaml      Version as YAML\n\n")

	fmt.Printf("VERSION FIELDS:\n")
	fmt.Printf("  Version       CLI version number\n")
	fmt.Printf("  Commit        Git commit hash\n")
	fmt.Printf("  Build Time    Build timestamp\n")
	fmt.Printf("  Go Version    Go runtime version\n")
	fmt.Printf("  OS/Arch       Operating system and architecture\n")

	return nil
}
