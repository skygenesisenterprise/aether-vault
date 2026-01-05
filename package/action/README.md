# Aether Vault GitHub Action

**Technical documentation for package/action maintainers**

## Overview

This is the internal implementation of the Aether Vault GitHub Action. All business logic lives here in Go, while the root `action.yml` serves only as a facade for end users.

## Architecture

```
package/action/
├── action.yml              # Internal composite action (technical facade)
├── cmd/
│   └── main.go             # Entry point - CLI interface
├── internal/
│   ├── config/             # Configuration management
│   ├── auth/               # OIDC authentication with GitHub
│   ├── vault/              # Vault API client
│   ├── github/             # GitHub context utilities
│   └── output/             # GitHub outputs management
├── bin/                    # Pre-compiled binaries (generated)
├── go.mod                  # Go modules
└── README.md               # This file
```

## Security Model

- **No long-term secrets**: Uses GitHub OIDC JWT tokens exclusively
- **Ephemeral tokens**: Vault tokens are short-lived and role-scoped
- **Zero-knowledge**: No secrets stored in repository
- **Principle of least privilege**: Minimal permissions by design

## Core Components

### Configuration (`internal/config`)

Loads and validates environment variables from GitHub Actions:

- `VAULT_URL`: Aether Vault server endpoint
- `AUTH_METHOD`: Authentication method (github-oidc)
- `ROLE`: Vault role for authentication
- `POLICY_MODE`: enforce|audit
- `AUDIENCE`: OIDC audience (default: aether-vault)
- `ALLOW_TOKEN_OUTPUT`: Security-sensitive token output flag

### Authentication (`internal/auth`)

Handles OIDC token exchange with GitHub Actions:

1. Retrieves JWT token from GitHub Actions OIDC provider
2. Validates token claims and signatures
3. Exchanges JWT for Vault token via `/v1/auth/github/login`
4. Returns ephemeral Vault token for API calls

### Vault Client (`internal/vault`)

Manages interactions with Aether Vault API:

- Authentication via OIDC token exchange
- Policy checks via `/v1/policies/check`
- Secret management (future enhancements)
- Security violation detection

### GitHub Context (`internal/github`)

Extracts GitHub Actions runtime context:

- Repository information
- Workflow details
- Actor and event metadata
- JWT token retrieval utilities

### Output Management (`internal/output`)

Handles GitHub Actions outputs:

- Policy check status
- Report IDs for audit correlation
- Conditional vault token output (security-controlled)

## Build Process

Binaries are compiled for multiple architectures:

```bash
# Build all architectures
make build

# Build specific architecture
GOOS=linux GOARCH=amd64 go build -o bin/aether-vault-linux-amd64 ./cmd
```

Supported platforms:

- Linux AMD64
- Linux ARM64
- (Future: macOS, Windows)

## Usage in GitHub Actions

The action is consumed via the root facade:

```yaml
uses: aether-office/aether-vault@v1
with:
  vault-url: ${{ secrets.VAULT_URL }}
  auth-method: github-oidc
  role: my-app-role
  policy-mode: enforce
```

## Error Handling

All errors are structured and logged with appropriate context:

- Authentication failures: Clear OIDC/Vault error messages
- Policy violations: Detailed violation reports with rule context
- Network issues: Retry-aware error messages
- Configuration errors: Validation with helpful guidance

## Logging

Structured JSON logging via logrus:

- Levels: INFO, WARN, ERROR, FATAL
- Context: Repository, workflow, step, user
- Security: No sensitive data in logs
- Audit: Correlation IDs for traceability

## Development

### Prerequisites

- Go 1.21+
- Access to Aether Vault dev instance
- GitHub OIDC-enabled repository

### Local Development

```bash
# Setup
cd package/action
go mod tidy

# Run tests
go test ./...

# Build binary
go build -o bin/aether-vault-linux-amd64 ./cmd

# Test locally
export VAULT_URL="https://vault.dev.local"
export AUTH_METHOD="github-oidc"
./bin/aether-vault-linux-amd64
```

### Testing

```bash
# Unit tests
go test ./internal/...

# Integration tests (requires Vault)
VAULT_URL="https://vault.test.local" go test ./...

# End-to-end tests
make test-e2e
```

## Security Considerations

### Token Security

- Vault tokens are never logged
- Token output requires explicit permission
- Tokens are short-lived (configurable TTL)
- Role-based access control enforced

### OIDC Security

- JWT signature validation mandatory
- Claims verification (aud, exp, iat)
- Repository-scoped authentication
- No token persistence

### Network Security

- HTTPS-only communication
- Certificate validation
- Request timeouts (30s default)
- Retry logic for transient failures

## Troubleshooting

### Common Issues

1. **OIDC Token Not Available**
   - Ensure repository has OIDC enabled
   - Check `ACTIONS_ID_TOKEN_REQUEST_URL` environment

2. **Vault Authentication Failed**
   - Verify Vault URL accessibility
   - Check role configuration in Vault
   - Validate audience setting

3. **Policy Violation**
   - Review violation details in logs
   - Check policy configuration in Vault
   - Verify repository permissions

### Debug Mode

Enable verbose logging:

```yaml
env:
  LOG_LEVEL: debug
```

## Future Enhancements

- Secret injection capabilities
- Advanced policy engine
- Multi-Vault support
- Caching for performance
- Webhook integrations

## Dependencies

- `github.com/coreos/go-oidc/v3`: OIDC client library
- `github.com/go-resty/resty/v2`: HTTP client
- `github.com/sirupsen/logrus`: Structured logging
- `gopkg.in/yaml.v3`: YAML parsing

## License

Part of Aether Vault project. See main repository LICENSE file.
