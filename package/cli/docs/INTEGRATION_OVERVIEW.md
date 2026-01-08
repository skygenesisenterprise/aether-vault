# Integration Overview

## Introduction

Aether Vault CLI is designed to integrate seamlessly with various runtime environments, deployment platforms, and application frameworks. This document provides an overview of integration approaches, patterns, and best practices for incorporating Aether Vault's capability-based access control into your existing infrastructure.

## Integration Approaches

### 1. IPC Client Integration

The primary integration method is through the IPC (Inter-Process Communication) client, which communicates with the Aether Vault Agent via Unix sockets.

**When to Use:**

- Applications running on the same host as the agent
- Local services and daemons
- Containerized applications with sidecar agents
- Development and testing environments

**Benefits:**

- Low latency communication
- No network dependencies
- Simple client library
- Local fallback operation

### 2. Sidecar Pattern

Deploy the Aether Vault Agent as a sidecar container alongside your application containers.

**When to Use:**

- Kubernetes deployments
- Docker Compose applications
- Microservices architectures
- Container orchestration platforms

**Benefits:**

- Isolated agent lifecycle
- Shared access within pod
- Easy scaling and updates
- Standard container patterns

### 3. Daemon Service Pattern

Run the Aether Vault Agent as a system-wide daemon service.

**When to Use:**

- Host-level services
- Multiple applications per host
- Traditional VM deployments
- Bare metal installations

**Benefits:**

- Shared resource across applications
- Centralized management
- System-level integration
- Boot-time startup

### 4. Library Integration

Embed Aether Vault capabilities directly into your application using Go libraries.

**When to Use:**

- Go applications
- High-performance requirements
- Custom integration needs
- Embedded systems

**Benefits:**

- No external dependencies
- Maximum performance
- Custom behavior
- Tight integration

## Integration Patterns

### Request-Response Pattern

Applications request capabilities when needed and use them immediately.

```go
// Request capability when needed
capability, err := client.RequestCapability(&types.CapabilityRequest{
    Resource: "secret:/db/primary",
    Actions:  []string{"read"},
    TTL:      300,
})

// Use capability immediately
if capability.Status == "granted" {
    secret := getSecret(capability.Capability.ID)
}
```

**Use Cases:**

- On-demand secret access
- Sporadic resource usage
- Event-driven applications
- Microservices calls

### Capability Caching Pattern

Cache capabilities for short-term reuse to reduce request overhead.

```go
// Check cache first
if capability, exists := cache.Get("db_read"); exists && !isExpired(capability) {
    return useCapability(capability)
}

// Request new capability
capability, err := client.RequestCapability(request)
if err != nil {
    return err
}

// Cache for future use
cache.Set("db_read", capability, 5*time.Minute)
return useCapability(capability)
```

**Use Cases:**

- High-frequency operations
- Batch processing
- Long-running applications
- Performance-critical services

### Pre-Authorization Pattern

Request capabilities during application startup for known operations.

```go
func initializeApp() error {
    // Pre-authorize common operations
    capabilities := map[string]*types.Capability{
        "db_read": requestCapability("secret:/db/primary", "read"),
        "config_read": requestCapability("secret:/config/app", "read"),
        "log_write": requestCapability("log:/app", "write"),
    }

    // Store for application lifetime
    app.capabilities = capabilities
    return nil
}
```

**Use Cases:**

- Service initialization
- Known resource requirements
- Startup optimization
- Background services

### Just-In-Time Pattern

Request capabilities immediately before each use for maximum security.

```go
func getDatabaseConnection() (*sql.DB, error) {
    // Request capability just before use
    capability, err := client.RequestCapability(&types.CapabilityRequest{
        Resource: "secret:/db/primary",
        Actions:  []string{"read"},
        TTL:      60, // Very short TTL
    })

    if err != nil || capability.Status != "granted" {
        return nil, fmt.Errorf("failed to get database capability")
    }

    // Use capability immediately
    return connectToDatabase(capability.Capability.ID)
}
```

**Use Cases:**

- High-security environments
- Sensitive operations
- Audit-critical applications
- Compliance requirements

## Runtime Environment Integration

### Docker Integration

#### Method 1: Host Socket Mount

Mount the host's Unix socket into the container:

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o vault-cli ./cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/vault-cli /usr/local/bin/vault
COPY --from=builder /app/cmd/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/bash
# entrypoint.sh

# Wait for agent socket
while [ ! -S /var/run/vault/agent.sock ]; do
    echo "Waiting for Vault agent socket..."
    sleep 1
done

