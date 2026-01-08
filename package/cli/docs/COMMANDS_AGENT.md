# Agent Commands Reference

## Overview

The `vault agent` command group manages the Aether Vault Agent daemon, which is the core security daemon that provides local policy evaluation, secure secrets management, and IPC communication for all capability operations.

## Command Structure

```bash
vault agent [subcommand] [flags]
```

## Subcommands

### agent start

Starts the Aether Vault Agent as a long-lived daemon process.

#### Syntax

```bash
vault agent start [flags]
```

#### Optional Flags

| Flag            | Type   | Default                    | Description                                 |
| --------------- | ------ | -------------------------- | ------------------------------------------- |
| `--config`      | string | -                          | Path to agent configuration file            |
| `--mode`        | string | standard                   | Agent mode: standard, hardened, development |
| `--log-level`   | string | info                       | Log level: debug, info, warn, error         |
| `--enable-cbac` | bool   | true                       | Enable Capability-Based Access Control      |
| `--policy-dir`  | string | -                          | Directory for policy files                  |
| `--socket-path` | string | ~/.aether-vault/agent.sock | Unix socket path                            |

#### Examples

**Start Agent with Default Settings**

```bash
vault agent start
```

**Start Agent in Hardened Mode**

```bash
vault agent start --mode hardened --log-level warn
```

**Start Agent with Custom Configuration**

```bash
vault agent start --config /etc/aether-vault/agent.yaml --enable-cbac
```

**Start Agent with Debug Logging**

```bash
vault agent start --log-level debug --mode development
```

#### Startup Process

When the agent starts, it performs these steps:

1. **Configuration Loading**: Loads configuration from file or defaults
2. **Component Initialization**: Initializes capability engine, policy engine, audit system
3. **Policy Loading**: Loads policies from specified directory
4. **IPC Server Start**: Starts Unix socket server for local communication
5. **Health Monitoring**: Begins health checks and monitoring
6. **Cleanup Routine**: Starts background cleanup for expired capabilities

#### Output Examples

**Successful Start**

```
Starting Aether Vault Agent...
Configuration loaded from /home/user/.aether-vault/agent.yaml
Capability engine initialized with Ed25519 signing
Policy engine loaded 5 policies from /home/user/.aether-vault/policies
Audit system started with file logging
IPC server listening on /home/user/.aether-vault/agent.sock
Agent started successfully (PID: 12345)
Health checks enabled (interval: 30s)
```

**Start with Issues**

```
Starting Aether Vault Agent...
Warning: Failed to load policy directory /custom/policies: No such file or directory
Configuration loaded from /home/user/.aether-vault/agent.yaml
Capability engine initialized with Ed25519 signing
Policy engine loaded 0 policies
Audit system started with file logging
IPC server listening on /home/user/.aether-vault/agent.sock
Agent started successfully (PID: 12345)
Warning: No policies loaded - all requests will be denied
```

---

### agent stop

Stops the Aether Vault Agent daemon gracefully.

#### Syntax

```bash
vault agent stop [flags]
```

#### Examples

**Stop Agent**

```bash
vault agent stop
```

#### Shutdown Process

The agent performs a graceful shutdown:

1. **Stop Accepting Connections**: IPC server stops accepting new connections
2. **Complete In-Flight Operations**: Finishes processing ongoing requests
3. **Flush Audit Logs**: Ensures all audit events are written to disk
4. **Cleanup Resources**: Releases temporary files and resources
5. **Close Connections**: Closes all active client connections

#### Output Examples

**Successful Stop**

```
Stopping Aether Vault Agent...
IPC server stopped accepting new connections
Waiting for in-flight operations to complete... (3 active)
Flushed 15 audit events to disk
Cleaned up temporary resources
Agent stopped successfully
```

**Agent Not Running**

```
Error: Failed to connect to agent: connection refused
Agent is not running or not accessible
```

---

### agent status

Shows comprehensive status information about the Aether Vault Agent.

#### Syntax

```bash
vault agent status [flags]
```

#### Optional Flags

| Flag        | Type   | Default | Description                      |
| ----------- | ------ | ------- | -------------------------------- |
| `--verbose` | bool   | false   | Show detailed status information |
| `--format`  | string | table   | Output format: table, json, yaml |

