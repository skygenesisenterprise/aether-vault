# CBAC Overview - Capability-Based Access Control

## Introduction

Capability-Based Access Control (CBAC) is Aether Vault's core security model that provides fine-grained, time-limited access control through cryptographic tokens called capabilities. Unlike traditional Role-Based Access Control (RBAC), CBAC focuses on what a token can do rather than who a user is.

## Core Concepts

### What is a Capability?

A capability is a cryptographic, self-contained token that grants specific access to resources. Think of it as a digital key that:

- **Is Bearer-Based**: Whoever holds it can use it (like a physical key)
- **Is Cryptographically Signed**: Cannot be forged or tampered with
- **Is Time-Limited**: Automatically expires after a short period
- **Is Scope-Limited**: Grants access only to specific resources and actions
- **Is Auditable**: Every use is logged immutably

### Capability vs Traditional Access Control

| Aspect             | RBAC (Traditional)                     | CBAC (Aether Vault)                    |
| ------------------ | -------------------------------------- | -------------------------------------- |
| **Access Grant**   | User assigned to roles                 | Capability granted for specific action |
| **Token Type**     | Session cookies, JWTs                  | Cryptographic capabilities             |
| **Lifetime**       | Hours to days                          | Minutes (5-15 typical)                 |
| **Scope**          | Broad role permissions                 | Narrow resource-specific permissions   |
| **Revocation**     | Complex, requires session invalidation | Immediate, capability-specific         |
| **Audit**          | User action logs                       | Capability usage logs with hash chains |
| **Security Model** | Trust-based                            | Zero-trust                             |

## Capability Structure

### Basic Capability

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
  "signature": "base64-encoded-ed25519-signature"
}
```

### Capability with Constraints

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
  "signature": "base64-encoded-ed25519-signature",
  "constraints": {
    "ipAddresses": ["10.0.0.100", "10.0.0.101"],
    "timeWindow": {
      "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timezones": ["UTC"]
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

## Capability Types

### Read Capability

Grants read-only access to resources.

```bash
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300
```

**Use Cases:**

- Database read operations
- Configuration file access
- Secret retrieval for authentication

### Write Capability

Grants write/modify access to resources.

```bash
vault capability request \
  --resource "secret:/config/app" \
  --action write \
  --ttl 600
```

**Use Cases:**

- Configuration updates
- Secret rotation
- Data modification

### Delete Capability

Grants deletion access to resources.

```bash
vault capability request \
  --resource "secret:/temp/cache" \
  --action delete \
  --ttl 60
```

**Use Cases:**

- Temporary file cleanup
- Cache invalidation
- Data purging

### Execute Capability

Grants execution access to resources or operations.

```bash
vault capability request \
  --resource "operation:/deploy/production" \
  --action execute \
  --ttl 900
```

**Use Cases:**

- Deployment operations
- Script execution
- Administrative tasks

### Admin Capability

Grants full administrative access to resources.

```bash
vault capability request \
  --resource "secret:/system/*" \
  --action admin \
  --ttl 300 \
  --identity "admin-user"
```

**Use Cases:**

- System administration
- Emergency access
- Full resource management

## Request Flow

### 1. Identity Authentication

```
Client ──► Agent
        │
        │ IPC Connection
        │ with Authentication
        ▼
   Verify Identity
```

### 2. Policy Evaluation

```
Agent ──► Policy Engine
        │
        │ Evaluate Request
        │ Against Rules
        ▼
   Allow/Deny Decision
```

### 3. Capability Generation

```
Agent ──► Capability Engine
        │
        │ Generate Cryptographic
        │ Token with Constraints
        ▼
   Signed Capability
```

### 4. Capability Use

```
Client ──► Agent
        │
        │ Present Capability
        │ for Validation
        ▼
   Resource Access
```

### 5. Audit Logging

```
Agent ──► Audit System
        │
        │ Log All Events
        │ with Hash Chain
        ▼
   Immutable Record
