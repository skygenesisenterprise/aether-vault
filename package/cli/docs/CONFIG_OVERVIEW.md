# Configuration Overview

## Introduction

Aether Vault CLI uses a hierarchical configuration system that supports multiple sources, environment-specific overrides, and runtime validation. The configuration system is designed to be secure by default, flexible for different deployment scenarios, and easy to manage at scale.

## Configuration Hierarchy

Configuration is loaded in order of precedence (highest to lowest):

1. **Command Line Flags**: Direct command overrides
2. **Environment Variables**: `VAULT_*` prefixed variables
3. **Configuration File**: YAML configuration file
4. **Default Values**: Built-in secure defaults

```
Command Line Flags
       ↓
Environment Variables
       ↓
Configuration File
       ↓
Default Values
```

## Configuration File Structure

### Primary Configuration File

**Location**: `~/.aether-vault/config.yaml`

```yaml
# Aether Vault CLI Configuration
version: "1.0"

# Execution Mode
mode: "local" # local, cloud

# Local Configuration
local:
  path: "~/.aether-vault"
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
  socket_path: "~/.aether-vault/agent.sock"
  log_level: "info"
  capabilities:
    enable: true
    default_ttl: 300
    max_ttl: 3600
    max_uses: 100

# Policy Engine
policy:
  enable: true
  directory: "~/.aether-vault/policies"
  cache:
    enable: true
    ttl: 300
    size: 1000

# Audit Configuration
audit:
  enable: true
  log_file: "~/.aether-vault/audit.log"
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

## Configuration Sections

### 1. Execution Mode

Controls how the CLI operates:

```yaml
# Execution mode: local or cloud
mode: "local"

# Local mode settings
local:
  path: "~/.aether-vault"
  auto_init: true

# Cloud mode settings
cloud:
  url: "https://cloud.aethervault.com"
  region: "us-west-2"
  sync_interval: 300
```

**Values:**

- `local`: Offline operation with local storage
- `cloud`: Connected mode with cloud synchronization

### 2. Local Storage

Configuration for local data storage:

```yaml
local:
  path: "~/.aether-vault"
  storage:
    type: "file" # file, memory, custom
    encryption:
      enable: true
      algorithm: "aes-256-gcm"
      key_file: "~/.aether-vault/storage.key"
    compression:
      enable: false
      algorithm: "gzip"
    backup:
      enable: true
      interval: 3600
      retention: 7
      location: "~/.aether-vault/backups"
```

### 3. Cloud Configuration

Settings for cloud-connected mode:

```yaml
cloud:
  url: "https://cloud.aethervault.com"
  api_version: "v1"
  region: "us-west-2"
  timeout: 30
  retry:
    max_attempts: 3
    backoff: "exponential"
    initial_delay: 1
    max_delay: 10
  auth:
    method: "oauth" # oauth, token, certificate
    oauth:
      client_id: "your-client-id"
      client_secret: "your-client-secret"
      auth_url: "https://auth.aethervault.com/oauth"
      token_url: "https://auth.aethervault.com/token"
      scopes: ["vault.read", "vault.write"]
    token:
      value: "your-static-token"
      type: "bearer"
    certificate:
      cert_file: "/path/to/cert.pem"
      key_file: "/path/to/key.pem"
      ca_file: "/path/to/ca.pem"
  sync:
    enable: true
    direction: "bidirectional" # local-to-cloud, cloud-to-local, bidirectional
    interval: 300
    conflict_resolution: "local_wins" # local_wins, cloud_wins, manual
```

### 4. Agent Configuration

Settings for the Aether Vault Agent:

```yaml
agent:
  # Basic Settings
  enable: true
  mode: "standard" # standard, hardened, development
  socket_path: "~/.aether-vault/agent.sock"
  pid_file: "~/.aether-vault/agent.pid"
  log_level: "info"
  log_file: "~/.aether-vault/agent.log"

  # Capability Engine
  capabilities:
    enable: true
    default_ttl: 300
    max_ttl: 3600
    max_uses: 100
    issuer: "aether-vault-agent"
    signing_algorithm: "ed25519"
    enable_usage_tracking: true
    cleanup_interval: 60
    keys:
      private_key_file: "~/.aether-vault/agent.key"
      public_key_file: "~/.aether-vault/agent.pub"
      auto_generate: true

  # Policy Engine
  policy:
    enable: true
    directory: "~/.aether-vault/policies"
    default_decision: "deny"
    cache:
      enable: true
      ttl: 300
      size: 1000
    reloading:
      enable: true
      interval: 60
    validation:
      enable: true
      strict_mode: true

  # IPC Server
  ipc:
    timeout: 30
    max_connections: 100
    enable_auth: true
    enable_tls: false
    tls:
      cert_file: "~/.aether-vault/server.crt"
      key_file: "~/.aether-vault/server.key"
      ca_file: "~/.aether-vault/ca.crt"
    auth:
      timeout: 30
      methods: ["token", "certificate"]

  # Health Monitoring
  health:
    enable_checks: true
    check_interval: 30
    enable_metrics: true
    metrics_port: 9090
    endpoints:
      - "/health"
      - "/metrics"
      - "/status"