#### Examples

**Basic Status**

```bash
vault agent status
```

**Verbose Status**

```bash
vault agent status --verbose
```

**JSON Status**

```bash
vault agent status --format json
```

#### Response Format

**Table Format**

```
Aether Vault Agent Status:
  Running: true
  PID: 12345
  Uptime: 2h45m30s
  Version: 1.0.0

IPC Server:
  Socket Path: /home/user/.aether-vault/agent.sock
  Active Connections: 3
  Max Connections: 100
  Server Uptime: 2h45m30s

Capability Engine:
  Status: Healthy
  Total Capabilities: 127
  Active Capabilities: 45
  Expired Capabilities: 80
  Revoked Capabilities: 2
  Cache Size: 45/10000
  Last Cleanup: 5m ago

Policy Engine:
  Status: Healthy
  Loaded Policies: 5
  Cache Hits: 892
  Cache Misses: 45
  Cache Hit Rate: 95.2%
  Last Policy Reload: 1h ago

Audit System:
  Status: Healthy
  Total Events: 1,247
  Buffer Size: 234/1000
  Last Flush: 2m ago
  Log File: /home/user/.aether-vault/audit.log
  Log Size: 15.2MB

System Resources:
  Memory Usage: 45.2MB
  CPU Usage: 2.1%
  File Descriptors: 12/1024
  Goroutines: 8
```

**JSON Format**

```json
{
  "running": true,
  "pid": 12345,
  "uptime": "2h45m30s",
  "version": "1.0.0",
  "ipc_server": {
    "socket_path": "/home/user/.aether-vault/agent.sock",
    "active_connections": 3,
    "max_connections": 100,
    "uptime": "2h45m30s"
  },
  "capability_engine": {
    "status": "healthy",
    "total_capabilities": 127,
    "active_capabilities": 45,
    "expired_capabilities": 80,
    "revoked_capabilities": 2,
    "cache_size": "45/10000",
    "last_cleanup": "5m ago"
  },
  "policy_engine": {
    "status": "healthy",
    "loaded_policies": 5,
    "cache_hits": 892,
    "cache_misses": 45,
    "cache_hit_rate": "95.2%",
    "last_policy_reload": "1h ago"
  },
  "audit_system": {
    "status": "healthy",
    "total_events": 1247,
    "buffer_size": "234/1000",
    "last_flush": "2m ago",
    "log_file": "/home/user/.aether-vault/audit.log",
    "log_size": "15.2MB"
  },
  "system_resources": {
    "memory_usage": "45.2MB",
    "cpu_usage": "2.1%",
    "file_descriptors": "12/1024",
    "goroutines": 8
  }
}
```

---

### agent reload

Reloads the agent configuration and cached policies without restarting the daemon.

#### Syntax

```bash
vault agent reload [flags]
```

#### Examples

**Reload Agent**

```bash
vault agent reload
```

#### Reload Process

1. **Configuration Reload**: Reloads configuration from file
2. **Policy Cache Refresh**: Refreshes cached policies from disk
3. **Policy Engine Restart**: Restarts policy engine with new policies
4. **Maintain Connections**: Keeps existing client connections active
5. **Log Reload Events**: Logs all reload events for audit

#### Output Examples

**Successful Reload**

```
Reloading Aether Vault Agent...
Configuration reloaded from /home/user/.aether-vault/agent.yaml
Policy cache refreshed
Policy engine restarted with 5 policies
Existing connections maintained
Agent reloaded successfully
```

**Reload with Issues**

```
Reloading Aether Vault Agent...
Warning: Failed to reload configuration: file not found, using current config
Policy cache refreshed
Policy engine restarted with 5 policies
Existing connections maintained
Agent reloaded successfully with warnings
```

---

### agent config

Manages agent configuration including showing current configuration, generating default configuration, and validating configuration files.

#### Syntax

```bash
vault agent config [flags]
```

#### Optional Flags

| Flag         | Type   | Default | Description                    |
| ------------ | ------ | ------- | ------------------------------ |
| `--output`   | string | -       | Output configuration to file   |
| `--validate` | bool   | false   | Validate configuration only    |
| `--generate` | bool   | false   | Generate default configuration |

