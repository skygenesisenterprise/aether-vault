# Quick Start Guide

## Introduction

This guide will help you get started with Aether Vault CLI in minutes. You'll learn how to install the CLI, initialize your environment, request your first capability, and integrate it with a simple application.

## Prerequisites

- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Go**: Version 1.21 or later (for building from source)
- **Unix Socket Support**: Required for IPC communication

## Installation

### Option 1: Download Binary (Recommended)

```bash
# Download the latest binary for your platform
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault

# Make it executable
chmod +x vault

# Move to system PATH
sudo mv vault /usr/local/bin/

# Verify installation
vault version
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/cli

# Build the CLI
make build

# Install to system PATH
make install

# Verify installation
vault version
```

### Option 3: Package Manager

```bash
# macOS with Homebrew (coming soon)
brew install aether-vault/tap/vault

# Linux with apt (coming soon)
sudo apt update
sudo apt install aether-vault-cli
```

## Initial Setup

### 1. Initialize Local Environment

```bash
# Initialize your local vault environment
vault init

# Output:
# ✓ Created configuration directory: /home/user/.aether-vault
# ✓ Generated default configuration file
# ✓ Created policy directory: /home/user/.aether-vault/policies
# ✓ Created audit log file: /home/user/.aether-vault/audit.log
# ✓ Local environment initialized successfully
```

### 2. Start the Agent

```bash
# Start the Aether Vault Agent
vault agent start

# Output:
# Starting Aether Vault Agent...
# Configuration loaded from /home/user/.aether-vault/agent.yaml
# Capability engine initialized with Ed25519 signing
# Policy engine loaded 1 policies from /home/user/.aether-vault/policies
# Audit system started with file logging
# IPC server listening on /home/user/.aether-vault/agent.sock
# Agent started successfully (PID: 12345)
```

### 3. Verify Setup

```bash
# Check agent status
vault agent status

# Output:
# Aether Vault Agent Status:
#   Running: true
#   PID: 12345
#   Uptime: 2m30s
#   Version: 1.0.0
#
# IPC Server:
#   Socket Path: /home/user/.aether-vault/agent.sock
#   Active Connections: 0
#
# Capability Engine:
#   Status: Healthy
#   Total Capabilities: 0
```

## Your First Capability

### 1. Request a Read Capability

```bash
# Request a capability to read a database secret
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300 \
  --purpose "Database connection for my app"

# Output:
# Capability Request Result:
#   Status: granted
#   Request ID: req_1234567890_abcdef
#   Processing Time: 45ms
#
# Capability Details:
#   ID: cap_1234567890_ghijkl
#   Type: read
#   Resource: secret:/db/primary
#   Actions: read
#   Identity: user
#   Issuer: aether-vault-agent
#   TTL: 300 seconds
#   Max Uses: 100
#   Issued At: 2024-01-08T10:00:00Z
#   Expires At: 2024-01-08T10:05:00Z
```

### 2. Validate the Capability

```bash
# Validate the capability (using the ID from above)
vault capability validate cap_1234567890_ghijkl

# Output:
# Capability Validation Result:
#   Valid: true
#   Validation Time: 12ms
```

### 3. List Active Capabilities

```bash
# List all active capabilities
vault capability list --status active

# Output:
# Found 1 capabilities:
#
# ID                   Type            Resource                        Identity         Expires
# --------------------------------------------------------------------------------------------------------------
# cap_1234567890_ghi   read            secret:/db/primary             user             2024-01-08 10:05:00
```

## Integration Examples

### Go Application Example

Create a simple Go application that uses capabilities:

```go
package main

import (
    "fmt"
    "log"
    "os"
    "time"

    "github.com/skygenesisenterprise/aether-vault/package/cli/internal/ipc"
    "github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

func main() {
    // Create IPC client
    client, err := ipc.NewClient(nil)
    if err != nil {
        log.Fatal("Failed to create client:", err)
    }
    defer client.Close()

    // Connect to agent
    if err := client.Connect(); err != nil {
        log.Fatal("Failed to connect to agent:", err)
    }

    // Request capability
    request := &types.CapabilityRequest{
        Identity: "demo-app",
        Resource: "secret:/db/primary",
        Actions:  []string{"read"},
        TTL:      300,
        Purpose:  "Demo application database access",
    }

    response, err := client.RequestCapability(request)
    if err != nil {
        log.Fatal("Failed to request capability:", err)
    }

    if response.Status != "granted" {
        log.Fatal("Capability denied:", response.Message)
    }

    // Validate capability
    result, err := client.ValidateCapability(response.Capability.ID, nil)
    if err != nil || !result.Valid {
        log.Fatal("Capability validation failed")
    }

    fmt.Printf("✓ Capability %s is valid\n", response.Capability.ID)
    fmt.Printf("✓ Granted access to %s\n", response.Capability.Resource)
    fmt.Printf("✓ Expires at %s\n", response.Capability.ExpiresAt.Format(time.RFC3339))

    // Simulate using the capability
    fmt.Printf("✓ Accessing database...\n")
    time.Sleep(2 * time.Second)
    fmt.Printf("✓ Database operation completed\n")

    // Revoke capability when done
    err = client.RevokeCapability(response.Capability.ID, "Demo completed")
    if err != nil {
        log.Printf("Warning: Failed to revoke capability: %v", err)
    } else {
        fmt.Printf("✓ Capability revoked\n")
    }
}
```

Save this as `demo.go` and run:

```bash
go mod init demo-app
go mod tidy
go run demo.go
```

### Shell Script Example

Create a shell script that uses capabilities:

```bash
#!/bin/bash

# demo-script.sh

set -e

echo "🔐 Aether Vault CLI Demo"
echo "========================="

# Request capability
echo "📋 Requesting read capability for database..."
RESPONSE=$(vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300 \
  --purpose "Shell script demo" \
  --format json)

# Extract capability ID
CAP_ID=$(echo "$RESPONSE" | jq -r '.capability.id')
EXPIRES_AT=$(echo "$RESPONSE" | jq -r '.capability.expires_at')

echo "✓ Capability granted: $CAP_ID"
echo "✓ Expires at: $EXPIRES_AT"

# Validate capability
echo "🔍 Validating capability..."
VALIDATION=$(vault capability validate "$CAP_ID" --format json)
IS_VALID=$(echo "$VALIDATION" | jq -r '.valid')

if [ "$IS_VALID" = "true" ]; then
    echo "✓ Capability is valid"

    # Simulate database access
    echo "🗄️  Accessing database..."
    sleep 2
    echo "✓ Database operation completed"

    # Revoke capability
    echo "🗑️  Revoking capability..."
    vault capability revoke "$CAP_ID" --reason "Demo completed"
    echo "✓ Capability revoked"
else
    echo "❌ Capability validation failed"
    exit 1
fi

echo "🎉 Demo completed successfully!"
```

Make it executable and run:

```bash
chmod +x demo-script.sh
./demo-script.sh
```

### Python Example

Create a Python script that uses capabilities:

```python
#!/usr/bin/env python3

# demo.py

import subprocess
import json
import sys
import time

def run_vault_command(args):
    """Run vault command and return JSON result"""
    cmd = ["vault"] + args + ["--format", "json"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ Vault command failed: {e.stderr}")
        sys.exit(1)

def main():
    print("🔐 Aether Vault CLI Python Demo")
    print("================================")

    # Request capability
    print("📋 Requesting read capability for database...")
    response = run_vault_command([
        "capability", "request",
        "--resource", "secret:/db/primary",
        "--action", "read",
        "--ttl", "300",
        "--purpose", "Python demo"
    ])

    if response["status"] != "granted":
        print(f"❌ Capability denied: {response.get('message', 'Unknown error')}")
        sys.exit(1)

    cap = response["capability"]
    print(f"✓ Capability granted: {cap['id']}")
    print(f"✓ Expires at: {cap['expires_at']}")

    # Validate capability
    print("🔍 Validating capability...")
    validation = run_vault_command(["capability", "validate", cap["id"]])

    if not validation.get("valid", False):
        print("❌ Capability validation failed")
        sys.exit(1)

    print("✓ Capability is valid")

    # Simulate database access
    print("🗄️  Accessing database...")
    time.sleep(2)
    print("✓ Database operation completed")

    # Revoke capability
    print("🗑️  Revoking capability...")
    try:
        subprocess.run([
            "vault", "capability", "revoke", cap["id"],
            "--reason", "Python demo completed"
        ], check=True, capture_output=True)
        print("✓ Capability revoked")
    except subprocess.CalledProcessError:
        print("⚠️  Failed to revoke capability")

    print("🎉 Python demo completed successfully!")

if __name__ == "__main__":
    main()
```