```

## Security Properties

### Cryptographic Security

- **Ed25519 Signing**: All capabilities are signed with Ed25519 keys
- **Tamper-Proof**: Any modification invalidates the signature
- **Non-Repudiation**: Signature proves authenticity and integrity

### Temporal Security

- **Short TTL**: Capabilities expire quickly (default 5 minutes)
- **Automatic Cleanup**: Expired capabilities are automatically removed
- **Time Constraints**: Additional time-based restrictions possible

### Spatial Security

- **IP Constraints**: Limit use to specific IP addresses
- **Network Segmentation**: Enforce network-level boundaries
- **Geographic Restrictions**: Limit by geographic location

### Usage Security

- **Use Limits**: Maximum number of uses per capability
- **Rate Limiting**: Prevent abuse through rate constraints
- **One-Time Use**: Optional single-use capabilities

## Constraint System

### IP Address Constraints

```json
{
  "constraints": {
    "ipAddresses": ["10.0.0.100", "192.168.1.50"]
  }
}
```

**Use Cases:**

- Restrict to specific servers
- Enforce network segmentation
- Prevent unauthorized IP access

### Time Window Constraints

```json
{
  "constraints": {
    "timeWindow": {
      "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17],
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timezones": ["UTC", "America/New_York"],
      "blackoutPeriods": [
        {
          "start": "2024-01-08T12:00:00Z",
          "end": "2024-01-08T13:00:00Z"
        }
      ]
    }
  }
}
```

**Use Cases:**

- Business hours only access
- Maintenance window restrictions
- Holiday blackout periods

### Environment Constraints

```json
{
  "constraints": {
    "environment": {
      "container.namespace": "production",
      "host.platform": "linux",
      "runtime.type": "docker"
    }
  }
}
```

**Use Cases:**

- Production-only access
- Platform-specific restrictions
- Container environment validation

### Rate Limiting Constraints

```json
{
  "constraints": {
    "rateLimit": {
      "requestsPerSecond": 10.0,
      "burst": 20,
      "windowDuration": 60
    }
  }
}
```

**Use Cases:**

- Prevent API abuse
- Limit resource consumption
- Enforce fair usage

## Policy Integration

### Policy Evaluation

Capabilities are generated only after policy evaluation:

```json
{
  "policy_result": {
    "decision": "allow",
    "applied_policies": ["database-access", "app-policy"],
    "applied_rules": ["app-read-db", "business-hours"],
    "conditions": ["hours in [9-17]", "identity matches app:*"],
    "reasoning": "Request matches database access policy for app identity during business hours",
    "evaluation_time": "15ms"
  }
}
```

### Policy Types

1. **Resource Policies**: Control access to specific resources
2. **Identity Policies**: Control what identities can request
3. **Time Policies**: Control when access is allowed
4. **Environment Policies**: Control where access can be used
5. **Composite Policies**: Combine multiple policy types

### Policy Examples

**Database Access Policy**

```json
{
  "id": "database-access",
  "name": "Database Access Policy",
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
  ]
}
```

## Audit and Compliance

### Immutable Audit Trail

Every capability operation is logged with cryptographic integrity:

```json
{
  "id": "audit_1234567890",
  "timestamp": "2024-01-08T10:00:00Z",
  "type": "capability_request",
  "category": "security",
  "severity": "info",
  "source_identity": "app123",
  "target_resource": "secret:/db/primary",
  "action": "request:read",
  "outcome": "granted",
  "capability_id": "cap_1234567890_abcdef",
  "request_id": "req_1234567890",
  "client": {
    "ip": "10.0.0.100",
    "platform": "linux",
    "pid": 12345
  },
  "hash": "sha256_hash_of_event",
  "chain_hash": "hash_of_previous_event"
}
```

### Compliance Features

- **SOC 2**: Security controls and audit trails
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy rights
- **HIPAA**: Healthcare data security
- **PCI DSS**: Payment card industry security

### Audit Queries

```bash
# Search for specific capability usage
vault audit search --capability-id "cap_1234567890"

# Search by identity
vault audit search --identity "app123" --time-range "2024-01-08:2024-01-09"

# Search denied requests
vault audit search --outcome "denied" --severity "warning"
```

## Best Practices

### 1. Principle of Least Privilege

```bash
# Good: Request only necessary access
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --ttl 300

# Avoid: Requesting excessive access
vault capability request \
  --resource "secret:/db/*" \
  --action admin \
  --ttl 3600
```

### 2. Short TTLs

```bash
# Good: Minimal TTL for reduced risk
vault capability request \
  --resource "secret:/api/config" \
  --action read \
  --ttl 300

# Avoid: Long TTLs increase risk
vault capability request \
  --resource "secret:/api/config" \
  --action read \
  --ttl 3600
```

### 3. Specific Constraints

```bash
# Good: Specific constraints for security
vault capability request \
  --resource "secret:/production/db" \
  --action read \
  --constraints '{"ipAddresses": ["10.0.0.100"], "timeWindow": {"hours": [9,10,11,12,13,14,15,16,17]}}'

# Avoid: No constraints
vault capability request \
  --resource "secret:/production/db" \
  --action read
```

### 4. Purpose and Context

```bash
# Good: Include purpose for audit trail
vault capability request \
  --resource "secret:/db/primary" \
  --action read \
  --purpose "Database connection for web-app" \
  --context '{"runtime": {"type": "web-server"}, "version": "1.2.3"}'
```

### 5. Regular Cleanup

```bash
# Monitor active capabilities
vault capability list --status "active"

# Revoke unused capabilities
vault capability revoke cap_1234567890 --reason "No longer needed"