```

### 5. Policy Engine Configuration

```yaml
policy:
  enable: true
  directory: "~/.aether-vault/policies"
  default_decision: "deny"

  # Cache Configuration
  cache:
    enable: true
    ttl: 300
    size: 1000
    eviction_policy: "lru" # lru, fifo, random

  # Policy Reloading
  reloading:
    enable: true
    interval: 60
    watch_files: true
    validation_on_reload: true

  # Policy Validation
  validation:
    enable: true
    strict_mode: true
    require_description: true
    max_rules_per_policy: 100

  # External Policy Sources
  external:
    enable: false
    opa:
      url: "http://opa:8181"
      bundle_path: "/bundles"
      timeout: 10
    rego:
      packages: ["aether.vault.*"]
```

### 6. Audit Configuration

```yaml
audit:
  enable: true
  log_level: "info"
  log_file: "~/.aether-vault/audit.log"

  # Buffer Configuration
  buffer:
    enable: true
    size: 1000
    flush_interval: 60
    flush_on_shutdown: true

  # Log Rotation
  rotation:
    enable: true
    max_size: "100MB"
    max_files: 10
    compress: true
    timestamp_format: "2006-01-02T15:04:05Z"

  # Security
  security:
    enable_signature: false
    signature_algorithm: "ed25519"
    signature_key_file: "~/.aether-vault/audit-signature.key"
    enable_hash_chain: true
    hash_algorithm: "sha256"

  # SIEM Integration
  siem:
    enable: false
    endpoint: "https://siem.company.com/events"
    format: "json" # json, syslog, cef
    authentication:
      type: "bearer" # bearer, basic, certificate
      token: "your-siem-token"
    batch:
      enable: true
      size: 100
      interval: 30
    retry:
      max_attempts: 3
      backoff: "exponential"

  # Event Filtering
  filtering:
    enable: false
    include_events: ["capability_*", "policy_*"]
    exclude_events: ["debug_*"]
    min_severity: "info"
```

### 7. IPC Configuration

```yaml
ipc:
  # Connection Settings
  timeout: 30
  max_connections: 100
  enable_auth: true
  enable_tls: false

  # Authentication
  auth:
    timeout: 30
    methods: ["token", "certificate"]
    token_validation: "strict"

  # TLS Settings
  tls:
    enable: false
    cert_file: "~/.aether-vault/server.crt"
    key_file: "~/.aether-vault/server.key"
    ca_file: "~/.aether-vault/ca.crt"
    min_version: "1.2"
    cipher_suites: ["TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384"]

  # Rate Limiting
  rate_limiting:
    enable: true
    requests_per_second: 100
    burst: 200
    per_client: true

  # Protocol Settings
  protocol:
    version: "1.0"
    compression: false
    keep_alive: true
    keep_alive_timeout: 30
```

### 8. UI Configuration

```yaml
ui:
  # Output Format
  format: "table" # table, json, yaml
  colors: true
  unicode: true

  # Display Options
  banner: true
  timestamps: true
  timezone: "UTC"

  # Table Formatting
  table:
    max_width: 120
    wrap_text: true
    truncate_long: true
    show_headers: true

  # JSON Formatting
  json:
    pretty_print: true
    indent: 2
    sort_keys: false

  # Progress Indicators
  progress:
    enable: true
    spinner: true
    bar: true
    percentage: true

  # Error Display
  errors:
    show_stack_trace: false
    show_context: true
    max_context_lines: 3