# Run application
exec "$@"
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    volumes:
      - /var/run/vault:/var/run/vault:ro
    environment:
      - VAULT_AGENT_SOCKET_PATH=/var/run/vault/agent.sock
    depends_on:
      - vault-agent

  vault-agent:
    image: aether-vault/agent:latest
    volumes:
      - /var/run/vault:/var/run/vault
      - ./config:/etc/aether-vault
    command: ["start", "--config", "/etc/aether-vault/agent.yaml"]
```

#### Method 2: Sidecar Container

Deploy agent as sidecar:

```yaml
# kubernetes.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
    - name: app
      image: my-app:latest
      volumeMounts:
        - name: vault-socket
          mountPath: /var/run/vault
      env:
        - name: VAULT_AGENT_SOCKET_PATH
          value: /var/run/vault/agent.sock

    - name: vault-agent
      image: aether-vault/agent:latest
      args:
        - "start"
        - "--socket-path"
        - "/var/run/vault/agent.sock"
      volumeMounts:
        - name: vault-socket
          mountPath: /var/run/vault
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000

  volumes:
    - name: vault-socket
      emptyDir: {}
```

### Kubernetes Integration

#### Method 1: DaemonSet

Deploy agent as DaemonSet for node-level access:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: vault-agent
  labels:
    app: vault-agent
spec:
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
          volumeMounts:
            - name: socket-dir
              mountPath: /var/run/vault
            - name: config-dir
              mountPath: /etc/aether-vault
          ports:
            - containerPort: 9090
              name: metrics
      volumes:
        - name: socket-dir
          hostPath:
            path: /var/run/vault
        - name: config-dir
          configMap:
            name: vault-agent-config
```

#### Method 2: Init Container

Use init container to set up capabilities:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  initContainers:
    - name: vault-init
      image: aether-vault/cli:latest
      command: ["sh", "-c"]
      args:
        - |
          vault capability request \
            --resource "secret:/db/primary" \
            --action read \
            --ttl 3600 \
            --output /etc/capabilities/db.json
      volumeMounts:
        - name: capabilities
          mountPath: /etc/capabilities
      env:
        - name: VAULT_AGENT_SOCKET_PATH
          value: /var/run/vault/agent.sock

  containers:
    - name: app
      image: my-app:latest
      volumeMounts:
        - name: capabilities
          mountPath: /etc/capabilities
          readOnly: true
      env:
        - name: CAPABILITY_FILE
          value: /etc/capabilities/db.json
```

### CI/CD Integration

#### GitHub Actions

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

      - name: Setup Aether Vault CLI
        run: |
          curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault
          chmod +x vault
          sudo mv vault /usr/local/bin/

      - name: Start Vault Agent
        run: |
          vault agent start --mode development &
          sleep 5

      - name: Request Deployment Capability
        run: |
          vault capability request \
            --resource "secret:/deploy/production" \
            --action execute \
            --ttl 600 \
            --identity "github-actions" \
            --purpose "Production deployment" \
            --output capability.json

      - name: Deploy Application
        run: |
          # Application uses capability file
          ./deploy.sh --capability capability.json

      - name: Cleanup
        if: always()
        run: |
          vault agent stop
```

