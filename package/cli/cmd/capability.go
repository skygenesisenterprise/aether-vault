package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/capability"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/ipc"
	"github.com/skygenesisenterprise/aether-vault/package/cli/internal/ui"
	"github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
	"github.com/spf13/cobra"
)

var (
	// Capability request flags
	capResource    string
	capActions     []string
	capTTL         int64
	capMaxUses     int
	capIdentity    string
	capPurpose     string
	capConstraints string
	capContext     string

	// Capability list flags
	capListIdentity string
	capListType     string
	capListStatus   string
	capListLimit    int
	capListOffset   int

	// Capability validation flags
	capValidateContext string

	// Capability revoke flags
	capRevokeReason string
)

// newCapabilityCommand creates the capability command group
func newCapabilityCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "capability",
		Short: "Manage Aether Vault capabilities",
		Long: `Aether Vault capabilities are cryptographic tokens that grant
specific, time-limited access to resources with built-in audit trails.

Commands:
  request    Request a new capability
  validate   Validate an existing capability
  list       List capabilities
  revoke     Revoke a capability
  status     Show capability system status`,
	}

	cmd.AddCommand(newCapabilityRequestCommand())
	cmd.AddCommand(newCapabilityValidateCommand())
	cmd.AddCommand(newCapabilityListCommand())
	cmd.AddCommand(newCapabilityRevokeCommand())
	cmd.AddCommand(newCapabilityStatusCommand())

	return cmd
}

// newCapabilityRequestCommand creates the capability request command
func newCapabilityRequestCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "request",
		Short: "Request a new capability",
		Long: `Request a new capability for accessing specific resources.
The capability will be evaluated against policies and returned if approved.`,
		RunE: runCapabilityRequestCommand,
	}

	cmd.Flags().StringVar(&capResource, "resource", "", "Resource path (required)")
	cmd.Flags().StringSliceVar(&capActions, "action", []string{}, "Action(s) to grant (required)")
	cmd.Flags().Int64Var(&capTTL, "ttl", 0, "Time-to-live in seconds (default: 300)")
	cmd.Flags().IntVar(&capMaxUses, "max-uses", 0, "Maximum number of uses (default: 100)")
	cmd.Flags().StringVar(&capIdentity, "identity", "", "Requesting identity")
	cmd.Flags().StringVar(&capPurpose, "purpose", "", "Purpose of the request")
	cmd.Flags().StringVar(&capConstraints, "constraints", "", "Constraints in JSON format")
	cmd.Flags().StringVar(&capContext, "context", "", "Request context in JSON format")

	cmd.MarkFlagRequired("resource")
	cmd.MarkFlagRequired("action")

	return cmd
}

// newCapabilityValidateCommand creates the capability validate command
func newCapabilityValidateCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "validate [capability-id]",
		Short: "Validate a capability",
		Long: `Validate an existing capability to check if it's still valid
and can be used for resource access.`,
		Args: cobra.ExactArgs(1),
		RunE: runCapabilityValidateCommand,
	}

	cmd.Flags().StringVar(&capValidateContext, "context", "", "Validation context in JSON format")

	return cmd
}

// newCapabilityListCommand creates the capability list command
func newCapabilityListCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List capabilities",
		Long: `List existing capabilities with optional filtering.
Use flags to filter by identity, type, status, etc.`,
		RunE: runCapabilityListCommand,
	}

	cmd.Flags().StringVar(&capListIdentity, "identity", "", "Filter by identity")
	cmd.Flags().StringVar(&capListType, "type", "", "Filter by capability type")
	cmd.Flags().StringVar(&capListStatus, "status", "", "Filter by status")
	cmd.Flags().IntVar(&capListLimit, "limit", 50, "Limit number of results")
	cmd.Flags().IntVar(&capListOffset, "offset", 0, "Offset for pagination")

	return cmd
}

// newCapabilityRevokeCommand creates the capability revoke command
func newCapabilityRevokeCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "revoke [capability-id]",
		Short: "Revoke a capability",
		Long: `Revoke an existing capability, making it invalid for future use.
Provide a reason for the revocation which will be logged.`,
		Args: cobra.ExactArgs(1),
		RunE: runCapabilityRevokeCommand,
	}

	cmd.Flags().StringVar(&capRevokeReason, "reason", "Manual revocation", "Reason for revocation")

	return cmd
}

// newCapabilityStatusCommand creates the capability status command
func newCapabilityStatusCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "status",
		Short: "Show capability system status",
		Long: `Display the current status of the capability system including
engine status, policy engine status, and audit information.`,
		RunE: runCapabilityStatusCommand,
	}

	return cmd
}