```

## Environment Variables

### Core Variables

| Variable            | Default                       | Description                          |
| ------------------- | ----------------------------- | ------------------------------------ |
| `VAULT_CONFIG_PATH` | `~/.aether-vault/config.yaml` | Configuration file path              |
| `VAULT_MODE`        | `local`                       | Execution mode (local, cloud)        |
| `VAULT_LOG_LEVEL`   | `info`                        | Log level (debug, info, warn, error) |
| `VAULT_PATH`        | `~/.aether-vault`             | Vault data directory                 |

### Agent Variables

| Variable                  | Default                      | Description       |
| ------------------------- | ---------------------------- | ----------------- |
| `VAULT_AGENT_ENABLE`      | `true`                       | Enable agent      |
| `VAULT_AGENT_MODE`        | `standard`                   | Agent mode        |
| `VAULT_AGENT_SOCKET_PATH` | `~/.aether-vault/agent.sock` | Agent socket path |
| `VAULT_AGENT_LOG_LEVEL`   | `info`                       | Agent log level   |

### Cloud Variables

| Variable                    | Default | Description         |
| --------------------------- | ------- | ------------------- |
| `VAULT_CLOUD_URL`           | -       | Cloud server URL    |
| `VAULT_CLOUD_REGION`        | -       | Cloud region        |
| `VAULT_CLOUD_CLIENT_ID`     | -       | OAuth client ID     |
| `VAULT_CLOUD_CLIENT_SECRET` | -       | OAuth client secret |

### Capability Variables

| Variable            | Default | Description             |
| ------------------- | ------- | ----------------------- |
| `VAULT_DEFAULT_TTL` | `300`   | Default capability TTL  |
| `VAULT_MAX_TTL`     | `3600`  | Maximum capability TTL  |
| `VAULT_MAX_USES`    | `100`   | Maximum capability uses |

### Policy Variables

| Variable                    | Default                    | Description         |
| --------------------------- | -------------------------- | ------------------- |
| `VAULT_POLICY_DIR`          | `~/.aether-vault/policies` | Policy directory    |
| `VAULT_POLICY_CACHE_ENABLE` | `true`                     | Enable policy cache |
| `VAULT_POLICY_CACHE_TTL`    | `300`                      | Policy cache TTL    |

### Audit Variables

| Variable             | Default                     | Description          |
| -------------------- | --------------------------- | -------------------- |
| `VAULT_AUDIT_ENABLE` | `true`                      | Enable audit logging |
| `VAULT_AUDIT_FILE`   | `~/.aether-vault/audit.log` | Audit log file       |
| `VAULT_AUDIT_LEVEL`  | `info`                      | Audit log level      |

## Configuration Validation

### Built-in Validation

The CLI validates configuration on startup:

```bash
# Validate configuration
vault agent config --validate

# Show validation errors
vault agent config --validate --verbose
```

### Validation Rules

1. **Required Fields**: All required fields must be present
2. **Type Validation**: Field types must be correct
3. **Range Validation**: Values must be within acceptable ranges
4. **Path Validation**: File paths must be accessible
5. **Security Validation**: Security settings must be safe

### Custom Validation

Add custom validation rules:

```yaml
validation:
  custom_rules:
    - name: "check_tls_certificates"
      description: "Validate TLS certificates exist"
      condition: "agent.ipc.tls.enable == true"
      validation: "file_exists(agent.ipc.tls.cert_file)"
    - name: "check_policy_directory"
      description: "Validate policy directory exists"
      condition: "policy.enable == true"
      validation: "directory_exists(policy.directory)"
```

## Configuration Templates

### Development Template

```yaml
# Development Configuration
version: "1.0"
mode: "local"

agent:
  enable: true
  mode: "development"
  log_level: "debug"
  capabilities:
    default_ttl: 1800 # 30 minutes for development
    max_ttl: 7200 # 2 hours max

policy:
  enable: true
  default_decision: "allow" # Permissive for development

audit:
  enable: true
  log_level: "debug"
  buffer_size: 100

ui:
  format: "json"
  colors: true
  errors:
    show_stack_trace: true
```

### Production Template

```yaml
# Production Configuration
version: "1.0"
mode: "local"

agent:
  enable: true
  mode: "hardened"
  log_level: "warn"
  capabilities:
    default_ttl: 300 # 5 minutes
    max_ttl: 900 # 15 minutes max
    max_uses: 10

policy:
  enable: true
  default_decision: "deny"
  validation:
    strict_mode: true

audit:
  enable: true
  log_level: "info"
  security:
    enable_signature: true
    enable_hash_chain: true
  siem:
    enable: true
    endpoint: "https://siem.company.com/events"

