<div align="center">

# 📚 Aether Vault Node.js SDK API Reference

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![SDK Version](https://img.shields.io/badge/SDK-v1.0.12-purple?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault)

**🔐 Complete API Reference for the Aether Vault Node.js SDK**

Comprehensive API documentation for all methods, types, and interfaces available in the Aether Vault Node.js SDK.

[🔗 Client Creation](#-client-creation) • [🔐 Authentication](#-authentication) • [🔒 Secrets Management](#-secrets-management) • [⚡ TOTP Operations](#-totp-operations) • [👤 Identity Management](#-identity-management) • [📊 Audit Logging](#-audit-logging) • [🏛️ Policy Management](#️-policy-management) • [⚙️ System Operations](#️-system-operations) • [🛠️ Error Handling](#️-error-handling) • [📝 Type Definitions](#-type-definitions)

</div>

---

## 🌟 Overview

The Aether Vault Node.js SDK provides a comprehensive, type-safe interface for interacting with the Aether Vault API. All methods return promises and use TypeScript for complete type safety.

### 🎯 **Quick Reference**

```typescript
import { createVaultClient } from "aether-vault";

const vault = await createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});

// Use any of the documented methods below
await vault.auth.login({ username, password });
const secrets = await vault.secrets.list();
```

---

## 🔗 Client Creation

### `createVaultClient(options)`

Creates and returns a configured Aether Vault client instance.

#### **Parameters**

```typescript
interface CreateVaultClientOptions {
  /** Configuration file path (default: "vault.config.ts") */
  configPath?: string;
  /** Environment to use (default: from NODE_ENV or VAULT_ENV) */
  environment?: Environment;
  /** Enable environment variable overrides (default: true) */
  enableEnvOverrides?: boolean;
  /** Strict validation mode (default: false) */
  strict?: boolean;
  /** Override configuration (takes precedence over file/env) */
  config?: Partial<VaultConfig>;
}
```

#### **Returns**

```typescript
Promise<AetherVaultClient>;
```

#### **Examples**

```typescript
// Auto-load from vault.config.ts or environment variables
const vault = await createVaultClient();

// With custom options
const vault = await createVaultClient({
  environment: "production",
  configPath: "./config/vault.config.ts",
});

// With explicit config override
const vault = await createVaultClient({
  config: {
    baseURL: "https://api.aethervault.com",
    auth: { type: "jwt", token: "your-jwt-token" },
  },
});
```

---

## 🔐 Authentication

### `vault.auth.login(credentials)`

Authenticates a user with credentials and establishes a session.

#### **Parameters**

```typescript
interface LoginCredentials {
  username: string;
  password: string;
  totpCode?: string; // Required if 2FA is enabled
}
```

#### **Returns**

```typescript
Promise<AuthSession>;
```

#### **Example**

```typescript
const session = await vault.auth.login({
  username: "user@example.com",
  password: "securePassword123",
  totpCode: "123456", // Optional, for 2FA
});

console.log("Logged in as:", session.user.displayName);
console.log("Session expires:", session.expiresAt);
```

### `vault.auth.logout()`

Logs out the current user and invalidates the session.

#### **Returns**

```typescript
Promise<void>;
```

#### **Example**

```typescript
await vault.auth.logout();
console.log("Logged out successfully");
```

### `vault.auth.session()`

Retrieves information about the current authentication session.

#### **Returns**

```typescript
Promise<CurrentSession>;
```

#### **Example**

```typescript
const session = await vault.auth.session();
console.log("Session valid:", session.valid);
console.log("User:", session.user.email);
```

### `vault.auth.validate()`

Validates the current authentication token.

#### **Returns**

```typescript
Promise<boolean>;
```

#### **Example**

```typescript
const isValid = await vault.auth.validate();
if (!isValid) {
  console.log("Token expired, please login again");
}
```

### `vault.auth.getCurrentUser()`

Retrieves the current authenticated user's profile.

#### **Returns**

```typescript
Promise<UserIdentity>;
```

#### **Example**

```typescript
const user = await vault.auth.getCurrentUser();
console.log("Current user:", user.email, user.displayName);
```

---

## 🔒 Secrets Management

### `vault.secrets.list(filter?)`

Lists secrets accessible to the current user with optional filtering.

#### **Parameters**

```typescript
interface SecretFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  tags?: string[];
  type?: string;
  sortBy?: "name" | "created" | "updated";
  sortOrder?: "asc" | "desc";
}
```

#### **Returns**

```typescript
Promise<SecretListResponse>;
```

#### **Example**

```typescript
// List all secrets
const allSecrets = await vault.secrets.list();

// Filter by tags and pagination
const filtered = await vault.secrets.list({
  tags: ["production"],
  page: 1,
  pageSize: 20,
  sortBy: "name",
});

console.log(`Found ${filtered.secrets.length} secrets`);
console.log(`Total: ${filtered.pagination.total}`);
```

### `vault.secrets.get(id)`

Retrieves metadata for a specific secret (without the value).

#### **Parameters**

- `id: string` - The secret identifier

#### **Returns**

```typescript
Promise<Secret>;
```

#### **Example**

```typescript
const secret = await vault.secrets.get("database-connection");
console.log("Secret name:", secret.name);
console.log("Description:", secret.description);
console.log("Tags:", secret.tags);
```

### `vault.secrets.getValue(id)`

Retrieves a specific secret including its decrypted value.

#### **Parameters**

- `id: string` - The secret identifier

#### **Returns**

```typescript
Promise<SecretWithValue>;
```

#### **Example**

```typescript
const secretWithValue = await vault.secrets.getValue("database-connection");
console.log("Database URL:", secretWithValue.value);
```

### `vault.secrets.create(secretData)`

Creates a new secret.

#### **Parameters**

```typescript
interface CreateSecretData {
  name: string;
  value: string;
  description?: string;
  type?: string;
  tags?: string[];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}
```

#### **Returns**

```typescript
Promise<Secret>;
```

#### **Example**

```typescript
const newSecret = await vault.secrets.create({
  name: "api-key-production",
  value: "sk_live_1234567890abcdef",
  description: "Production API key for external service",
  type: "api_key",
  tags: ["production", "critical"],
  metadata: {
    service: "stripe",
    created_by: "automation",
  },
});

console.log("Created secret:", newSecret.id);
```

### `vault.secrets.update(id, updates)`

Updates an existing secret.

#### **Parameters**

- `id: string` - The secret identifier
- `updates: Partial<UpdateSecretData>` - Fields to update

#### **Returns**

```typescript
Promise<Secret>;
```

#### **Example**

```typescript
const updated = await vault.secrets.update("api-key-production", {
  description: "Updated description",
  tags: ["production", "critical", "updated"],
});

console.log("Updated secret:", updated.name);
```

### `vault.secrets.delete(id)`

Deletes a secret permanently.

#### **Parameters**

- `id: string` - The secret identifier

#### **Returns**

```typescript
Promise<void>;
```

#### **Example**

```typescript
await vault.secrets.delete("old-api-key");
console.log("Secret deleted successfully");
```

---

## ⚡ TOTP Operations

### `vault.totp.list(filter?)`

Lists TOTP configurations for the current user.

#### **Parameters**

```typescript
interface TOTPFilter {
  page?: number;
  pageSize?: number;
  search?: string;
}
```

#### **Returns**

```typescript
Promise<TOTPListResponse>;
```

#### **Example**

```typescript
const totpList = await vault.totp.list();
console.log(`Found ${totpList.entries.length} TOTP configurations`);
```

### `vault.totp.generate(config)`

Creates a new TOTP configuration.

#### **Parameters**

```typescript
interface CreateTOTPConfig {
  name: string;
  description?: string;
  account?: string;
  issuer?: string;
  algorithm?: "SHA1" | "SHA256" | "SHA512";
  digits?: 6 | 8;
  period?: number; // Time period in seconds (default: 30)
}
```

#### **Returns**

```typescript
Promise<TOTPEntry>;
```

#### **Example**

```typescript
const totp = await vault.totp.generate({
  name: "GitHub 2FA",
  description: "Two-factor authentication for GitHub",
  account: "user@example.com",
  issuer: "GitHub",
});

console.log("Scan QR code:", totp.qrCode);
console.log("Backup codes:", totp.backupCodes);
```

### `vault.totp.getCode(id)`

Generates a time-based one-time password for a TOTP entry.

#### **Parameters**

- `id: string` - The TOTP entry identifier

#### **Returns**

```typescript
Promise<TOTPCode>;
```

#### **Example**

```typescript
const { code, remainingSeconds } = await vault.totp.getCode("github-2fa");
console.log(`Your code: ${code} (valid for ${remainingSeconds} seconds)`);
```

### `vault.totp.verify(id, code)`

Verifies a TOTP code against the expected value.

#### **Parameters**

- `id: string` - The TOTP entry identifier
- `code: string` - The code to verify

#### **Returns**

```typescript
Promise<TOTPVerification>;
```

#### **Example**

```typescript
const verification = await vault.totp.verify("github-2fa", "123456");
if (verification.valid) {
  console.log("Code verified successfully");
} else {
  console.log("Invalid code");
}
```

### `vault.totp.update(id, updates)`

Updates a TOTP configuration.

#### **Parameters**

- `id: string` - The TOTP entry identifier
- `updates: Partial<UpdateTOTPConfig>` - Fields to update

#### **Returns**

```typescript
Promise<TOTPEntry>;
```

#### **Example**

```typescript
const updated = await vault.totp.update("github-2fa", {
  description: "Updated GitHub 2FA configuration",
});
```

### `vault.totp.delete(id)`

Deletes a TOTP configuration.

#### **Parameters**

- `id: string` - The TOTP entry identifier

#### **Returns**

```typescript
Promise<void>;
```

#### **Example**

```typescript
await vault.totp.delete("old-totp-config");
console.log("TOTP configuration deleted");
```

---

## 👤 Identity Management

### `vault.identity.me()`

Retrieves the current user's complete identity profile.

#### **Returns**

```typescript
Promise<UserIdentity>;
```

#### **Example**

```typescript
const profile = await vault.identity.me();
console.log("User profile:", {
  email: profile.email,
  displayName: profile.displayName,
  role: profile.role,
  permissions: profile.permissions,
});
```

### `vault.identity.policies()`

Retrieves access policies applicable to the current user.

#### **Returns**

```typescript
Promise<Policy[]>;
```

#### **Example**

```typescript
const policies = await vault.identity.policies();
policies.forEach((policy) => {
  console.log(`Policy: ${policy.name}`);
  console.log(`Permissions: ${policy.permissions.join(", ")}`);
});
```

---

## 📊 Audit Logging

### `vault.audit.list(filter?)`

Retrieves audit log entries with filtering options.

#### **Parameters**

```typescript
interface AuditFilter {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
}
```

#### **Returns**

```typescript
Promise<AuditListResponse>;
```

#### **Example**

```typescript
// Get recent audit entries
const recentLogs = await vault.audit.list({
  page: 1,
  pageSize: 50,
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
});

console.log(`Found ${recentLogs.entries.length} audit entries`);

// Filter by specific action
const secretAccess = await vault.audit.list({
  action: "secret_access",
  pageSize: 100,
});
```

### `vault.audit.getEntry(id)`

Retrieves a specific audit log entry.

#### **Parameters**

- `id: string` - The audit entry identifier

#### **Returns**

```typescript
Promise<AuditEntry>;
```

#### **Example**

```typescript
const entry = await vault.audit.getEntry("audit-entry-id");
console.log("Audit entry:", {
  action: entry.action,
  user: entry.userEmail,
  timestamp: entry.timestamp,
  details: entry.details,
});
```

### `vault.audit.getUserEntries(userId, options?)`

Retrieves audit entries for a specific user.

#### **Parameters**

- `userId: string` - The user identifier
- `options?: Omit<AuditFilter, "userId">` - Additional filtering options

#### **Returns**

```typescript
Promise<AuditListResponse>;
```

#### **Example**

```typescript
const userLogs = await vault.audit.getUserEntries("user-123", {
  dateFrom: new Date("2025-01-01"),
  pageSize: 100,
});
```

### `vault.audit.getFailedAuth(options?)`

Retrieves failed authentication attempts.

#### **Parameters**

- `options?: Omit<AuditFilter, "action">` - Filtering options

#### **Returns**

```typescript
Promise<AuditListResponse>;
```

#### **Example**

```typescript
const failedLogins = await vault.audit.getFailedAuth({
  dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000),
  pageSize: 50,
});

console.log(`Found ${failedLogins.entries.length} failed login attempts`);
```

### `vault.audit.getSecretAccess(options?)`

Retrieves secret access logs.

#### **Parameters**

- `options?: Omit<AuditFilter, "resource">` - Filtering options

#### **Returns**

```typescript
Promise<AuditListResponse>;
```

#### **Example**

```typescript
const secretAccess = await vault.audit.getSecretAccess({
  dateFrom: new Date("2025-01-01"),
  pageSize: 100,
});
```

### `vault.audit.exportToCSV(filter?)`

Exports audit logs to CSV format.

#### **Parameters**

- `filter?: AuditFilter` - Filtering options for export

#### **Returns**

```typescript
Promise<string>;
```

#### **Example**

```typescript
const csvData = await vault.audit.exportToCSV({
  dateFrom: new Date("2025-01-01"),
  dateTo: new Date("2025-01-31"),
});

// Save to file or process further
console.log("CSV data length:", csvData.length);
```

---

## 🏛️ Policy Management

### `vault.policies.list(filter?)`

Lists access policies.

#### **Parameters**

```typescript
interface PolicyFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}
```

#### **Returns**

```typescript
Promise<PolicyListResponse>;
```

#### **Example**

```typescript
const policies = await vault.policies.list();
console.log(`Found ${policies.policies.length} policies`);
```

### `vault.policies.get(id)`

Retrieves a specific policy.

#### **Parameters**

- `id: string` - The policy identifier

#### **Returns**

```typescript
Promise<Policy>;
```

#### **Example**

```typescript
const policy = await vault.policies.get("policy-123");
console.log("Policy:", policy.name, policy.description);
```

### `vault.policies.create(policyData)`

Creates a new access policy.

#### **Parameters**

```typescript
interface CreatePolicyData {
  name: string;
  description?: string;
  type: string;
  permissions: string[];
  resources: string[];
  conditions?: Record<string, any>;
}
```

#### **Returns**

```typescript
Promise<Policy>;
```

#### **Example**

```typescript
const newPolicy = await vault.policies.create({
  name: "Developer Access",
  description: "Access policy for development team",
  type: "user",
  permissions: ["read:secrets", "write:secrets"],
  resources: ["secrets/*"],
  conditions: {
    environment: "development",
  },
});
```

---

## ⚙️ System Operations

### `vault.system.health()`

Checks the health status of the Aether Vault system.

#### **Returns**

```typescript
Promise<HealthResponse>;
```

#### **Example**

```typescript
const health = await vault.system.health();
console.log("System status:", health.status);
console.log("Services:", health.services);

if (health.status !== "healthy") {
  console.warn("System is not healthy!");
}
```

### `vault.system.version()`

Retrieves version information about the Aether Vault system.

#### **Returns**

```typescript
Promise<VersionResponse>;
```

#### **Example**

```typescript
const version = await vault.system.version();
console.log("Aether Vault version:", version.version);
console.log("Build:", version.build);
console.log("Git commit:", version.gitCommit);
```

### `vault.system.ready()`

Checks if the system is ready to accept requests.

#### **Returns**

```typescript
Promise<boolean>;
```

#### **Example**

```typescript
const isReady = await vault.system.ready();
if (isReady) {
  console.log("System is ready");
} else {
  console.log("System is not ready yet");
}
```

### `vault.system.metrics()`

Retrieves system performance metrics.

#### **Returns**

```typescript
Promise<SystemMetrics>;
```

#### **Example**

```typescript
const metrics = await vault.system.metrics();
console.log("Uptime:", metrics.uptime);
console.log("Memory usage:", metrics.memory);
console.log("Request count:", metrics.requests);
```

### `vault.system.status()`

Retrieves comprehensive system status information.

#### **Returns**

```typescript
Promise<SystemStatus>;
```

#### **Example**

```typescript
const status = await vault.system.status();
console.log("System healthy:", status.healthy);
console.log("Version:", status.version.version);
console.log("Components:", status.components);
```

---

## 🛠️ Error Handling

The SDK provides comprehensive error handling with typed error classes.

### Error Types

```typescript
// Base error class
class VaultError extends Error {
  code: string;
  message: string;
  details?: any;
}

// Specific error types
class VaultAuthError extends VaultError {}
class VaultPermissionError extends VaultError {}
class VaultNotFoundError extends VaultError {}
class VaultServerError extends VaultError {}
class VaultNetworkError extends VaultError {}
```

### Error Handling Patterns

```typescript
import { VaultError, VaultAuthError, VaultNotFoundError } from "aether-vault";

try {
  const secret = await vault.secrets.getValue("non-existent");
} catch (error) {
  if (error instanceof VaultNotFoundError) {
    console.log("Secret not found");
  } else if (error instanceof VaultAuthError) {
    console.log("Authentication failed");
  } else if (error instanceof VaultError) {
    console.log("Vault error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}
```

---

## 📝 Type Definitions

### Core Types

```typescript
// User identity
interface UserIdentity {
  id: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
}

// Secret
interface Secret {
  id: string;
  name: string;
  description?: string;
  type?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// Secret with value
interface SecretWithValue extends Secret {
  value: string;
}

// TOTP entry
interface TOTPEntry {
  id: string;
  name: string;
  description?: string;
  account?: string;
  issuer?: string;
  qrCode?: string; // Base64 encoded QR code
  backupCodes?: string[];
  algorithm: "SHA1" | "SHA256" | "SHA512";
  digits: 6 | 8;
  period: number;
  createdAt: Date;
}

// TOTP code
interface TOTPCode {
  code: string;
  remainingSeconds: number;
  timestamp: Date;
}

// Audit entry
interface AuditEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Policy
interface Policy {
  id: string;
  name: string;
  description?: string;
  type: string;
  permissions: string[];
  resources: string[];
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Response Types

```typescript
// List responses
interface SecretListResponse {
  secrets: Secret[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

interface TOTPListResponse {
  entries: TOTPEntry[];
  pagination: PaginationInfo;
}

interface AuditListResponse {
  entries: AuditEntry[];
  pagination: PaginationInfo;
}

interface PolicyListResponse {
  policies: Policy[];
  pagination: PaginationInfo;
}

// System responses
interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  services: Record<string, "healthy" | "unhealthy">;
  checks: Record<string, any>;
}

interface VersionResponse {
  version: string;
  build: string;
  gitCommit: string;
  goVersion?: string;
  nodeVersion?: string;
}

interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    perSecond: number;
    averageResponseTime: number;
  };
}

interface SystemStatus {
  healthy: boolean;
  version: VersionResponse;
  components: Record<string, any>;
  uptime: number;
}
```

---

## 🔗 Related Documentation

- **[📖 SDK Overview](./README.md)** - General SDK documentation
- **[🏗️ Architecture Guide](./architecture.md)** - SDK architecture and design
- **[⚙️ Configuration Guide](./configuration.md)** - Setup and configuration
- **[🎨 Examples Guide](./examples.md)** - Real-world usage examples
- **[🚀 Server API Documentation](../server/api.md)** - Complete REST API reference

---

<div align="center">

### 🚀 **Ready to Build with the Aether Vault SDK?**

[📖 SDK Overview](./README.md) • [🎨 Usage Examples](./examples.md) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues)

---

**🔧 Complete Type-Safe SDK for Enterprise Secrets Management**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