#### Jenkins Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Setup Vault') {
            steps {
                sh 'curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault'
                sh 'chmod +x vault && sudo mv vault /usr/local/bin/'
                sh 'vault agent start --mode development &'
                sh 'sleep 5'
            }
        }

        stage('Request Capability') {
            steps {
                sh '''
                    vault capability request \
                        --resource "secret:/build/${env.BRANCH_NAME}" \
                        --action read,write \
                        --ttl 1800 \
                        --identity "jenkins" \
                        --purpose "Build pipeline" \
                        --output capability.json
                '''
            }
        }

        stage('Build') {
            steps {
                sh './build.sh --capability capability.json'
            }
        }
    }

    post {
        always {
            sh 'vault agent stop || true'
        }
    }
}
```

## Application Integration

### Go Application

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "time"

    "github.com/skygenesisenterprise/aether-vault/package/cli/internal/ipc"
    "github.com/skygenesisenterprise/aether-vault/package/cli/pkg/types"
)

type VaultClient struct {
    client *ipc.Client
    cache  map[string]*types.Capability
}

func NewVaultClient() (*VaultClient, error) {
    client, err := ipc.NewClient(nil)
    if err != nil {
        return nil, err
    }

    if err := client.Connect(); err != nil {
        return nil, err
    }

    return &VaultClient{
        client: client,
        cache:  make(map[string]*types.Capability),
    }, nil
}

func (v *VaultClient) GetCapability(resource, action string, ttl int64) (*types.Capability, error) {
    cacheKey := fmt.Sprintf("%s:%s", resource, action)

    // Check cache first
    if cap, exists := v.cache[cacheKey]; exists {
        if time.Now().Before(cap.ExpiresAt) {
            return cap, nil
        }
        delete(v.cache, cacheKey)
    }

    // Request new capability
    request := &types.CapabilityRequest{
        Resource: resource,
        Actions:  []string{action},
        TTL:      ttl,
        Identity: os.Getenv("APP_ID"),
    }

    response, err := v.client.RequestCapability(request)
    if err != nil {
        return nil, err
    }

    if response.Status != "granted" {
        return nil, fmt.Errorf("capability denied: %s", response.Message)
    }

    // Cache capability
    v.cache[cacheKey] = response.Capability
    return response.Capability, nil
}

func (v *VaultClient) ValidateCapability(capabilityID string) (bool, error) {
    result, err := v.client.ValidateCapability(capabilityID, nil)
    if err != nil {
        return false, err
    }
    return result.Valid, nil
}

func main() {
    // Initialize Vault client
    vault, err := NewVaultClient()
    if err != nil {
        log.Fatal(err)
    }
    defer vault.client.Close()

    // Example: Get database capability
    dbCap, err := vault.GetCapability("secret:/db/primary", "read", 300)
    if err != nil {
        log.Fatal(err)
    }

    // Validate before use
    valid, err := vault.ValidateCapability(dbCap.ID)
    if err != nil || !valid {
        log.Fatal("Capability validation failed")
    }

    // Use capability
    fmt.Printf("Using capability %s for database access\n", dbCap.ID)

    // Example application logic here
    if err := connectToDatabase(dbCap.ID); err != nil {
        log.Fatal(err)
    }
}

func connectToDatabase(capabilityID string) error {
    // Application-specific database connection logic
    // Use capabilityID for authentication/authorization
    fmt.Printf("Connecting to database with capability %s\n", capabilityID)
    return nil
}
```

### Python Application

```python
import os
import json
import subprocess
import time
from typing import Dict, Optional

class VaultClient:
    def __init__(self, socket_path: Optional[str] = None):
        self.socket_path = socket_path or os.getenv("VAULT_AGENT_SOCKET_PATH")
        self.cache = {}

    def _run_command(self, cmd: list) -> Dict:
        """Run vault CLI command and return JSON result"""
        try:
            if self.socket_path:
                cmd.extend(["--socket-path", self.socket_path])

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Vault command failed: {e.stderr}")

    def get_capability(self, resource: str, action: str, ttl: int = 300) -> Dict:
        """Request a capability"""
        cache_key = f"{resource}:{action}"

        # Check cache first
        if cache_key in self.cache:
            cap = self.cache[cache_key]
            expires_at = time.strptime(cap["expires_at"], "%Y-%m-%dT%H:%M:%SZ")
            if time.time() < time.mktime(expires_at):
                return cap

        # Request new capability
        cmd = [
            "vault", "capability", "request",
            "--resource", resource,
            "--action", action,
            "--ttl", str(ttl),
            "--format", "json"
        ]

        if os.getenv("APP_ID"):
            cmd.extend(["--identity", os.getenv("APP_ID")])

        response = self._run_command(cmd)

        if response["status"] != "granted":
            raise Exception(f"Capability denied: {response.get('message', 'Unknown error')}")

        # Cache capability
        self.cache[cache_key] = response["capability"]
        return response["capability"]

    def validate_capability(self, capability_id: str) -> bool:
        """Validate a capability"""
        cmd = [
            "vault", "capability", "validate", capability_id,
            "--format", "json"
        ]

        try:
            result = self._run_command(cmd)
            return result.get("valid", False)
        except Exception:
            return False

    def revoke_capability(self, capability_id: str, reason: str = "No longer needed") -> bool:
        """Revoke a capability"""
        cmd = [
            "vault", "capability", "revoke", capability_id,
            "--reason", reason
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError:
            return False

# Example usage
def main():
    vault = VaultClient()

    try:
        # Get database capability
        db_cap = vault.get_capability("secret:/db/primary", "read", 300)

        # Validate before use
        if vault.validate_capability(db_cap["id"]):
            print(f"Using capability {db_cap['id']} for database access")
            connect_to_database(db_cap["id"])
        else:
            print("Capability validation failed")

    except Exception as e:
        print(f"Error: {e}")

def connect_to_database(capability_id: str):
    """Example database connection using capability"""
    print(f"Connecting to database with capability {capability_id}")
    # Your database connection logic here

if __name__ == "__main__":
    main()
```

