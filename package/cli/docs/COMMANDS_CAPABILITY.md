# Capability Commands Reference

## Overview

The `vault capability` command group manages cryptographic capabilities that grant time-limited access to resources. Capabilities are the core of Aether Vault's Capability-Based Access Control (CBAC) system.

## Command Structure

```bash
vault capability [subcommand] [flags]
```

## Subcommands

### capability request

Requests a new capability for accessing specific resources.

#### Syntax

```bash
vault capability request [flags]
```

#### Required Flags

| Flag         | Type        | Description                                |
| ------------ | ----------- | ------------------------------------------ |
| `--resource` | string      | Resource path (e.g., `secret:/db/primary`) |
| `--action`   | stringSlice | Action(s) to grant (e.g., `read`, `write`) |

#### Optional Flags

| Flag            | Type   | Default       | Description                    |
| --------------- | ------ | ------------- | ------------------------------ |
| `--ttl`         | int64  | 300           | Time-to-live in seconds        |
| `--max-uses`    | int    | 100           | Maximum number of uses         |
| `--identity`    | string | auto-detected | Requesting identity            |
| `--purpose`     | string | -             | Purpose of the request         |
| `--constraints` | string | -             | Constraints in JSON format     |
| `--context`     | string | -             | Request context in JSON format |

#### Examples

**Basic Capability Request**

```bash
vault capability request \
  --resource "secret:/db/primary" \
  --action read
```

**Capability with Custom TTL**

```bash
vault capability request \
  --resource "secret:/api/production" \
  --action read,write \
  --ttl 600 \
  --purpose "API access for production deployment"
```

**Capability with Constraints**

```bash
vault capability request \
  --resource "secret:/sensitive/data" \
  --action read \
  --constraints '{"ipAddresses": ["10.0.0.100"], "timeWindow": {"hours": [9,10,11,12,13,14,15,16,17]}}'
```

**Capability with Runtime Context**

```bash
vault capability request \
  --resource "secret:/docker/registry" \
  --action read \
  --context '{"runtime": {"type": "docker", "id": "container123"}, "sourceIP": "10.0.0.100"}'
```

#### Response Format

**Table Format**

```
Capability Request Result:
  Status: granted
  Request ID: req_1234567890_abcdef
  Processing Time: 45ms

Capability Details:
  ID: cap_1234567890_ghijkl
  Type: read
  Resource: secret:/db/primary
  Actions: read
  Identity: app123
  Issuer: aether-vault-agent
  TTL: 300 seconds
  Max Uses: 100
  Issued At: 2024-01-08T10:00:00Z
  Expires At: 2024-01-08T10:05:00Z

Policy Evaluation:
  Decision: allow
  Applied Policies: ["database-access", "app-policy"]
  Reasoning: Request matches database access policy for app identity
```

**JSON Format**

```json
{
  "capability": {
    "id": "cap_1234567890_ghijkl",
    "type": "read",
    "resource": "secret:/db/primary",
    "actions": ["read"],
    "identity": "app123",
    "issuer": "aether-vault-agent",
    "issued_at": "2024-01-08T10:00:00Z",
    "expires_at": "2024-01-08T10:05:00Z",
    "ttl": 300,
    "max_uses": 100,
    "used_count": 0,
    "signature": "base64-encoded-signature"
  },
  "status": "granted",
  "message": "Capability granted successfully",
  "request_id": "req_1234567890_abcdef",
  "processing_time": "45ms",
  "policy_result": {
    "decision": "allow",
    "applied_policies": ["database-access", "app-policy"],
    "reasoning": "Request matches database access policy for app identity"
  }
}
```

---

### capability validate

Validates an existing capability to check if it's still valid and can be used.

#### Syntax

```bash
vault capability validate [capability-id] [flags]
```

#### Arguments

| Argument        | Type   | Description                      |
| --------------- | ------ | -------------------------------- |
| `capability-id` | string | ID of the capability to validate |

#### Optional Flags

| Flag        | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| `--context` | string | -       | Validation context in JSON format |

#### Examples

**Basic Validation**

```bash
vault capability validate cap_1234567890_ghijkl
```

**Validation with Context**

```bash
vault capability validate cap_1234567890_ghijkl \
  --context '{"sourceIP": "10.0.0.100", "runtime": {"type": "docker", "id": "container123"}}'
```

