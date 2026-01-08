# Aether Vault CLI Documentation

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Commands](#commands)
- [Capability-Based Access Control (CBAC)](#capability-based-access-control-cbac)
- [Configuration](#configuration)
- [Integration](#integration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Overview

Aether Vault CLI is a comprehensive command-line interface for the Aether Vault security ecosystem. It provides secure secret management, capability-based access control, and enterprise-grade security features for DevOps and security workflows.

### Key Features

- **Capability-Based Access Control (CBAC)**: Cryptographic, time-limited access tokens
- **Local and Cloud Modes**: Offline operation with optional cloud synchronization
- **Enterprise Security**: Audit trails, policy enforcement, and compliance
- **Runtime Integration**: Docker, Kubernetes, CI/CD pipeline support
- **Extensible Architecture**: Plugin system for custom integrations

## Installation

### Prerequisites

- Go 1.21 or later
- Unix-like operating system (Linux, macOS)
- Optional: Docker for containerized deployments

### Build from Source

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/cli

# Build the CLI
make build

# Install to system PATH
make install
```

### Binary Installation

```bash
# Download the latest binary
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault
chmod +x vault
sudo mv vault /usr/local/bin/
```

## Quick Start

### 1. Initialize Local Environment

```bash
# Initialize local vault
vault init

# Check status
vault status
```

### 2. Request a Capability

```bash
# Request read capability for a database secret
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300 \
  --purpose "Database connection for app123"
```

### 3. Validate and Use Capability

```bash
# Validate the capability
vault capability validate <capability-id>

# Use the capability (via IPC client)
# This is typically done by applications, not directly via CLI
```

### 4. Start the Agent

```bash
# Start the Aether Vault Agent
vault agent start --enable-cbac

# Check agent status
vault agent status
```

## Architecture

The Aether Vault CLI follows a modular, security-first architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Commands  │    │   IPC Server    │    │  Capability     │
│                 │◄──►│                 │◄──►│     Engine      │
│  - capability   │    │  - Unix Socket  │    │                 │
│  - agent        │    │  - gRPC Protocol │    │  - Generation   │
│  - status       │    │  - Auth          │    │  - Validation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Policy Engine │    │   Audit System  │    │  Storage Layer  │
│                 │    │                 │    │                 │
│  - Evaluation   │    │  - Immutable    │    │  - Local Cache  │
│  - Rules        │    │  - SIEM Export  │    │  - Persistence  │
│  - Caching      │    │  - Hash Chain   │    │  - Cleanup      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **CLI Commands**: User interface for all operations
2. **IPC Server**: Local communication via Unix sockets
3. **Capability Engine**: Cryptographic token generation and validation
4. **Policy Engine**: Access control evaluation
5. **Audit System**: Immutable logging and compliance
6. **Storage Layer**: Persistent capability storage

## Commands

### Global Options

```bash
--format string     Output format (json, yaml, table) (default "table")
--verbose           Enable verbose output
--config string     Config file path
--help, -h          Show help
```

### Root Command

```bash
vault [flags]
```

Displays welcome banner, current status, and available commands.

### Version Command

```bash
vault version [flags]
```

Shows CLI version, build information, and system details.

**Example:**

```bash
vault version --format json
```

### Init Command

```bash
vault init [flags]
```

Initializes the local Aether Vault environment.

**Flags:**

```bash
--path string     Configuration directory (default "~/.aether/vault")
--force           Force reinitialization
```

**Example:**

```bash
vault init --path /opt/aether-vault --force
```

### Auth Command

```bash
vault auth [subcommand] [flags]
```

Manages authentication and connection to cloud services.

**Subcommands:**

- `login`: Authenticate with cloud services
- `status`: Show authentication status
- `logout`: Sign out from cloud services

**Example:**

```bash
vault auth login --method oauth --url https://cloud.aethervault.com
```

### Status Command

```bash
vault status [flags]
```

Displays comprehensive system status.

**Flags:**

```bash
--verbose      Show detailed status information
```

**Example:**

```bash
vault status --verbose
```

### Agent Command

```bash
vault agent [subcommand] [flags]
```

Manages the Aether Vault Agent daemon.

**Subcommands:**

- `start`: Start the agent daemon
- `stop`: Stop the agent daemon
- `status`: Show agent status
- `reload`: Reload configuration and policies
- `config`: Manage agent configuration

**Example:**

```bash
vault agent start --enable-cbac --log-level info
```

### Capability Command

```bash
vault capability [subcommand] [flags]
```

Manages cryptographic capabilities.

**Subcommands:**

- `request`: Request a new capability
- `validate`: Validate an existing capability
- `list`: List capabilities
- `revoke`: Revoke a capability
- `status`: Show capability system status

**Examples:**

```bash
# Request a capability
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300 \
  --identity "app123"

# Validate a capability
vault capability validate cap_1234567890

# List capabilities
vault capability list --identity app123 --limit 10

# Revoke a capability
vault capability revoke cap_1234567890 --reason "Security policy violation"
```

## Capability-Based Access Control (CBAC)

### Overview

CBAC is a security model that uses cryptographic, time-limited tokens called capabilities to grant access to resources. Unlike traditional RBAC, capabilities are:

- **Bearer Tokens**: Cryptographically signed and self-contained
- **Ephemeral**: Short-lived with automatic expiration
- **Scope-Limited**: Grant access to specific resources and actions
- **Auditable**: Every use is logged immutably
- **Revocable**: Can be immediately revoked when needed

### Capability Structure

```json
{
  "id": "cap_1234567890_abcdef",
  "type": "read",
  "resource": "secret:/db/primary",
  "actions": ["read"],
  "identity": "app123",
  "issuer": "aether-vault-agent",
  "issued_at": "2024-01-08T10:00:00Z",
  "expires_at": "2024-01-08T10:05:00Z",
  "ttl": 300,
  "max_uses": 10,
  "used_count": 0,
  "signature": "base64-encoded-signature",
  "constraints": {
    "ipAddresses": ["10.0.0.100"],
    "timeWindow": {
      "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
      "daysOfWeek": [1, 2, 3, 4, 5]
    }
  }
}
```

### Capability Types

- **read**: Grant read-only access
- **write**: Grant write/modify access
- **delete**: Grant deletion access
- **execute**: Grant execution access
- **admin**: Grant administrative access

### Constraints

Capabilities can include various constraints:

```json
{
  "constraints": {
    "ipAddresses": ["10.0.0.100", "10.0.0.101"],
    "timeWindow": {
      "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timezones": ["UTC", "America/New_York"]
    },
    "environment": {
      "container.namespace": "production",
      "host.platform": "linux"
    },
    "rateLimit": {
      "requestsPerSecond": 10.0,
      "burst": 20,
      "windowDuration": 60
    }
  }
}
```

### Request Flow

1. **Identity Verification**: Client authenticates with the agent
2. **Policy Evaluation**: Request is evaluated against enterprise policies
3. **Capability Generation**: If approved, a cryptographic capability is generated
4. **Capability Use**: Client presents capability for resource access
5. **Validation**: Agent validates capability signature and constraints
6. **Audit Logging**: All actions are logged immutably

## Configuration

### Configuration File

The CLI uses a YAML configuration file located at `~/.aether/vault/config.yaml` by default.

```yaml
# Aether Vault CLI Configuration
version: "1.0"

# Execution Mode
mode: "local" # local, cloud

# Local Configuration
local:
  path: "~/.aether/vault"
  storage:
    type: "file"
    encryption: true
    compression: false

# Cloud Configuration
cloud:
  url: "https://cloud.aethervault.com"
  auth:
    method: "oauth"
    client_id: "your-client-id"
    redirect_url: "http://localhost:8080/callback"

# Agent Configuration
agent:
  enable: true
  socket_path: "~/.aether/vault/agent.sock"
  log_level: "info"
  capabilities:
    enable: true
    default_ttl: 300
    max_ttl: 3600
    max_uses: 100

# Policy Engine
policy:
  enable: true
  directory: "~/.aether/vault/policies"
  cache:
    enable: true
    ttl: 300
    size: 1000

# Audit Configuration
audit:
  enable: true
  log_file: "~/.aether/vault/audit.log"
  buffer_size: 1000
  flush_interval: 60
  rotation:
    enable: true
    max_size: "100MB"
    max_files: 10

# IPC Configuration
ipc:
  timeout: 30
  max_connections: 100
  enable_auth: true

# UI Configuration
ui:
  format: "table"
  colors: true
  banner: true
```

### Environment Variables

Configuration can be overridden using environment variables:

```bash
export VAULT_CONFIG_PATH="/path/to/config.yaml"
export VAULT_MODE="cloud"
export VAULT_LOG_LEVEL="debug"
export VAULT_SOCKET_PATH="/tmp/vault.sock"
```

### Policy Configuration

Policies are defined as JSON files in the policies directory:

```json
{
  "id": "database-access",
  "name": "Database Access Policy",
  "version": "1.0",
  "status": "active",
  "rules": [
    {
      "id": "app-read-db",
      "effect": "allow",
      "resources": ["secret:/db/*"],
      "actions": ["read"],
      "identities": ["app:*"],
      "conditions": [
        {
          "type": "time",
          "operator": "in",
          "key": "hours",
          "value": [9, 10, 11, 12, 13, 14, 15, 16, 17]
        }
      ],
      "priority": 100
    }
  ],
  "created_at": "2024-01-08T10:00:00Z",
  "created_by": "admin"
}
```

## Integration

### Docker Integration

The CLI can integrate with Docker containers:

```bash
# Inject capabilities into Docker container
vault capability inject \
  --runtime docker \
  --container app123 \
  --resource "secret:/db/primary"

# Export capabilities as environment variables
vault capability export \
  --format env \
  --file .env.capabilities
```

### Kubernetes Integration

For Kubernetes deployments:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vault-capabilities
data:
  capabilities.json: |
    {
      "capability_id": "cap_1234567890",
      "socket_path": "/var/run/vault/agent.sock"
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          envFrom:
            - configMapRef:
                name: vault-capabilities
          volumeMounts:
            - name: vault-socket
              mountPath: /var/run/vault
      volumes:
        - name: vault-socket
          hostPath:
            path: /var/run/vault
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy with Vault Capabilities
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Aether Vault CLI
        run: |
          curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault
          chmod +x vault
          sudo mv vault /usr/local/bin/

      - name: Request deployment capability
        run: |
          vault capability request \
            --resource "secret:/deploy/production" \
            --action execute \
            --ttl 600 \
            --identity "github-actions" \
            --purpose "Production deployment"

      - name: Deploy application
        run: |
          # Application uses capability via IPC
          ./deploy.sh
```

### Application Integration

Go application example:

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/skygenesisenterprise/aether-vault/package/cli/internal/ipc"
    "github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

func main() {
    // Create IPC client
    client, err := ipc.NewClient(nil)
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Connect to agent
    if err := client.Connect(); err != nil {
        log.Fatal(err)
    }

    // Request capability
    request := &types.CapabilityRequest{
        Identity: "my-app",
        Resource: "secret:/db/primary",
        Actions:  []string{"read"},
        TTL:      300,
    }

    response, err := client.RequestCapability(request)
    if err != nil {
        log.Fatal(err)
    }

    if response.Status != "granted" {
        log.Fatal("Capability denied")
    }

    // Use capability
    capabilityID := response.Capability.ID
    result, err := client.ValidateCapability(capabilityID, nil)
    if err != nil || !result.Valid {
        log.Fatal("Capability validation failed")
    }

    fmt.Printf("Capability %s is valid\n", capabilityID)
}
```

## Security

### Security Model

Aether Vault implements a defense-in-depth security model:

1. **Zero Trust**: No implicit trust, all access must be explicitly granted
2. **Least Privilege**: Capabilities grant minimum necessary access
3. **Short-Lived Tokens**: Capabilities expire quickly to reduce risk
4. **Cryptographic Security**: All tokens are digitally signed
5. **Immutable Audit**: All actions are logged with hash chains
6. **Policy Enforcement**: Enterprise policies are centrally enforced

### Threat Mitigations

| Threat                     | Mitigation                                            |
| -------------------------- | ----------------------------------------------------- |
| **Compromised Capability** | Short TTL, automatic expiration, immediate revocation |
| **Replay Attacks**         | Nonce, timestamp validation, one-time use options     |
| **Privilege Escalation**   | Strict scoping, policy validation, audit trails       |
| **Denial of Service**      | Rate limiting, connection limits, circuit breakers    |
| **Audit Tampering**        | Immutable logs, hash chains, off-site backups         |

### Best Practices

1. **Use Short TTLs**: Keep capability lifetimes minimal (5-15 minutes)
2. **Limit Scope**: Request only necessary resources and actions
3. **Monitor Usage**: Regularly review audit logs and usage patterns
4. **Rotate Keys**: Periodically rotate signing keys
5. **Update Policies**: Keep security policies current
6. **Test Revocation**: Ensure capability revocation works correctly

### Compliance

Aether Vault supports various compliance frameworks:

- **SOC 2**: Security controls and audit trails
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy
- **HIPAA**: Healthcare data security
- **PCI DSS**: Payment card industry security

## Troubleshooting

### Common Issues

#### Agent Not Running

```bash
# Check if agent is running
vault agent status

# Start agent
vault agent start --enable-cbac

# Check agent logs
tail -f ~/.aether/vault/agent.log
```

#### Connection Refused

```bash
# Check socket file
ls -la ~/.aether-vault/agent.sock

# Check socket permissions
chmod 755 ~/.aether-vault/agent.sock

# Verify socket path
vault agent status --verbose
```

#### Capability Denied

```bash
# Check policy evaluation
vault capability request \
  --resource "secret:/test" \
  --action read \
  --verbose

# Review policies
ls ~/.aether-vault/policies/

# Check audit logs
tail -f ~/.aether-vault/audit.log
```

#### Configuration Issues

```bash
# Validate configuration
vault agent config --validate

# Show current configuration
vault agent config

# Reset configuration
vault init --force
```

### Debug Mode

Enable verbose logging for debugging:

```bash
# Enable debug logging
export VAULT_LOG_LEVEL=debug

# Run with verbose output
vault capability request --resource "secret:/test" --action read --verbose
```

### Log Locations

- **Agent Logs**: `~/.aether-vault/agent.log`
- **Audit Logs**: `~/.aether-vault/audit.log`
- **Configuration**: `~/.aether-vault/config.yaml`
- **Policies**: `~/.aether-vault/policies/`
- **Capabilities**: `~/.aether-vault/capabilities.json`

### Getting Help

```bash
# General help
vault --help

# Command-specific help
vault capability --help
vault capability request --help

# Check version and build info
vault version --verbose
```

## API Reference

### Core Types

#### Capability

```go
type Capability struct {
    ID         string                 `json:"id"`
    Type       CapabilityType        `json:"type"`
    Resource   string                 `json:"resource"`
    Actions    []string               `json:"actions"`
    Identity   string                 `json:"identity"`
    Issuer     string                 `json:"issuer"`
    IssuedAt   time.Time              `json:"issued_at"`
    ExpiresAt  time.Time              `json:"expires_at"`
    TTL        int64                  `json:"ttl"`
    MaxUses    int                    `json:"max_uses,omitempty"`
    UsedCount  int                    `json:"used_count"`
    Signature  []byte                 `json:"signature,omitempty"`
    Metadata   map[string]interface{} `json:"metadata,omitempty"`
    Constraints *CapabilityConstraints `json:"constraints,omitempty"`
}
```

#### CapabilityRequest

```go
type CapabilityRequest struct {
    Identity    string                 `json:"identity"`
    Resource    string                 `json:"resource"`
    Actions     []string               `json:"actions"`
    TTL         int64                  `json:"ttl,omitempty"`
    MaxUses     int                    `json:"max_uses,omitempty"`
    Constraints *CapabilityConstraints `json:"constraints,omitempty"`
    Context     *RequestContext        `json:"context,omitempty"`
    Purpose     string                 `json:"purpose,omitempty"`
}
```

#### CapabilityResponse

```go
type CapabilityResponse struct {
    Capability    *Capability     `json:"capability,omitempty"`
    Status         string          `json:"status"`
    Message        string          `json:"message,omitempty"`
    RequestID      string          `json:"request_id"`
    ProcessingTime time.Duration   `json:"processing_time"`
    PolicyResult   *PolicyResult   `json:"policy_result,omitempty"`
    Issues         []Issue         `json:"issues,omitempty"`
}
```

### Interfaces

#### CapabilityStore

```go
type CapabilityStore interface {
    Store(capability *Capability) error
    Retrieve(id string) (*Capability, error)
    List(filter *CapabilityFilter) ([]*Capability, error)
    Revoke(id string, reason string, revokedBy string) error
    Cleanup() error
    GetUsage(id string) (*CapabilityUsage, error)
    UpdateUsage(id string, event *AccessEvent) error
}
```

#### CapabilityValidator

```go
type CapabilityValidator interface {
    Validate(capability *Capability, context *RequestContext) (*ValidationResult, error)
    ValidateSignature(capability *Capability) error
    ValidateConstraints(capability *Capability, context *RequestContext) error
    ValidateExpiration(capability *Capability) error
    ValidateUsage(capability *Capability) error
}
```

### IPC Protocol

#### Message Format

```go
type Protocol struct {
    Version   string      `json:"version"`
    Type      string      `json:"type"`
    ID        string      `json:"id"`
    Timestamp time.Time   `json:"timestamp"`
    Payload   interface{} `json:"payload"`
    Signature []byte      `json:"signature,omitempty"`
}
```

#### Message Types

- `capability_request`: Request a new capability
- `capability_validate`: Validate an existing capability
- `capability_revoke`: Revoke a capability
- `capability_list`: List capabilities
- `status_request`: Get server status
- `ping_request`: Health check

### Error Codes

| Code                       | Description                  |
| -------------------------- | ---------------------------- |
| `CAP_NOT_FOUND`            | Capability not found         |
| `CAP_EXPIRED`              | Capability has expired       |
| `CAP_INVALID_SIGNATURE`    | Invalid capability signature |
| `CAP_USAGE_LIMIT_EXCEEDED` | Usage limit exceeded         |
| `CAP_CONSTRAINT_VIOLATION` | Constraint violation         |
| `POLICY_DENIED`            | Policy evaluation denied     |
| `AUTH_FAILED`              | Authentication failed        |
| `CONN_REFUSED`             | Connection refused           |
| `INVALID_REQUEST`          | Invalid request format       |

### Configuration Schemas

#### EngineConfig

```go
type EngineConfig struct {
    DefaultTTL          int64  `json:"defaultTTL"`
    MaxTTL              int64  `json:"maxTTL"`
    MaxUses             int    `json:"maxUses"`
    Issuer              string `json:"issuer"`
    EnableUsageTracking bool   `json:"enableUsageTracking"`
    CleanupInterval     int64  `json:"cleanupInterval"`
    SignatureAlgorithm  string `json:"signatureAlgorithm"`
}
```

#### PolicyEngineConfig

```go
type PolicyEngineConfig struct {
    EnableCache      bool   `json:"enableCache"`
    CacheTTL         int64  `json:"cacheTTL"`
    CacheSize        int    `json:"cacheSize"`
    EnableReloading  bool   `json:"enableReloading"`
    ReloadInterval   int64  `json:"reloadInterval"`
    DefaultDecision  string `json:"defaultDecision"`
    EnableValidation bool   `json:"enableValidation"`
}
```

#### AuditConfig

```go
type AuditConfig struct {
    EnableLogging     bool   `json:"enableLogging"`
    LogFilePath       string `json:"logFilePath"`
    EnableBuffer      bool   `json:"enableBuffer"`
    BufferSize        int    `json:"bufferSize"`
    FlushInterval     int64  `json:"flushInterval"`
    EnableRotation    bool   `json:"enableRotation"`
    MaxFileSize       int64  `json:"maxFileSize"`
    MaxBackupFiles    int    `json:"maxBackupFiles"`
    EnableCompression bool   `json:"enableCompression"`
    EnableSignature   bool   `json:"enableSignature"`
    LogLevel          string `json:"logLevel"`
    EnableSIEM        bool   `json:"enableSIEM"`
    SIEMEndpoint      string `json:"siemEndpoint,omitempty"`
    SIEMFormat        string `json:"siemFormat,omitempty"`
}
```

---

## Contributing

We welcome contributions to the Aether Vault CLI! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and set up a development environment.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.aethervault.com](https://docs.aethervault.com)
- **Issues**: [GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)
- **Community**: [Discord Server](https://discord.gg/aethervault)