#### Examples

**Show Current Configuration**

```bash
vault agent config
```

**Generate Default Configuration**

```bash
vault agent config --generate
```

**Generate Configuration to File**

```bash
vault agent config --generate --output /etc/aether-vault/agent.yaml
```

**Validate Configuration**

```bash
vault agent config --validate --config /etc/aether-vault/agent.yaml
```

#### Response Format

**Current Configuration (Table Format)**

```
Agent Configuration:
  Mode: standard
  Log Level: info
  Socket Path: /home/user/.aether-vault/agent.sock

Capability Engine:
  Enable: true
  Default TTL: 300
  Max TTL: 3600
  Max Uses: 100
  Signing Algorithm: ed25519

Policy Engine:
  Enable: true
  Directory: /home/user/.aether-vault/policies
  Cache Enable: true
  Cache TTL: 300
  Cache Size: 1000

Audit System:
  Enable: true
  Log File: /home/user/.aether-vault/audit.log
  Buffer Size: 1000
  Flush Interval: 60
  Enable Rotation: true

IPC Server:
  Timeout: 30
  Max Connections: 100
  Enable Auth: true
```

**Default Configuration (YAML Format)**

```yaml
# Aether Vault Agent Configuration
version: "1.0"

# Agent Settings
mode: "standard"
log_level: "info"
socket_path: "/home/user/.aether-vault/agent.sock"

# Capability Engine
capability_engine:
  enable: true
  default_ttl: 300
  max_ttl: 3600
  max_uses: 100
  signing_algorithm: "ed25519"
  enable_usage_tracking: true
  cleanup_interval: 60

# Policy Engine
policy_engine:
  enable: true
  directory: "/home/user/.aether-vault/policies"
  cache:
    enable: true
    ttl: 300
    size: 1000
  enable_reloading: true
  reload_interval: 60
  default_decision: "deny"

# Audit System
audit:
  enable: true
  log_file: "/home/user/.aether-vault/audit.log"
  enable_buffer: true
  buffer_size: 1000
  flush_interval: 60
  enable_rotation: true
  max_file_size: 104857600
  max_backup_files: 10
  log_level: "info"

# IPC Server
ipc:
  timeout: 30
  max_connections: 100
  enable_auth: true
  enable_tls: false
```

**Validation Results**

```
Validating configuration: /etc/aether-vault/agent.yaml
✓ Configuration file syntax is valid
✓ All required fields are present
✓ Capability engine configuration is valid
✓ Policy engine configuration is valid
✓ Audit system configuration is valid
✓ IPC server configuration is valid

Configuration is valid
```

## Agent Modes

### Standard Mode

Default mode for normal operation with balanced security and performance.

```bash
vault agent start --mode standard
```

**Characteristics:**

- Full CBAC functionality
- Standard security policies
- Normal performance optimization
- Comprehensive audit logging

### Hardened Mode

Enhanced security mode for high-security environments.

```bash
vault agent start --mode hardened
```

**Characteristics:**

- Stricter security policies
- Reduced capability TTLs
- Enhanced audit logging
- Additional validation checks
- Limited connection rates

### Development Mode

Relaxed security mode for development and testing.

```bash
vault agent start --mode development
```

**Characteristics:**

- Longer capability TTLs for convenience
- Debug-level logging
- Relaxed security policies
- Additional debugging information
- Performance monitoring enabled

## Configuration Management

### Configuration File Structure

The agent uses YAML configuration files. Here's a comprehensive example:

```yaml
# Aether Vault Agent Configuration
version: "1.0"

# Basic Settings
mode: "standard"
log_level: "info"
socket_path: "/home/user/.aether-vault/agent.sock"
pid_file: "/home/user/.aether-vault/agent.pid"

# Capability Engine Configuration
capability_engine:
  enable: true
  default_ttl: 300
  max_ttl: 3600
  max_uses: 100
  issuer: "aether-vault-agent"
  signing_algorithm: "ed25519"
  enable_usage_tracking: true
  cleanup_interval: 60

  # Key Management
  keys:
    private_key_file: "/home/user/.aether-vault/private.key"
    public_key_file: "/home/user/.aether-vault/public.key"
    auto_generate: true

# Policy Engine Configuration
policy_engine:
  enable: true
  directory: "/home/user/.aether-vault/policies"
  default_decision: "deny"

  # Cache Configuration
  cache:
    enable: true
    ttl: 300
    size: 1000

  # Reloading
  enable_reloading: true
  reload_interval: 60

  # Validation
  enable_validation: true

# Audit System Configuration
audit:
  enable: true
  log_file: "/home/user/.aether-vault/audit.log"
  log_level: "info"

  # Buffer Configuration
  enable_buffer: true
  buffer_size: 1000
  flush_interval: 60

  # Log Rotation
  enable_rotation: true
  max_file_size: 104857600 # 100MB
  max_backup_files: 10
  enable_compression: false

  # Security
  enable_signature: false
  signature_key_file: "/home/user/.aether-vault/audit-signature.key"

  # SIEM Integration
  enable_siem: false
  siem_endpoint: "https://siem.company.com/events"
  siem_format: "json"

# IPC Server Configuration
ipc:
  timeout: 30
  max_connections: 100
  enable_auth: true

  # TLS Configuration
  enable_tls: false
  tls_cert_file: "/home/user/.aether-vault/server.crt"
  tls_key_file: "/home/user/.aether-vault/server.key"

  # Authentication
  auth_timeout: 30
  conn_timeout: 60

# Storage Configuration
storage:
  enable_persistence: true
  storage_file: "/home/user/.aether-vault/capabilities.json"
  enable_compression: false
  enable_encryption: false
  encryption_key_file: "/home/user/.aether-vault/storage.key"

# Health Monitoring
health:
  enable_checks: true
  check_interval: 30
  enable_metrics: true
  metrics_port: 9090
```

### Environment Variables

Configuration can be overridden with environment variables:

```bash
export VAULT_AGENT_MODE="hardened"
export VAULT_AGENT_LOG_LEVEL="debug"
export VAULT_AGENT_SOCKET_PATH="/tmp/vault.sock"
export VAULT_AGENT_POLICY_DIR="/etc/aether-vault/policies"
export VAULT_AGENT_AUDIT_FILE="/var/log/vault/audit.log"
```

## Health Monitoring

### Health Checks

The agent performs regular health checks on all components:

```bash
# Check agent health
vault agent status --verbose
```

**Health Check Components:**

1. **IPC Server**: Socket accessibility and connection handling
2. **Capability Engine**: Token generation and validation
3. **Policy Engine**: Policy loading and evaluation
4. **Audit System**: Log writing and rotation
5. **Storage**: Persistence and cleanup
6. **System Resources**: Memory, CPU, file descriptors

### Metrics

The agent can expose metrics for monitoring:

```yaml
health:
  enable_metrics: true
  metrics_port: 9090
```

**Available Metrics:**

- `vault_agent_capabilities_total`: Total capabilities created
- `vault_agent_capabilities_active`: Currently active capabilities
- `vault_agent_policy_evaluations_total`: Policy evaluations performed
- `vault_agent_audit_events_total`: Audit events logged
- `vault_agent_ipc_connections_active`: Active IPC connections
- `vault_agent_memory_usage_bytes`: Memory usage in bytes
- `vault_agent_cpu_usage_percent`: CPU usage percentage

## Troubleshooting

### Common Issues

#### Agent Won't Start

**Symptoms:**

```
Error: Failed to start agent: address already in use
```

**Solutions:**

```bash
# Check if agent is already running
vault agent status

# Kill existing agent
pkill -f "vault agent"

# Remove stale socket file
rm -f ~/.aether-vault/agent.sock

# Start agent
vault agent start
```

#### Permission Issues

**Symptoms:**

```
Error: Failed to create socket: permission denied
```

**Solutions:**

```bash
# Check socket directory permissions
ls -la ~/.aether-vault/

# Fix permissions
chmod 755 ~/.aether-vault/
chmod 644 ~/.aether-vault/agent.sock

# Start with different socket path
vault agent start --socket-path /tmp/vault.sock
```

#### Configuration Errors

**Symptoms:**

```
Error: Failed to load configuration: invalid YAML
```