ipc:
  enable_tls: true
  rate_limiting:
    enable: true
    requests_per_second: 50
```

### High Security Template

```yaml
# High Security Configuration
version: "1.0"
mode: "local"

local:
  storage:
    encryption:
      enable: true
      algorithm: "aes-256-gcm"
    backup:
      enable: true
      encryption: true

agent:
  enable: true
  mode: "hardened"
  log_level: "error"
  capabilities:
    default_ttl: 60 # 1 minute
    max_ttl: 300 # 5 minutes max
    max_uses: 1 # Single use only

policy:
  enable: true
  default_decision: "deny"
  validation:
    strict_mode: true
    require_description: true

audit:
  enable: true
  log_level: "warn"
  security:
    enable_signature: true
    enable_hash_chain: true
  siem:
    enable: true
    format: "cef"

ipc:
  enable_tls: true
  enable_auth: true
  rate_limiting:
    enable: true
    requests_per_second: 10
```

## Configuration Management

### Configuration Commands

```bash
# Show current configuration
vault config show

# Show specific section
vault config show --section agent

# Validate configuration
vault config validate

# Generate default configuration
vault config generate --output /path/to/config.yaml

# Test configuration
vault config test --config /path/to/config.yaml
```

### Configuration Diff

```bash
# Compare configurations
vault config diff /path/to/config1.yaml /path/to/config2.yaml

# Compare with running configuration
vault config diff /path/to/config.yaml --running
```

### Configuration Backup

```bash
# Backup configuration
vault config backup --output /path/to/backup.yaml

# Restore configuration
vault config restore --input /path/to/backup.yaml
```

## Security Considerations

### File Permissions

```bash
# Secure configuration file
chmod 600 ~/.aether-vault/config.yaml

# Secure directory
chmod 700 ~/.aether-vault/

# Secure agent keys
chmod 600 ~/.aether-vault/agent.key
```

### Sensitive Data

- **Avoid Secrets in Config**: Don't store passwords or tokens in config files
- **Use Environment Variables**: Store sensitive data in environment variables
- **Encrypt Storage**: Enable storage encryption for sensitive data
- **Key Management**: Use proper key management practices

### Access Control

```yaml
# Restrict configuration access
security:
  config_file_permissions: "600"
  directory_permissions: "700"
  key_file_permissions: "600"
  audit_file_permissions: "644"
```

## Migration Guide

### From v1.0 to v2.0

**Breaking Changes:**

1. `agent.capabilities.ttl` → `agent.capabilities.default_ttl`
2. `audit.log_file` → `audit.log_file`
3. `policy.cache_enabled` → `policy.cache.enable`

**Migration Script:**

```bash
#!/bin/bash
# Migrate configuration from v1.0 to v2.0

CONFIG_FILE="$HOME/.aether-vault/config.yaml"

# Backup original config
cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

# Update configuration
sed -i 's/agent\.capabilities\.ttl:/agent.capabilities.default_ttl:/' "$CONFIG_FILE"
sed -i 's/audit\.log_file:/audit.log_file:/' "$CONFIG_FILE"
sed -i 's/policy\.cache_enabled:/policy.cache.enable:/' "$CONFIG_FILE"

echo "Configuration migrated successfully"
```

## Troubleshooting

### Common Configuration Issues

#### Invalid YAML

```bash
# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('$HOME/.aether-vault/config.yaml'))"

# Or use yamllint
yamllint ~/.aether-vault/config.yaml
```

#### Permission Issues

```bash
# Check file permissions
ls -la ~/.aether-vault/

# Fix permissions
chmod 600 ~/.aether-vault/config.yaml
chmod 700 ~/.aether-vault/
```

#### Missing Directories

```bash
# Create missing directories
mkdir -p ~/.aether-vault/policies
mkdir -p ~/.aether-vault/backups
```

#### Configuration Validation

```bash
# Validate configuration
vault config validate --verbose

# Check specific section
vault config show --section agent
```

### Debug Configuration

```bash
# Enable debug logging
export VAULT_LOG_LEVEL=debug

# Show loaded configuration
vault config show --verbose

# Test configuration
vault config test --debug
```

---

_See [CONFIG_FILE.md](CONFIG_FILE.md) for detailed file reference, [CONFIG_ENVIRONMENT.md](CONFIG_ENVIRONMENT.md) for environment variables, and [CONFIG_AGENT.md](CONFIG_AGENT.md) for agent-specific configuration._
