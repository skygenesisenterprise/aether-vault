package cmd

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/agent"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/config"
	"github.com/spf13/cobra"
)

var (
	agentConfigFile string
	agentMode       string
	agentLogLevel   string
)

// newAgentCommand creates the agent command group
func newAgentCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "agent",
		Short: "Manage Aether Vault Agent (security daemon)",
		Long: `Aether Vault Agent is a long-lived security daemon that provides:
  - Local policy evaluation and enforcement
  - Secure secrets management with caching
  - Runtime environment integration
  - Comprehensive audit and logging
  
The agent operates as a local authority of trust for all operations.`,
	}

	cmd.AddCommand(newAgentStartCommand())
	cmd.AddCommand(newAgentStopCommand())
	cmd.AddCommand(newAgentStatusCommand())
	cmd.AddCommand(newAgentReloadCommand())
	cmd.AddCommand(newAgentConfigCommand())

	return cmd
}

// newAgentStartCommand creates the agent start command
func newAgentStartCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the Aether Vault Agent daemon",
		Long: `Start the Aether Vault Agent as a long-lived daemon process.
The agent will:
  - Initialize local policy engine
  - Start IPC server on Unix socket
  - Begin runtime monitoring
  - Enable audit logging`,
		RunE: runAgentStartCommand,
	}

	cmd.Flags().StringVar(&agentConfigFile, "config", "", "Path to agent configuration file")
	cmd.Flags().StringVar(&agentMode, "mode", "standard", "Agent mode: standard, hardened, development")
	cmd.Flags().StringVar(&agentLogLevel, "log-level", "info", "Log level: debug, info, warn, error")

	return cmd
}

// newAgentStopCommand creates the agent stop command
func newAgentStopCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the Aether Vault Agent daemon",
		Long: `Gracefully stop the Aether Vault Agent daemon.
The agent will:
  - Stop accepting new connections
  - Complete in-flight operations
  - Flush all audit logs
  - Clean up temporary resources`,
		RunE: runAgentStopCommand,
	}

	return cmd
}

// newAgentStatusCommand creates the agent status command
func newAgentStatusCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show agent daemon status and health",
		Long: `Display comprehensive status information about the Aether Vault Agent:
  - Process status and uptime
  - IPC server status
  - Policy engine statistics
  - Cache hit rates
  - Recent audit events
  - Runtime integration status`,
		RunE: runAgentStatusCommand,
	}

	cmd.Flags().Bool("verbose", false, "Show detailed status information")
	cmd.Flags().String("format", "table", "Output format: table, json, yaml")

	return cmd
}

// newAgentReloadCommand creates the agent reload command
func newAgentCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "reload",
		Short: "Reload agent configuration and policies",
		Long: `Reload the agent configuration and cached policies:
  - Reload configuration from file
  - Refresh policy cache
  - Restart policy engine
  - Maintain existing connections
  - Log reload events`,
		RunE: runAgentReloadCommand,
	}

	return cmd
}

// newAgentConfigCommand creates the agent configuration command
func newAgentCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "config",
		Short: "Manage agent configuration",
		Long: `Manage Aether Vault Agent configuration:
  - Show current configuration
  - Generate default configuration
  - Validate configuration
  - Set configuration values`,
		RunE: runAgentConfigCommand,
	}

	cmd.Flags().String("output", "", "Output configuration to file")
	cmd.Flags().Bool("validate", false, "Validate configuration only")

	return cmd
}

// runAgentStartCommand executes the agent start command
func runAgentStartCommand(cmd *cobra.Command, args []string) error {
	// Load configuration
	cfg, err := loadAgentConfig()
	if err != nil {
		return fmt.Errorf("failed to load agent configuration: %w", err)
	}

	// Create agent instance
	agentInstance, err := agent.NewAgent(cfg)
	if err != nil {
		return fmt.Errorf("failed to create agent: %w", err)
	}

	// Setup signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)

	// Start the agent in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		if err := agentInstance.Start(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "Agent failed to start: %v\n", err)
			cancel()
		}
	}()

	// Wait for signals
	for {
		select {
		case sig := <-sigChan:
			fmt.Printf("Received signal %v, shutting down agent...\n", sig)
			if err := agentInstance.Stop(ctx); err != nil {
				fmt.Fprintf(os.Stderr, "Error stopping agent: %v\n", err)
			}
			return nil
		case <-ctx.Done():
			return nil
		case <-time.After(time.Second):
			// Check agent health
			if status, err := agentInstance.Health(); err != nil || status.Status != "healthy" {
				fmt.Fprintf(os.Stderr, "Agent unhealthy: %v\n", err)
				cancel()
			}
		}
	}
}

// runAgentStopCommand executes the agent stop command
func runAgentStopCommand(cmd *cobra.Command, args []string) error {
	// Connect to running agent
	client, err := agent.NewAgentClient()
	if err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}
	defer client.Close()

	// Stop the agent
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := client.Stop(ctx); err != nil {
		return fmt.Errorf("failed to stop agent: %w", err)
	}

	fmt.Println("Agent stopped successfully")
	return nil
}

// runAgentStatusCommand executes the agent status command
func runAgentStatusCommand(cmd *cobra.Command, args []string) error {
	verbose, _ := cmd.Flags().GetBool("verbose")
	format, _ := cmd.Flags().GetString("format")

	// Connect to running agent
	client, err := agent.NewAgentClient()
	if err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}
	defer client.Close()

	// Get agent status
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	status, err := client.Status(ctx, verbose)
	if err != nil {
		return fmt.Errorf("failed to get agent status: %w", err)
	}

	// Output status based on format
	switch format {
	case "json":
		return outputStatusJSON(status)
	case "yaml":
		return outputStatusYAML(status)
	default:
		return outputStatusTable(status, verbose)
	}
}

// runAgentReloadCommand executes the agent reload command
func runAgentReloadCommand(cmd *cobra.Command, args []string) error {
	// Connect to running agent
	client, err := agent.NewAgentClient()
	if err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}
	defer client.Close()

	// Reload configuration
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := client.Reload(ctx); err != nil {
		return fmt.Errorf("failed to reload agent: %w", err)
	}

	fmt.Println("Agent reloaded successfully")
	return nil
}

// runAgentConfigCommand executes the agent config command
func runAgentConfigCommand(cmd *cobra.Command, args []string) error {
	output, _ := cmd.Flags().GetString("output")
	validate, _ := cmd.Flags().GetBool("validate")

	// Generate default configuration
	cfg := agent.DefaultAgentConfig()

	// Validate if requested
	if validate {
		if err := cfg.Validate(); err != nil {
			return fmt.Errorf("configuration validation failed: %w", err)
		}
		fmt.Println("Configuration is valid")
		return nil
	}

	// Output configuration
	if output != "" {
		return cfg.SaveToFile(output)
	}

	// Print to stdout
	return cfg.Print()
}

// loadAgentConfig loads agent configuration
func loadAgentConfig() (*agent.AgentConfig, error) {
	if agentConfigFile != "" {
		return agent.LoadAgentConfigFromFile(agentConfigFile)
	}

	// Try default locations
	paths := []string{
		"/etc/aether-vault/agent.yaml",
		"~/.aether-vault/agent.yaml",
		"./agent.yaml",
	}

	for _, path := range paths {
		if cfg, err := agent.LoadAgentConfigFromFile(path); err == nil {
			return cfg, nil
		}
	}

	// Return default configuration
	return agent.DefaultAgentConfig(), nil
}