**Solutions:**

```bash
# Validate configuration
vault agent config --validate --config ~/.aether-vault/agent.yaml

# Generate new default config
vault agent config --generate --output ~/.aether-vault/agent.yaml

# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('~/.aether-vault/agent.yaml'))"
```

#### Policy Loading Issues

**Symptoms:**

```
Warning: Failed to load policy directory: No such file or directory
```

**Solutions:**

```bash
# Create policy directory
mkdir -p ~/.aether-vault/policies

# Add example policy
cat > ~/.aether-vault/policies/default.json << EOF
{
  "id": "default",
  "name": "Default Policy",
  "version": "1.0",
  "status": "active",
  "rules": [
    {
      "id": "allow-local",
      "effect": "allow",
      "resources": ["secret:*"],
      "actions": ["*"],
      "identities": ["*"],
      "priority": 100
    }
  ]
}
EOF

# Reload agent
vault agent reload
```

### Debug Mode

For detailed troubleshooting, start the agent in debug mode:

```bash
vault agent start --log-level debug --mode development
```

This enables:

- Detailed logging of all operations
- Stack traces for errors
- Performance metrics
- Additional validation checks

### Log Analysis

**Agent Logs**

```bash
# View agent logs
tail -f ~/.aether-vault/agent.log

# Search for errors
grep -i error ~/.aether-vault/agent.log

# View recent capability requests
grep "capability_request" ~/.aether-vault/audit.log | tail -10
```

**System Logs**

```bash
# Check system logs for agent issues
journalctl -u vault-agent -f

# Check for socket issues
ss -xl | grep vault
```

## Best Practices

### 1. Production Deployment

```bash
# Use hardened mode
vault agent start --mode hardened --log-level warn

# Use systemd service
sudo systemctl enable vault-agent
sudo systemctl start vault-agent
```

### 2. Configuration Management

```bash
# Use configuration management
vault agent config --generate --output /etc/aether-vault/agent.yaml

# Validate before deployment
vault agent config --validate --config /etc/aether-vault/agent.yaml
```

### 3. Monitoring

```bash
# Regular health checks
vault agent status --verbose

# Monitor logs
tail -f ~/.aether-vault/audit.log | grep "ERROR\|WARN"

# Check capability usage
vault capability list --status "active" | wc -l
```

### 4. Security

```bash
# Use appropriate file permissions
chmod 600 ~/.aether-vault/agent.yaml
chmod 700 ~/.aether-vault/

# Regular cleanup
vault agent status --verbose | grep "Last Cleanup"
```

## Integration Examples

### Systemd Service

```ini
[Unit]
Description=Aether Vault Agent
After=network.target

[Service]
Type=forking
User=vault
Group=vault
ExecStart=/usr/local/bin/vault agent start --config /etc/aether-vault/agent.yaml
ExecReload=/usr/local/bin/vault agent reload
ExecStop=/usr/local/bin/vault agent stop
PIDFile=/var/run/vault/agent.pid
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Docker Container

```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY vault /usr/local/bin/vault
RUN chmod +x /usr/local/bin/vault

RUN adduser -D -s /bin/sh vault

USER vault
EXPOSE 9090

CMD ["vault", "agent", "start", "--mode", "standard"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vault-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vault-agent
  template:
    metadata:
      labels:
        app: vault-agent
    spec:
      containers:
        - name: vault-agent
          image: aether-vault/agent:latest
          args:
            - "start"
            - "--mode"
            - "standard"
            - "--log-level"
            - "info"
          volumeMounts:
            - name: config
              mountPath: /etc/aether-vault
            - name: data
              mountPath: /home/vault/.aether-vault
          ports:
            - containerPort: 9090
              name: metrics
      volumes:
        - name: config
          configMap:
            name: vault-agent-config
        - name: data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: vault-agent-metrics
spec:
  selector:
    app: vault-agent
  ports:
    - port: 9090
      targetPort: 9090
      name: metrics
```

---

_See [CONFIG_AGENT.md](../CONFIG_AGENT.md) for detailed configuration options and [INTEGRATION_DOCKER.md](../INTEGRATION_DOCKER.md) for container deployment guides._