### Node.js Application

```javascript
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class VaultClient {
  constructor(socketPath) {
    this.socketPath = socketPath || process.env.VAULT_AGENT_SOCKET_PATH;
    this.cache = new Map();
  }

  async runCommand(args) {
    return new Promise((resolve, reject) => {
      const cmd = spawn("vault", args);
      let stdout = "";
      let stderr = "";

      cmd.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      cmd.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      cmd.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Vault command failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          resolve(stdout.trim());
        }
      });
    });
  }

  async getCapability(resource, action, ttl = 300) {
    const cacheKey = `${resource}:${action}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cap = this.cache.get(cacheKey);
      const expiresAt = new Date(cap.expires_at);
      if (expiresAt > new Date()) {
        return cap;
      }
      this.cache.delete(cacheKey);
    }

    // Request new capability
    const args = [
      "capability",
      "request",
      "--resource",
      resource,
      "--action",
      action,
      "--ttl",
      ttl.toString(),
      "--format",
      "json",
    ];

    if (process.env.APP_ID) {
      args.push("--identity", process.env.APP_ID);
    }

    const response = await this.runCommand(args);

    if (response.status !== "granted") {
      throw new Error(
        `Capability denied: ${response.message || "Unknown error"}`,
      );
    }

    // Cache capability
    this.cache.set(cacheKey, response.capability);
    return response.capability;
  }

  async validateCapability(capabilityId) {
    const args = ["capability", "validate", capabilityId, "--format", "json"];

    try {
      const result = await this.runCommand(args);
      return result.valid || false;
    } catch (error) {
      return false;
    }
  }

  async revokeCapability(capabilityId, reason = "No longer needed") {
    const args = ["capability", "revoke", capabilityId, "--reason", reason];

    try {
      await this.runCommand(args);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Example usage
async function main() {
  const vault = new VaultClient();

  try {
    // Get database capability
    const dbCap = await vault.getCapability("secret:/db/primary", "read", 300);

    // Validate before use
    const isValid = await vault.validateCapability(dbCap.id);
    if (isValid) {
      console.log(`Using capability ${dbCap.id} for database access`);
      await connectToDatabase(dbCap.id);
    } else {
      console.log("Capability validation failed");
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function connectToDatabase(capabilityId) {
  console.log(`Connecting to database with capability ${capabilityId}`);
  // Your database connection logic here
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VaultClient };
```

## Best Practices

### 1. Error Handling

```go
// Robust error handling with retries
func (v *VaultClient) GetCapabilityWithRetry(resource, action string, ttl int64, maxRetries int) (*types.Capability, error) {
    var lastErr error

    for i := 0; i < maxRetries; i++ {
        cap, err := v.GetCapability(resource, action, ttl)
        if err == nil {
            return cap, nil
        }

        lastErr = err

        // Check if error is retryable
        if !isRetryableError(err) {
            break
        }

        // Exponential backoff
        backoff := time.Duration(1<<uint(i)) * time.Second
        time.Sleep(backoff)
    }

    return nil, lastErr
}

func isRetryableError(err error) bool {
    // Define retryable error conditions
    return strings.Contains(err.Error(), "connection refused") ||
           strings.Contains(err.Error(), "timeout")
}
```

### 2. Capability Lifecycle Management

```go
type CapabilityManager struct {
    client *VaultClient
    caps   map[string]*types.Capability
    mutex  sync.RWMutex
}

func (cm *CapabilityManager) RequestCapability(resource, action string, ttl int64) (*types.Capability, error) {
    cm.mutex.Lock()
    defer cm.mutex.Unlock()

    key := fmt.Sprintf("%s:%s", resource, action)

    // Check existing capability
    if cap, exists := cm.caps[key]; exists {
        if time.Now().Before(cap.ExpiresAt) {
            return cap, nil
        }
        // Capability expired, remove it
        delete(cm.caps, key)
    }

    // Request new capability
    cap, err := cm.client.GetCapability(resource, action, ttl)
    if err != nil {
        return nil, err
    }

    // Store capability
    cm.caps[key] = cap

    // Schedule cleanup
    go cm.scheduleCleanup(key, cap.ExpiresAt)

    return cap, nil
}

func (cm *CapabilityManager) scheduleCleanup(key string, expiresAt time.Time) {
    delay := time.Until(expiresAt) + time.Minute // Wait 1 minute after expiration

    select {
    case <-time.After(delay):
        cm.mutex.Lock()
        delete(cm.caps, key)
        cm.mutex.Unlock()
    }
}
```

### 3. Monitoring and Observability

```go
type Metrics struct {
    CapabilityRequests   int64
    CapabilityGrants     int64
    CapabilityDenials    int64
    ValidationRequests   int64
    ValidationSuccess    int64
    ValidationFailures   int64
    CacheHits           int64
    CacheMisses         int64
}

func (v *VaultClient) GetCapabilityWithMetrics(resource, action string, ttl int64) (*types.Capability, error) {
    atomic.AddInt64(&v.metrics.CapabilityRequests, 1)

    cap, err := v.GetCapability(resource, action, ttl)

    if err != nil {
        atomic.AddInt64(&v.metrics.CapabilityDenials, 1)
        return nil, err
    }

    atomic.AddInt64(&v.metrics.CapabilityGrants, 1)
    return cap, nil
}
```

### 4. Security Best Practices

```go
// Validate capability before each use
func (v *VaultClient) SecureUseCapability(capabilityID string, usage func() error) error {
    // Validate capability
    valid, err := v.ValidateCapability(capabilityID)
    if err != nil {
        return fmt.Errorf("validation failed: %w", err)
    }

    if !valid {
        return fmt.Errorf("capability is not valid")
    }

    // Use capability
    if err := usage(); err != nil {
        return err
    }

    // Optionally revoke after use
    if v.shouldRevokeAfterUse(capabilityID) {
        v.client.RevokeCapability(capabilityID, "Used successfully")
    }

    return nil
}
```

## Testing Integration

### Unit Testing with Mock Client

```go
// Mock Vault client for testing
type MockVaultClient struct {
    capabilities map[string]*types.Capability
    responses     map[string]*types.CapabilityResponse
}

func (m *MockVaultClient) GetCapability(resource, action string, ttl int64) (*types.Capability, error) {
    key := fmt.Sprintf("%s:%s", resource, action)
    if cap, exists := m.capabilities[key]; exists {
        return cap, nil
    }

    // Return mock response
    if resp, exists := m.responses[key]; exists {
        if resp.Status == "granted" {
            return resp.Capability, nil
        }
        return nil, fmt.Errorf(resp.Message)
    }

    return nil, fmt.Errorf("mock capability not found")
}

// Example test
func TestDatabaseAccess(t *testing.T) {
    mock := &MockVaultClient{
        capabilities: make(map[string]*types.Capability),
        responses: map[string]*types.CapabilityResponse{
            "secret:/db/primary:read": {
                Status: "granted",
                Capability: &types.Capability{
                    ID: "mock-cap-123",
                    Resource: "secret:/db/primary",
                    Actions: []string{"read"},
                    ExpiresAt: time.Now().Add(5 * time.Minute),
                },
            },
        },
    }

    app := &Application{vault: mock}

    err := app.AccessDatabase()
    assert.NoError(t, err)
}
```

### Integration Testing

```bash
#!/bin/bash
# integration-test.sh

# Start test agent
vault agent start --mode development --socket-path /tmp/test-vault.sock &
AGENT_PID=$!

# Wait for agent to start
sleep 2

# Run integration tests
go test ./integration/... -vault-socket /tmp/test-vault.sock
TEST_EXIT_CODE=$?

# Cleanup
kill $AGENT_PID
rm -f /tmp/test-vault.sock

exit $TEST_EXIT_CODE
```

## Troubleshooting

### Common Integration Issues

#### Connection Problems

```bash
# Check if agent is running
vault agent status

# Check socket file
ls -la /var/run/vault/agent.sock

# Test connection
vault capability status
```

#### Capability Issues

```bash
# Test capability request
vault capability request --resource "secret:/test" --action read --verbose

# Check policies
ls ~/.aether-vault/policies/

# Review audit logs
tail -f ~/.aether-vault/audit.log
```

#### Performance Issues

```bash
# Check agent performance
vault agent status --verbose

# Monitor capability usage
vault capability list --status active | wc -l

# Check cache hit rates
vault agent status --verbose | grep -i cache
```

---

_See specific integration guides for more detailed information: [INTEGRATION_DOCKER.md](INTEGRATION_DOCKER.md), [INTEGRATION_KUBERNETES.md](INTEGRATION_KUBERNETES.md), [INTEGRATION_CICD.md](INTEGRATION_CICD.md), and [INTEGRATION_APPLICATIONS.md](INTEGRATION_APPLICATIONS.md)._
