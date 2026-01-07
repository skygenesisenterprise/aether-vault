package main

import (
	"fmt"
	"os"

	"github.com/skygenesisenterprise/aether-vault/package/cli/cmd"
)

func main() {
	// Create root command
	rootCmd := cmd.NewRootCommand()

	// Execute command
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