// runCapabilityRequestCommand executes the capability request command
func runCapabilityRequestCommand(cmd *cobra.Command, args []string) error {
	// Create IPC client
	client, err := ipc.NewClient(nil)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	// Connect to agent
	if err := client.Connect(); err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}

	// Parse constraints
	var constraints *types.CapabilityConstraints
	if capConstraints != "" {
		constraints = &types.CapabilityConstraints{}
		if err := json.Unmarshal([]byte(capConstraints), constraints); err != nil {
			return fmt.Errorf("invalid constraints format: %w", err)
		}
	}

	// Parse context
	var context *types.RequestContext
	if capContext != "" {
		context = &types.RequestContext{}
		if err := json.Unmarshal([]byte(capContext), context); err != nil {
			return fmt.Errorf("invalid context format: %w", err)
		}
	}

	// Create capability request
	request := &types.CapabilityRequest{
		Identity:    capIdentity,
		Resource:    capResource,
		Actions:     capActions,
		TTL:         capTTL,
		MaxUses:     capMaxUses,
		Constraints: constraints,
		Context:     context,
		Purpose:     capPurpose,
	}

	// Request capability
	response, err := client.RequestCapability(request)
	if err != nil {
		return fmt.Errorf("capability request failed: %w", err)
	}

	// Display response
	format, _ := cmd.Flags().GetString("format")
	return displayCapabilityResponse(response, format)
}

// runCapabilityValidateCommand executes the capability validate command
func runCapabilityValidateCommand(cmd *cobra.Command, args []string) error {
	capabilityID := args[0]

	// Create IPC client
	client, err := ipc.NewClient(nil)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	// Connect to agent
	if err := client.Connect(); err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}

	// Parse context
	var context *types.RequestContext
	if capValidateContext != "" {
		context = &types.RequestContext{}
		if err := json.Unmarshal([]byte(capValidateContext), context); err != nil {
			return fmt.Errorf("invalid context format: %w", err)
		}
	}

	// Validate capability
	result, err := client.ValidateCapability(capabilityID, context)
	if err != nil {
		return fmt.Errorf("capability validation failed: %w", err)
	}

	// Display result
	format, _ := cmd.Flags().GetString("format")
	return displayValidationResult(result, format)
}

// runCapabilityListCommand executes the capability list command
func runCapabilityListCommand(cmd *cobra.Command, args []string) error {
	// Create IPC client
	client, err := ipc.NewClient(nil)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	// Connect to agent
	if err := client.Connect(); err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}

	// Create filter
	filter := &types.CapabilityFilter{
		Identity: capListIdentity,
		Type:     types.CapabilityType(capListType),
		Status:   capListStatus,
		Limit:    capListLimit,
		Offset:   capListOffset,
	}

	// List capabilities
	capabilities, err := client.ListCapabilities(filter)
	if err != nil {
		return fmt.Errorf("capability list failed: %w", err)
	}

	// Display results
	format, _ := cmd.Flags().GetString("format")
	return displayCapabilityList(capabilities, format)
}

// runCapabilityRevokeCommand executes the capability revoke command
func runCapabilityRevokeCommand(cmd *cobra.Command, args []string) error {
	capabilityID := args[0]

	// Create IPC client
	client, err := ipc.NewClient(nil)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	// Connect to agent
	if err := client.Connect(); err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}

	// Revoke capability
	if err := client.RevokeCapability(capabilityID, capRevokeReason); err != nil {
		return fmt.Errorf("capability revocation failed: %w", err)
	}

	// Display success
	fmt.Printf("Capability %s revoked successfully\n", capabilityID)
	fmt.Printf("Reason: %s\n", capRevokeReason)

	return nil
}

// runCapabilityStatusCommand executes the capability status command
func runCapabilityStatusCommand(cmd *cobra.Command, args []string) error {
	// Create IPC client
	client, err := ipc.NewClient(nil)
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}
	defer client.Close()

	// Connect to agent
	if err := client.Connect(); err != nil {
		return fmt.Errorf("failed to connect to agent: %w", err)
	}

	// Get server status
	serverInfo, err := client.GetStatus()
	if err != nil {
		return fmt.Errorf("failed to get server status: %w", err)
	}

	// Display status
	format, _ := cmd.Flags().GetString("format")
	return displayCapabilityStatus(serverInfo, format)
}

