# Aether Vault GitHub Action - Usage Examples

## Basic Usage

```yaml
- name: Aether Vault Security Check
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    auth-method: github-oidc
    role: my-app-role
    policy-mode: enforce
```

## Advanced Usage Patterns

### 1. Multi-Stage Pipeline

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: aether-office/aether-vault@v1
        with:
          vault-url: ${{ secrets.VAULT_URL }}
          role: security-scan
          policy-mode: enforce
        id: vault-security

  build:
    needs: security
    runs-on: ubuntu-latest
    steps:
      - uses: aether-office/aether-vault@v1
        with:
          vault-url: ${{ secrets.VAULT_URL }}
          role: build-secrets
          allow-token-output: true
        id: vault-build

      - name: Build with secrets
        run: |
          echo "Building with token: ${{ steps.vault-build.outputs.vault-token }}"
          # Build commands
```

### 2. Environment-Specific Roles

```yaml
- name: Get Environment Secrets
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    policy-mode: enforce
    allow-token-output: true
  id: vault
```

### 3. Audit Mode for Testing

```yaml
- name: Security Audit (Non-blocking)
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: audit-role
    policy-mode: audit # Won't fail the job on violations
  id: vault-audit

- name: Process Audit Results
  if: always()
  run: |
    echo "Security status: ${{ steps.vault-audit.outputs.status }}"
    echo "Audit report: ${{ steps.vault-audit.outputs.report-id }}"
```

### 4. Conditional Token Output

```yaml
- name: Vault Authentication
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: deploy-role
    allow-token-output: ${{ github.ref == 'refs/heads/main' }}
  id: vault

- name: Deploy (Production Only)
  if: github.ref == 'refs/heads/main'
  run: |
    echo "Deploying with token: ${{ steps.vault.outputs.vault-token }}"
    # Deployment commands
```

## Integration Examples

### Docker Build Pipeline

```yaml
- name: Docker Build with Vault Secrets
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: docker-build
    allow-token-output: true
  id: vault

- name: Build and Push Docker Image
  run: |
    docker build \
      --build-arg VAULT_TOKEN=${{ steps.vault.outputs.vault-token }} \
      --tag my-app:${{ github.sha }} \
      .
    docker push my-app:${{ github.sha }}
```

### Kubernetes Deployment

```yaml
- name: Get K8s Secrets
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: kubernetes-deploy
    allow-token-output: true
  id: vault

- name: Deploy to Kubernetes
  run: |
    kubectl apply -f k8s/
    kubectl set image deployment/my-app my-app=my-app:${{ github.sha }}
    echo "Deployment completed with report: ${{ steps.vault.outputs.report-id }}"
```

## Best Practices

### 1. Role Naming Convention

```yaml
# Use descriptive role names
roles:
  - "app-build" # For build processes
  - "app-deploy" # For deployments
  - "app-security-scan" # For security checks
  - "app-audit" # For audit operations
```

### 2. Environment Separation

```yaml
- name: Get Environment Config
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: ${{ github.environment }}-app
    policy-mode: enforce
```

### 3. Error Handling

```yaml
- name: Vault Security Check
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: security-check
    policy-mode: enforce
  id: vault
  continue-on-error: true # For non-critical checks

- name: Handle Security Results
  if: always() && steps.vault.outcome == 'failure'
  run: |
    echo "Security check failed: ${{ steps.vault.outputs.status }}"
    # Notify team, create issue, etc.
```

## Outputs Reference

| Output        | Description                             | Security Level |
| ------------- | --------------------------------------- | -------------- |
| `status`      | Policy check result (success/violation) | Public         |
| `report-id`   | Audit correlation ID                    | Public         |
| `vault-token` | Vault authentication token              | Sensitive      |

## Migration Guide

### From Traditional Secret Management

```yaml
# Before
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  run: ./deploy.sh

# After
- name: Get Deployment Secrets
  uses: aether-office/aether-vault@v1
  with:
    vault-url: ${{ secrets.VAULT_URL }}
    role: deploy
    allow-token-output: true
  id: vault

- name: Deploy
  run: |
    export API_KEY=$(vault kv get -field=api_key secret/app)
    export DB_PASSWORD=$(vault kv get -field=db_password secret/app)
    ./deploy.sh
  env:
    VAULT_TOKEN: ${{ steps.vault.outputs.vault-token }}
```

This modular approach allows teams to integrate Aether Vault seamlessly into existing GitHub Actions workflows while maintaining security best practices.