Run the Python demo:

```bash
python3 demo.py
```

## Configuration Basics

### View Current Configuration

```bash
# Show current configuration
vault config show

# Output:
# Agent Configuration:
#   Mode: standard
#   Log Level: info
#   Socket Path: /home/user/.aether-vault/agent.sock
#
# Capability Engine:
#   Enable: true
#   Default TTL: 300
#   Max TTL: 3600
#   Max Uses: 100
```

### Generate Default Configuration

```bash
# Generate default configuration to file
vault agent config --generate --output ~/.aether-vault/agent.yaml

# View the generated file
cat ~/.aether-vault/agent.yaml
```

### Environment Variables

```bash
# Set common environment variables
export VAULT_LOG_LEVEL=debug
export VAULT_AGENT_SOCKET_PATH=/tmp/vault.sock

# Use with commands
vault capability status --verbose
```

## Policy Basics

### View Default Policy

```bash
# View the default policy
cat ~/.aether-vault/policies/default.json

# Output:
# {
#   "id": "default",
#   "name": "Default Policy",
#   "version": "1.0",
#   "status": "active",
#   "rules": [
#     {
#       "id": "allow-local",
#       "effect": "allow",
#       "resources": ["secret:*"],
#       "actions": ["*"],
#       "identities": ["*"],
#       "priority": 100
#     }
#   ],
#   "created_at": "2024-01-08T10:00:00Z",
#   "created_by": "user"
# }
```

### Create a Custom Policy

```bash
# Create a restrictive policy
cat > ~/.aether-vault/policies/restrictive.json << 'EOF'
{
  "id": "restrictive",
  "name": "Restrictive Policy",
  "version": "1.0",
  "status": "active",
  "rules": [
    {
      "id": "app-read-db",
      "effect": "allow",
      "resources": ["secret:/db/*"],
      "actions": ["read"],
      "identities": ["app:*"],
      "priority": 100
    },
    {
      "id": "deny-sensitive",
      "effect": "deny",
      "resources": ["secret:/sensitive/*"],
      "actions": ["*"],
      "identities": ["*"],
      "priority": 200
    }
  ],
  "created_at": "2024-01-08T10:00:00Z",
  "created_by": "user"
}
EOF

# Reload agent to apply new policy
vault agent reload
```

## Audit and Monitoring

### View Audit Logs

```bash
# View recent audit events
tail -f ~/.aether-vault/audit.log

# Output:
# {"id":"audit_1234567890","timestamp":"2024-01-08T10:00:00Z","type":"capability_request","category":"security","severity":"info","source_identity":"user","target_resource":"secret:/db/primary","action":"request:read","outcome":"granted","capability_id":"cap_1234567890","request_id":"req_1234567890"}
```

### Monitor Agent Health

```bash
# Detailed agent status
vault agent status --verbose

# Monitor specific metrics
watch -n 5 'vault agent status --verbose | grep -E "(Active|Total|Cache)"'
```

## Common Workflows

### Workflow 1: Database Access

```bash
# 1. Request database capability
DB_CAP=$(vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 600 \
  --format json | jq -r '.capability.id')

# 2. Use capability in application
export DB_CAPABILITY_ID="$DB_CAP"
./my-database-app

# 3. Revoke when done
vault capability revoke "$DB_CAP" --reason "Database operation completed"
```