# Review audit logs regularly
tail -f ~/.aether-vault/audit.log
```

## Threat Mitigation

### Capability Compromise

| Threat                 | Mitigation                                                 |
| ---------------------- | ---------------------------------------------------------- |
| **Stolen Capability**  | Short TTL (5-15 min), IP constraints, immediate revocation |
| **Replay Attack**      | Timestamp validation, nonce, one-time use options          |
| **Capability Forgery** | Ed25519 signatures, hash chain verification                |
| **Man-in-the-Middle**  | IPC over Unix socket, mutual authentication                |

### Policy Bypass

| Threat                   | Mitigation                                      |
| ------------------------ | ----------------------------------------------- |
| **Policy Evasion**       | Centralized policy engine, mandatory evaluation |
| **Privilege Escalation** | Strict scoping, constraint validation           |
| **Unauthorized Access**  | Identity verification, context validation       |

### System Attacks

| Threat                  | Mitigation                                         |
| ----------------------- | -------------------------------------------------- |
| **Denial of Service**   | Rate limiting, connection limits, circuit breakers |
| **Resource Exhaustion** | Use limits, cleanup routines, monitoring           |
| **Audit Tampering**     | Immutable logs, hash chains, off-site backup       |

## Migration from RBAC

### Assessment Phase

1. **Inventory Current Access**: Map existing roles and permissions
2. **Identify Resources**: Catalog all protected resources
3. **Analyze Usage Patterns**: Understand typical access patterns
4. **Define Capability Types**: Create capability type taxonomy

### Planning Phase

1. **Design Policies**: Create CBAC policies for each resource type
2. **Define Constraints**: Establish appropriate constraints
3. **Plan Migration Strategy**: Gradual rollout with fallback
4. **Prepare Monitoring**: Set up audit and alerting

### Implementation Phase

1. **Pilot Program**: Start with non-critical applications
2. **Parallel Operation**: Run RBAC and CBAC simultaneously
3. **Gradual Migration**: Migrate applications incrementally
4. **Validation**: Verify security and functionality

### Decommissioning Phase

1. **Monitor RBAC Usage**: Ensure no remaining dependencies
2. **Remove RBAC Systems**: Decommission old access controls
3. **Update Documentation**: Reflect new CBAC architecture
4. **Train Teams**: Educate on CBAC concepts and usage

## Performance Considerations

### Capability Generation

- **Signing Performance**: Ed25519 is fast (~3,000 signatures/second)
- **Cache Policies**: Policy evaluation results cached for 5 minutes
- **Batch Operations**: Multiple capabilities can be generated efficiently

### Validation Performance

- **Signature Verification**: Fast Ed25519 verification
- **Constraint Checking**: Optimized constraint evaluation
- **Memory Usage**: Efficient in-memory capability storage

### Storage Performance

- **Local Storage**: File-based storage with indexing
- **Cleanup Optimization**: Efficient expired capability removal
- **Compression**: Optional compression for large deployments

### Network Performance

- **IPC Overhead**: Minimal Unix socket overhead
- **Connection Pooling**: Reuse connections for multiple requests
- **Batch Validation**: Validate multiple capabilities in one request

## Comparison with Other Systems

### vs HashiCorp Vault

| Feature             | Aether Vault CBAC       | HashiCorp Vault        |
| ------------------- | ----------------------- | ---------------------- |
| **Access Model**    | Capability-based        | Role-based             |
| **Token Lifetime**  | Minutes (5-15)          | Hours (1-8)            |
| **Local Operation** | Full offline capability | Limited without server |
| **Policy Language** | JSON-based              | HCL/Rego               |
| **Audit Model**     | Immutable hash chains   | Structured logs        |
| **IPC Protocol**    | Custom Unix socket      | HTTP API               |

### vs OAuth 2.0

| Feature               | Aether Vault CBAC   | OAuth 2.0               |
| --------------------- | ------------------- | ----------------------- |
| **Token Type**        | Capability (custom) | JWT (standard)          |
| **Scope Granularity** | Resource-specific   | API-scoped              |
| **Lifetime**          | Minutes             | Hours                   |
| **Revocation**        | Immediate           | Token list invalidation |
| **Local Validation**  | Yes                 | Requires introspection  |
| **Use Case**          | System-to-system    | User-to-system          |

## Future Enhancements

### Planned Features

1. **Distributed Capabilities**: Cross-node capability sharing
2. **Capability Delegation**: Limited delegation capabilities
3. **Advanced Constraints**: Machine learning-based anomaly detection
4. **Quantum-Resistant Signing**: Post-quantum cryptographic algorithms
5. **Capability Marketplace**: Internal capability exchange system

### Research Areas

1. **Zero-Knowledge Proofs**: Privacy-preserving capability validation
2. **Homomorphic Encryption**: Encrypted capability evaluation
3. **Blockchain Integration**: Distributed capability verification
4. **AI-Driven Policies**: Intelligent policy generation and optimization

---

_See [CBAC_ARCHITECTURE.md](CBAC_ARCHITECTURE.md) for detailed architecture, [CBAC_POLICIES.md](CBAC_POLICIES.md) for policy configuration, and [COMMANDS_CAPABILITY.md](../COMMANDS_CAPABILITY.md) for command usage._
