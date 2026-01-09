# 🎨 Examples Guide

<div align="center">

**Real-world Implementation Examples for the Aether Vault Node.js SDK**

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![Examples](https://img.shields.io/badge/Examples-8+-purple?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/tree/main/package/node/examples)

**🚀 Learn how to integrate Aether Vault into your applications with practical examples**

</div>

---

## 📚 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🔐 Authentication Examples](#-authentication-examples)
- [🔒 Secrets Management](#-secrets-management)
- [⚡ TOTP Management](#-totp-management)
- [📊 Audit & Logging](#-audit--logging)
- [🏥 System Operations](#-system-operations)
- [🎯 Complete Workflows](#-complete-workflows)
- [🔄 Environment Configuration](#-environment-configuration)
- [🛠️ Advanced Patterns](#️-advanced-patterns)

---

## 🚀 Quick Start

### Installation

```bash
# npm
npm install aether-vault

# yarn
yarn add aether-vault

# pnpm (recommended)
pnpm add aether-vault
```

### Basic Setup

```typescript
import { createVaultClient } from "aether-vault";

const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});
```

---

## 🔐 Authentication Examples

### Session-based Authentication

```typescript
import { createVaultClient } from "aether-vault";

const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});

// Login with credentials
const session = await vault.auth.login({
  username: "user@example.com",
  password: "securePassword123",
});

console.log("User:", session.user.email);
console.log("Session expires:", session.expiresAt);

// Check current session
const currentSession = await vault.auth.session();
console.log("Valid session:", currentSession.valid);

// Logout
await vault.auth.logout();
```

### JWT-based Authentication

```typescript
const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: {
    type: "jwt",
    token: "your-jwt-token",
    autoRefresh: true,
  },
});

// Validate JWT token
const isValid = await vault.auth.validate();
console.log("Token valid:", isValid);
```

### Bearer Token Authentication

```typescript
const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: {
    type: "bearer",
    token: "your-bearer-token",
  },
});
```

---

## 🔒 Secrets Management

### Creating and Managing Secrets

```typescript
// Create a new secret
const secret = await vault.secrets.create({
  name: "Database Connection",
  description: "Production database connection string",
  value: "postgresql://user:pass@localhost:5432/mydb",
  type: "database",
  tags: "production,database",
  expiresAt: new Date("2025-12-31"),
});

console.log("Secret created:", secret.id);

// List all secrets with pagination
const secretsList = await vault.secrets.list({
  page: 1,
  pageSize: 20,
  type: "database",
});

console.log(`Found ${secretsList.total} secrets`);

// Get specific secret (with decrypted value)
const retrievedSecret = await vault.secrets.get(secret.id);
console.log("Secret name:", retrievedSecret.name);

// Get only the secret value
const secretValue = await vault.secrets.getValue(secret.id);
console.log("Secret value:", secretValue);

// Update secret metadata
const updatedSecret = await vault.secrets.update(secret.id, {
  description: "Updated database connection string",
  tags: "production,database,updated",
});

// Delete secret
await vault.secrets.delete(secret.id);
```

### Advanced Secret Operations

```typescript
// Search secrets by name or tags
const searchResults = await vault.secrets.search({
  query: "database",
  tags: ["production"],
  sortBy: "createdAt",
  sortOrder: "desc",
});

// Bulk operations
const bulkCreate = await vault.secrets.createBulk([
  {
    name: "API Key 1",
    value: "sk-live-1234567890",
    type: "api_key",
  },
  {
    name: "API Key 2",
    value: "sk-live-0987654321",
    type: "api_key",
  },
]);

// Secret rotation
const rotated = await vault.secrets.rotate(secret.id);
console.log("New version:", rotated.version);
```

---

## ⚡ TOTP Management

### Creating and Using TOTP

```typescript
// Create TOTP entry
const totp = await vault.totp.create({
  name: "GitHub 2FA",
  description: "Two-factor authentication for GitHub",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
});

console.log("TOTP created:", totp.id);

// Generate QR code for setup
const qrCode = await vault.totp.generateQR(totp.id);
console.log("QR Code data:", qrCode.data);

// Generate current TOTP code
const code = await vault.totp.generate(totp.id);
console.log("Current code:", code.code);
console.log("Expires in:", code.remainingSeconds, "seconds");

// Verify TOTP code
const isValid = await vault.totp.verify(totp.id, "123456");
console.log("Code valid:", isValid);

// Get backup codes
const backupCodes = await vault.totp.getBackupCodes(totp.id);
console.log("Backup codes:", backupCodes.codes);
```

### Managing Multiple TOTP Entries

```typescript
// List all TOTP entries
const totpList = await vault.totp.list();
console.log(`Found ${totpList.total} TOTP entries`);

// Filter by type
const totpByType = await vault.totp.list({
  type: "authenticator",
});

// Update TOTP settings
const updated = await vault.totp.update(totp.id, {
  name: "Updated GitHub 2FA",
  description: "Updated description",
});

// Delete TOTP entry
await vault.totp.delete(totp.id);
```

---

## 📊 Audit & Logging

### Accessing Audit Logs

```typescript
// Get audit logs with pagination
const auditLogs = await vault.audit.list({
  page: 1,
  pageSize: 50,
  sortBy: "createdAt",
  sortOrder: "desc",
});

console.log(`Found ${auditLogs.total} audit entries`);

// Filter by date range
const recentLogs = await vault.audit.list({
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
  dateTo: new Date(),
});

// Filter by action type
const loginAttempts = await vault.audit.list({
  action: "login",
});

// Get failed authentication attempts
const failedLogins = await vault.audit.getFailedAuth({
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
  pageSize: 100,
});

console.log(`Found ${failedLogins.total} failed login attempts`);
```

### Export and Analytics

```typescript
// Export audit logs to CSV
const csvData = await vault.audit.exportToCSV({
  dateFrom: new Date("2025-01-01"),
  dateTo: new Date("2025-01-31"),
  action: "login",
  format: "csv",
});

// Save to file
require("fs").writeFileSync("audit-logs.csv", csvData);

// Get secret access logs
const secretAccess = await vault.audit.getSecretAccess({
  dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
  sortBy: "createdAt",
  sortOrder: "desc",
});

// Get user activity summary
const userActivity = await vault.audit.getUserActivity({
  userId: "user-123",
  dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
});
```

---

## 🏥 System Operations

### Health and Status Monitoring

```typescript
// Check system health
const health = await vault.system.health();
console.log("System status:", health.status);
console.log("Database status:", health.database);
console.log("Version:", health.version);

// Get detailed version information
const version = await vault.system.version();
console.log("Build version:", version.version);
console.log("Build time:", version.buildTime);
console.log("Git commit:", version.gitCommit);
console.log("Go version:", version.goVersion);

// Check if system is ready
const isReady = await vault.system.ready();
console.log("System ready:", isReady);

// Get comprehensive system status
const status = await vault.system.status();
console.log("Healthy:", status.healthy);package/docker
console.log("Ready:", status.ready);
console.log("Components:", status.components);
```

### Metrics and Performance

```typescript
// Get system metrics
const metrics = await vault.system.metrics();
console.log("Memory usage:", metrics.memory);
console.log("CPU usage:", metrics.cpu);
console.log("Request count:", metrics.requests);

// Get component status
const components = await vault.system.components();
components.forEach((component) => {
  console.log(`${component.name}: ${component.status}`);
});
```

---

## 🎯 Complete Workflows

### Complete User Workflow

```typescript
async function completeUserWorkflow() {
  const vault = createVaultClient({
    baseURL: "http://localhost:8080",
    auth: { type: "session" },
    timeout: 10000,
  });

  try {
    console.log("🚀 Starting workflow...");

    // 1. Check system health
    const health = await vault.system.health();
    if (health.status !== "healthy") {
      throw new Error("System not healthy");
    }

    // 2. Authenticate
    const session = await vault.auth.login({
      username: "user@example.com",
      password: "securePassword123",
    });
    console.log("✅ Authenticated as:", session.user.email);

    // 3. Get user profile
    const user = await vault.identity.me();
    console.log("✅ User profile:", user.displayName);

    // 4. Create a secret
    const secret = await vault.secrets.create({
      name: "API Key",
      description: "External API key",
      value: "sk-live-1234567890",
      type: "api_key",
    });
    console.log("✅ Secret created:", secret.name);

    // 5. Setup TOTP
    const totp = await vault.totp.create({
      name: "Bank App",
      description: "Banking app 2FA",
    });
    console.log("✅ TOTP created:", totp.name);

    // 6. Check audit logs
    const logs = await vault.audit.list({ pageSize: 10 });
    console.log("✅ Recent activities:", logs.total);

    // 7. Cleanup
    await vault.secrets.delete(secret.id);
    await vault.totp.delete(totp.id);
    await vault.auth.logout();

    console.log("🎉 Workflow completed!");
  } catch (error) {
    console.error("❌ Workflow failed:", error);
  }
}
```

### Admin Workflow

```typescript
async function adminWorkflow() {
  const vault = createVaultClient({
    baseURL: "http://localhost:8080",
    auth: { type: "session" },
  });

  // Login as admin
  await vault.auth.login({
    username: "admin@example.com",
    password: "adminPassword123",
  });

  try {
    // 1. Create policies
    const policy = await vault.policies.create({
      name: "Allow Secret Read",
      description: "Users can read their own secrets",
      resource: "secret",
      actions: ["read"],
      effect: "allow",
      priority: 100,
    });

    // 2. Evaluate policies
    const evaluation = await vault.policies.evaluate("secret", "read", {
      userId: "user-123",
      resourceId: "secret-456",
    });

    console.log("Policy evaluation:", evaluation.allowed);

    // 3. Get system metrics
    const metrics = await vault.system.metrics();
    console.log("System load:", metrics.cpu);

    // 4. Export audit logs
    const csvData = await vault.audit.exportToCSV({
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
      format: "csv",
    });

    console.log("Audit logs exported:", csvData.length, "bytes");
  } catch (error) {
    console.error("Admin workflow failed:", error);
  } finally {
    await vault.auth.logout();
  }
}
```

---

## 🔄 Environment Configuration

### Multi-Environment Setup

```typescript
// Development
const devVault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
  debug: true,
});

// Staging
const stagingVault = createVaultClient({
  baseURL: "https://staging-api.aethervault.com",
  auth: {
    type: "jwt",
    token: process.env.STAGING_JWT_TOKEN,
  },
  timeout: 15000,
});

// Production
const prodVault = createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "jwt",
    token: process.env.PROD_JWT_TOKEN,
    autoRefresh: true,
  },
  timeout: 30000,
  retryAttempts: 3,
});

// Environment selection
function getVaultClient(env: string) {
  switch (env) {
    case "development":
      return devVault;
    case "staging":
      return stagingVault;
    case "production":
      return prodVault;
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
}

// Usage
const vault = getVaultClient(process.env.NODE_ENV);
```

### Configuration File

```typescript
// vault.config.ts
import { VaultConfig } from "aether-vault";

export const vaultConfig: VaultConfig = {
  baseURL: process.env.VAULT_BASE_URL || "http://localhost:8080",
  auth: {
    type: "jwt",
    token: process.env.VAULT_JWT_TOKEN,
    autoRefresh: true,
  },
  timeout: 10000,
  retryAttempts: 3,
  debug: process.env.NODE_ENV === "development",
};

export default vaultConfig;
```

---

## 🛠️ Advanced Patterns

### Error Handling

```typescript
import { VaultError, AuthenticationError } from "aether-vault";

async function robustSecretOperations() {
  const vault = createVaultClient({
    baseURL: "http://localhost:8080",
    auth: { type: "session" },
  });

  try {
    // Try to access secret
    const secret = await vault.secrets.get("secret-id");
    return secret;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log("Authentication expired, re-login...");
      await vault.auth.login({
        username: "user@example.com",
        password: "password",
      });
      // Retry operation
      return await vault.secrets.get("secret-id");
    } else if (error instanceof VaultError) {
      console.error("Vault error:", error.message);
      throw error;
    } else {
      console.error("Unexpected error:", error);
      throw error;
    }
  }
}
```

### Custom HTTP Client

```typescript
import { createVaultClient } from "aether-vault";

const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
  // Custom fetch with logging
  fetch: async (input, init) => {
    console.log("Request:", input, init);
    const response = await fetch(input, init);
    console.log("Response:", response.status, response.statusText);
    return response;
  },
});
```

### Middleware Pattern

```typescript
class VaultMiddleware {
  constructor(private vault: ReturnType<typeof createVaultClient>) {}

  async withAuth<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        await this.reauthenticate();
        return await operation();
      }
      throw error;
    }
  }

  private async reauthenticate() {
    // Implement reauthentication logic
    console.log("Reauthenticating...");
  }
}

// Usage
const middleware = new VaultMiddleware(vault);
const secret = await middleware.withAuth(() => vault.secrets.get("secret-id"));
```

---

## 📚 Running the Examples

### Prerequisites

```bash
# Install the SDK
pnpm add aether-vault

# Ensure Aether Vault server is running
# Default: http://localhost:8080
```

### Running Examples

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/node

# Install dependencies
pnpm install

# Run the basic usage example
pnpm tsx examples/basic-usage.ts

# Or run individual examples
node -e "import('./examples/basic-usage.js').then(m => m.authenticationExample())"
```

### Test with Mock Data

```typescript
// For testing without a real server
const testVault = createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
  mock: true, // Enable mock mode
});

// All operations will return mock data
const mockSecrets = await testVault.secrets.list();
console.log("Mock secrets:", mockSecrets.secrets);
```

---

## 🔗 Related Resources

- **[📖 API Documentation](./api.md)** - Complete API reference
- **[🏗️ Architecture Guide](./architecture.md)** - SDK architecture overview
- **[⚙️ Configuration Guide](./configuration.md)** - Setup and configuration
- **[🐛 GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Report issues
- **[💡 GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - Community help

---

<div align="center">

### 🚀 **Ready to Build with Aether Vault?**

[📦 Install SDK](#installation) • [🎯 Quick Start](#quick-start) • [🛠️ Examples](#examples-guide)

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