### Workflow 2: Configuration Access

```bash
# 1. Request config capability
CONFIG_CAP=$(vault capability request \
  --resource "secret:/config/production" \
  --action read \
  --ttl 300 \
  --format json | jq -r '.capability.id')

# 2. Export config using capability
vault capability validate "$CONFIG_CAP" && \
  cat /etc/production/config.json

# 3. Capability auto-expires (no need to revoke)
```

### Workflow 3: Deployment Access

```bash
# 1. Request deployment capability
DEPLOY_CAP=$(vault capability request \
  --resource "operation:/deploy/production" \
  --action execute \
  --ttl 900 \
  --purpose "Production deployment" \
  --format json | jq -r '.capability.id')

# 2. Run deployment
./deploy.sh --capability "$DEPLOY_CAP"

# 3. Revoke after deployment
vault capability revoke "$DEPLOY_CAP" --reason "Deployment completed"
```

## Troubleshooting

### Common Issues

#### Agent Not Running

```bash
# Check if agent is running
vault agent status

# Start agent if not running
vault agent start

# Check for socket file
ls -la ~/.aether-vault/agent.sock
```

#### Permission Denied

```bash
# Check file permissions
ls -la ~/.aether-vault/

# Fix permissions
chmod 700 ~/.aether-vault/
chmod 600 ~/.aether-vault/config.yaml
```

#### Capability Denied

```bash
# Request with verbose output
vault capability request \
  --resource "secret:/test" \
  --action read \
  --verbose

# Check policies
ls ~/.aether-vault/policies/

# Check audit logs for denial reason
grep "denied" ~/.aether-vault/audit.log | tail -5
```

#### Connection Issues

```bash
# Test agent connection
vault capability status

# Check socket path
echo $VAULT_AGENT_SOCKET_PATH

# Test with custom socket path
vault capability status --socket-path /tmp/vault.sock
```

### Debug Mode

```bash
# Enable debug logging
export VAULT_LOG_LEVEL=debug

# Start agent in debug mode
vault agent start --log-level debug --mode development

# Run commands with verbose output
vault capability request --resource "secret:/test" --action read --verbose
```

### Reset Environment

```bash
# Stop agent
vault agent stop

# Remove all data (WARNING: This deletes everything)
rm -rf ~/.aether-vault/

# Reinitialize
vault init
vault agent start
```

## Next Steps

### Learn More

1. **Read the Architecture**: [ARCHITECTURE_DEEP_DIVE.md](ARCHITECTURE_DEEP_DIVE.md)
2. **Understand CBAC**: [CBAC_OVERVIEW.md](CBAC_OVERVIEW.md)
3. **Explore Policies**: [CBAC_POLICIES.md](CBAC_POLICIES.md)
4. **Integration Guides**: [INTEGRATION_OVERVIEW.md](INTEGRATION_OVERVIEW.md)

### Advanced Topics

1. **Custom Policies**: Create sophisticated access control policies
2. **Constraints**: Use IP, time, and environment constraints
3. **Audit Integration**: Set up SIEM integration
4. **High Availability**: Deploy multiple agents for redundancy
5. **Performance Tuning**: Optimize for high-throughput scenarios

### Production Deployment

1. **Security Hardening**: Configure for production security
2. **Monitoring Setup**: Set up metrics and alerting
3. **Backup Strategy**: Implement proper backup procedures
4. **Compliance**: Configure for regulatory compliance
5. **Disaster Recovery**: Plan for outage scenarios

## Community and Support

- **Documentation**: [https://docs.aethervault.com](https://docs.aethervault.com)
- **GitHub**: [https://github.com/skygenesisenterprise/aether-vault](https://github.com/skygenesisenterprise/aether-vault)
- **Discord**: [https://discord.gg/aethervault](https://discord.gg/aethervault)
- **Issues**: [GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)

---

_Congratulations! You've successfully set up Aether Vault CLI and requested your first capability. For more advanced usage, see the other documentation files in this directory._