#### Response Format

**Successful Validation**

```
Capability Validation Result:
  Valid: true
  Validation Time: 12ms

Context:
  cache_hit: false
  constraints_satisfied: true
```

**Failed Validation**

```
Capability Validation Result:
  Valid: false
  Validation Time: 8ms

Errors:
  EXPIRED: Capability expired at 2024-01-08T10:05:00Z
    Field: expires_at

Warnings:
  USAGE_HIGH: Capability has used 80% of max uses
    Field: used_count
```

---

### capability list

Lists existing capabilities with optional filtering.

#### Syntax

```bash
vault capability list [flags]
```

#### Optional Flags

| Flag         | Type   | Default | Description                                 |
| ------------ | ------ | ------- | ------------------------------------------- |
| `--identity` | string | -       | Filter by identity                          |
| `--type`     | string | -       | Filter by capability type                   |
| `--status`   | string | -       | Filter by status (active, expired, revoked) |
| `--limit`    | int    | 50      | Limit number of results                     |
| `--offset`   | int    | 0       | Offset for pagination                       |

#### Examples

**List All Capabilities**

```bash
vault capability list
```

**Filter by Identity**

```bash
vault capability list --identity "app123"
```

**Filter by Type and Status**

```bash
vault capability list --type "read" --status "active"
```

**Paginated Results**

```bash
vault capability list --limit 10 --offset 20
```

#### Response Format

**Table Format**

```
Found 25 capabilities:

ID                   Type            Resource                        Identity         Expires
--------------------------------------------------------------------------------------------------------------
cap_1234567890_abc   read            secret:/db/primary             app123           2024-01-08 10:05:00
cap_1234567890_def   write           secret:/api/config             deploy-service   2024-01-08 11:00:00
cap_1234567890_ghi   admin           secret:/system/*               admin-user       2024-01-08 12:00:00
...
```

**JSON Format**

```json
{
  "capabilities": [
    {
      "id": "cap_1234567890_abc",
      "type": "read",
      "resource": "secret:/db/primary",
      "identity": "app123",
      "expires_at": "2024-01-08T10:05:00Z"
    }
  ],
  "count": 25,
  "limit": 50,
  "offset": 0
}
```

---

### capability revoke

Revokes an existing capability, making it invalid for future use.

#### Syntax

```bash
vault capability revoke [capability-id] [flags]
```

#### Arguments

| Argument        | Type   | Description                    |
| --------------- | ------ | ------------------------------ |
| `capability-id` | string | ID of the capability to revoke |

#### Optional Flags

| Flag       | Type   | Default             | Description           |
| ---------- | ------ | ------------------- | --------------------- |
| `--reason` | string | "Manual revocation" | Reason for revocation |

#### Examples

**Basic Revocation**

```bash
vault capability revoke cap_1234567890_ghijkl
```

**Revocation with Reason**

```bash
vault capability revoke cap_1234567890_ghijkl \
  --reason "Security policy violation - suspicious activity detected"
```

#### Response Format

```
Capability cap_1234567890_ghijkl revoked successfully
Reason: Security policy violation - suspicious activity detected
```

---

### capability status

Shows the current status of the capability system including engine status, policy engine status, and audit information.

#### Syntax

```bash
vault capability status [flags]
```

#### Examples

```bash
vault capability status
```

#### Response Format

**Table Format**

```
Aether Vault Agent Status:
  Version: 1.0.0
  Uptime: 2h45m30s
  Connections: 3

Capabilities:
  - capability-management
  - policy-evaluation
  - audit-logging
  - ipc-server
```

**JSON Format**

```json
{
  "version": "1.0.0",
  "uptime": "2h45m30s",
  "connections": 3,
  "capabilities": [
    "capability-management",
    "policy-evaluation",
    "audit-logging",
    "ipc-server"
  ]
}
```

## Global Options

All capability commands support these global options:

| Flag        | Type   | Default | Description                       |
| ----------- | ------ | ------- | --------------------------------- |
| `--format`  | string | table   | Output format (json, yaml, table) |
| `--verbose` | bool   | false   | Enable verbose output             |
| `--config`  | string | -       | Config file path                  |

## Use Cases

### 1. Database Access