// displayCapabilityResponse displays capability response
func displayCapabilityResponse(response *types.CapabilityResponse, format string) error {
	switch format {
	case "json":
		data, _ := json.MarshalIndent(response, "", "  ")
		fmt.Println(string(data))
	case "yaml":
		// TODO: Implement YAML output
		fmt.Println("YAML format not yet implemented")
	default:
		// Table format
		fmt.Printf("Capability Request Result:\n")
		fmt.Printf("  Status: %s\n", response.Status)
		fmt.Printf("  Request ID: %s\n", response.RequestID)
		fmt.Printf("  Processing Time: %v\n", response.ProcessingTime)

		if response.Capability != nil {
			fmt.Printf("\nCapability Details:\n")
			fmt.Printf("  ID: %s\n", response.Capability.ID)
			fmt.Printf("  Type: %s\n", response.Capability.Type)
			fmt.Printf("  Resource: %s\n", response.Capability.Resource)
			fmt.Printf("  Actions: %s\n", strings.Join(response.Capability.Actions, ", "))
			fmt.Printf("  Identity: %s\n", response.Capability.Identity)
			fmt.Printf("  Issuer: %s\n", response.Capability.Issuer)
			fmt.Printf("  TTL: %d seconds\n", response.Capability.TTL)
			fmt.Printf("  Max Uses: %d\n", response.Capability.MaxUses)
			fmt.Printf("  Issued At: %s\n", response.Capability.IssuedAt.Format(time.RFC3339))
			fmt.Printf("  Expires At: %s\n", response.Capability.ExpiresAt.Format(time.RFC3339))
		}

		if response.PolicyResult != nil {
			fmt.Printf("\nPolicy Evaluation:\n")
			fmt.Printf("  Decision: %s\n", response.PolicyResult.Decision)
			fmt.Printf("  Applied Policies: %s\n", strings.Join(response.PolicyResult.AppliedPolicies, ", "))
			if response.PolicyResult.Reasoning != "" {
				fmt.Printf("  Reasoning: %s\n", response.PolicyResult.Reasoning)
			}
		}

		if len(response.Issues) > 0 {
			fmt.Printf("\nIssues:\n")
			for _, issue := range response.Issues {
				fmt.Printf("  %s: %s\n", issue.Severity, issue.Message)
			}
		}
	}

	return nil
}

// displayValidationResult displays validation result
func displayValidationResult(result *types.ValidationResult, format string) error {
	switch format {
	case "json":
		data, _ := json.MarshalIndent(result, "", "  ")
		fmt.Println(string(data))
	case "yaml":
		// TODO: Implement YAML output
		fmt.Println("YAML format not yet implemented")
	default:
		// Table format
		fmt.Printf("Capability Validation Result:\n")
		fmt.Printf("  Valid: %t\n", result.Valid)
		fmt.Printf("  Validation Time: %v\n", result.ValidationTime)

		if len(result.Errors) > 0 {
			fmt.Printf("\nErrors:\n")
			for _, err := range result.Errors {
				fmt.Printf("  %s: %s\n", err.Code, err.Message)
				if err.Field != "" {
					fmt.Printf("    Field: %s\n", err.Field)
				}
			}
		}

		if len(result.Warnings) > 0 {
			fmt.Printf("\nWarnings:\n")
			for _, warning := range result.Warnings {
				fmt.Printf("  %s: %s\n", warning.Code, warning.Message)
				if warning.Field != "" {
					fmt.Printf("    Field: %s\n", warning.Field)
				}
			}
		}

		if len(result.Context) > 0 {
			fmt.Printf("\nContext:\n")
			for key, value := range result.Context {
				fmt.Printf("  %s: %v\n", key, value)
			}
		}
	}

	return nil
}

// displayCapabilityList displays capability list
func displayCapabilityList(capabilities []*types.Capability, format string) error {
	switch format {
	case "json":
		data, _ := json.MarshalIndent(capabilities, "", "  ")
		fmt.Println(string(data))
	case "yaml":
		// TODO: Implement YAML output
		fmt.Println("YAML format not yet implemented")
	default:
		// Table format
		if len(capabilities) == 0 {
			fmt.Println("No capabilities found")
			return nil
		}

		fmt.Printf("Found %d capabilities:\n\n", len(capabilities))

		// Table header
		fmt.Printf("%-20s %-15s %-30s %-15s %-20s\n", "ID", "Type", "Resource", "Identity", "Expires")
		fmt.Printf("%s\n", strings.Repeat("-", 110))

		// Table rows
		for _, cap := range capabilities {
			id := cap.ID
			if len(id) > 18 {
				id = id[:15] + "..."
			}

			resource := cap.Resource
			if len(resource) > 28 {
				resource = resource[:25] + "..."
			}

			identity := cap.Identity
			if len(identity) > 13 {
				identity = identity[:10] + "..."
			}

			expires := cap.ExpiresAt.Format("2006-01-02 15:04:05")
			fmt.Printf("%-20s %-15s %-30s %-15s %-20s\n", id, cap.Type, resource, identity, expires)
		}
	}

	return nil
}

// displayCapabilityStatus displays capability system status
func displayCapabilityStatus(serverInfo *ipc.ServerInfo, format string) error {
	switch format {
	case "json":
		data, _ := json.MarshalIndent(serverInfo, "", "  ")
		fmt.Println(string(data))
	case "yaml":
		// TODO: Implement YAML output
		fmt.Println("YAML format not yet implemented")
	default:
		// Table format
		fmt.Printf("Aether Vault Agent Status:\n")
		fmt.Printf("  Version: %s\n", serverInfo.Version)
		fmt.Printf("  Uptime: %v\n", serverInfo.Uptime)
		fmt.Printf("  Connections: %d\n", serverInfo.ConnectionCount)

		if len(serverInfo.Capabilities) > 0 {
			fmt.Printf("\nCapabilities:\n")
			for _, cap := range serverInfo.Capabilities {
				fmt.Printf("  - %s\n", cap)
			}
		}
	}

	return nil
}