```bash
# Request read access to database
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300 \
  --identity "web-app"

# Validate before use
vault capability validate cap_1234567890_abc

# Revoke when done
vault capability revoke cap_1234567890_abc \
  --reason "Database connection closed"
```

### 2. API Configuration

```bash
# Request configuration access
vault capability request \
  --resource "secret:/api/production" \
  --action read,write \
  --ttl 600 \
  --identity "config-service"

# List all config capabilities
vault capability list --identity "config-service" --type "write"
```

### 3. Container Deployment

```bash
# Request capability with container context
vault capability request \
  --resource "secret:/docker/registry" \
  --action read \
  --context '{"runtime": {"type": "docker", "id": "container123"}, "sourceIP": "10.0.0.100"}' \
  --constraints '{"environment": {"container.namespace": "production"}}'
```

### 4. Emergency Revocation

```bash
# List all active capabilities for a compromised identity
vault capability list --identity "compromised-app" --status "active"

# Revoke all capabilities (script)
for cap_id in $(vault capability list --identity "compromised-app" --format json | jq -r '.capabilities[].id'); do
  vault capability revoke "$cap_id" --reason "Security incident - identity compromised"
done
```

## Error Handling

### Common Errors

| Error                      | Cause                     | Solution                             |
| -------------------------- | ------------------------- | ------------------------------------ |
| `resource cannot be empty` | Missing `--resource` flag | Add `--resource` flag                |
| `actions cannot be empty`  | Missing `--action` flag   | Add `--action` flag                  |
| `capability not found`     | Invalid capability ID     | Check capability ID with `list`      |
| `connection refused`       | Agent not running         | Start agent with `vault agent start` |
| `policy denied`            | Request violates policy   | Check policies and adjust request    |

### Troubleshooting

1. **Check Agent Status**

   ```bash
   vault agent status
   ```

2. **Verify Policy Configuration**

   ```bash
   vault capability request --resource "secret:/test" --action read --verbose
   ```

3. **Review Audit Logs**

   ```bash
   tail -f ~/.aether-vault/audit.log
   ```

4. **Validate Configuration**
   ```bash
   vault agent config --validate
   ```

## Best Practices

### 1. Use Minimal TTL

```bash
# Good: Short TTL for reduced risk
vault capability request --resource "secret:/db" --action read --ttl 300

# Avoid: Long TTL increases risk
vault capability request --resource "secret:/db" --action read --ttl 3600
```

### 2. Request Only Necessary Actions

```bash
# Good: Request only read access
vault capability request --resource "secret:/config" --action read

# Avoid: Requesting unnecessary admin access
vault capability request --resource "secret:/config" --action admin
```

### 3. Include Purpose and Context

```bash
# Good: Include purpose for audit trail
vault capability request \
  --resource "secret:/db" \
  --action read \
  --purpose "Database connection for web-app" \
  --context '{"runtime": {"type": "web-server"}}'
```

### 4. Monitor and Revoke

```bash
# List active capabilities regularly
vault capability list --status "active"

# Revoke unused capabilities
vault capability revoke cap_1234567890_abc --reason "No longer needed"
```

## Integration Examples

### Go Application

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
        Purpose:  "Database connection",
    }

    response, err := client.RequestCapability(request)
    if err != nil {
        log.Fatal(err)
    }

    if response.Status != "granted" {
        log.Fatal("Capability denied: " + response.Message)
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

### Shell Script

```bash
#!/bin/bash

# Request capability
RESPONSE=$(vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --format json)

# Extract capability ID
CAP_ID=$(echo "$RESPONSE" | jq -r '.capability.id')

# Validate capability
VALIDATION=$(vault capability validate "$CAP_ID" --format json)
IS_VALID=$(echo "$VALIDATION" | jq -r '.valid')

if [ "$IS_VALID" = "true" ]; then
    echo "Capability $CAP_ID is valid"
    # Use capability for database connection
else
    echo "Capability $CAP_ID is invalid"
    exit 1
fi

# Revoke capability when done
vault capability revoke "$CAP_ID" --reason "Database operation completed"
```

---

_See [CBAC_OVERVIEW.md](../CBAC_OVERVIEW.md) for capability concepts and [INTEGRATION_IPC.md](../INTEGRATION_IPC.md) for IPC protocol details._
