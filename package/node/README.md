<div align="center">

# 🚀 Aether Vault Node.js SDK

**Official SDK for Aether Vault - Centralized secrets, TOTP, and identity management for the Aether Office ecosystem.**

This SDK provides a comprehensive, type-safe interface for interacting with Aether Vault API from your Next.js applications, eliminating the need for raw `fetch("/api/v1/*")` calls throughout your codebase.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.4+-black.svg)](https://nextjs.org/)

</div>

## ✨ Features

- 🔐 **Centralized Authentication** - JWT, Bearer, and Session-based auth with automatic token refresh
- 🔒 **Secrets Management** - Complete CRUD operations for secrets with encryption and rotation
- 🔢 **TOTP Support** - Generate, verify, and manage Time-based One-Time Passwords
- 👤 **Identity Management** - User profiles, roles, permissions, and session management
- 🌐 **Next.js Integration** - Perfect isomorphic compatibility for client and server components
- 🛡️ **Type Safety** - Full TypeScript support with strict mode and comprehensive types
- 🔄 **Error Handling** - Structured error management with typed exceptions
- 📝 **Developer Experience** - Rich debugging, logging, and auto-completion support


## 📦 Installation

```bash
# npm
npm install aether-vault

# yarn
yarn add aether-vault

# pnpm (recommended)
pnpm add aether-vault
```

## 🚀 Quick Start for Next.js

### Basic Setup

Instead of writing raw fetch calls like this:

```typescript
// ❌ Before - Raw fetch calls
const response = await fetch("/api/v1/secrets", {
  headers: { Authorization: `Bearer ${token}` },
});
const secrets = await response.json();
```

Use the SDK instead:

```typescript
// ✅ After - Clean, typed SDK calls
import { createVaultClient } from "aether-vault";

const vault = createVaultClient({
  baseURL: "/api/v1",
  auth: {
    type: "session", // Uses browser cookies automatically
  },
});

// List all secrets
const secrets = await vault.secrets.list();
console.log("Available secrets:", secrets.secrets);

// Get a specific secret
const dbUrl = await vault.secrets.getValue("DATABASE_URL");
console.log("Database URL:", dbUrl);
```

### Authentication Examples

#### Session Authentication (Recommended for Next.js)

```typescript
// For internal web applications - uses browser cookies
const vault = createVaultClient({
  baseURL: "/api/v1",
  auth: {
    type: "session",
  },
});
```

#### JWT Authentication (For API services)

```typescript
// For server-to-server communication
const vault = createVaultClient({
  baseURL: process.env.VAULT_API_URL!,
  auth: {
    type: "jwt",
    token: process.env.VAULT_JWT_TOKEN!,
    jwt: {
      autoRefresh: true,
      refreshEndpoint: "/auth/refresh",
    },
  },
});
```

## 🔒 Secrets Management

### Complete Secret Lifecycle

```typescript
// Create a new secret
const secret = await vault.secrets.create({
  name: "DATABASE_URL",
  value: "postgresql://user:pass@localhost:5432/mydb",
  description: "Production database connection",
  tags: ["database", "production", "critical"],
});

// List secrets with filtering
const { secrets } = await vault.secrets.list({
  search: "database",
  tags: ["production"],
  pageSize: 50,
});

// Get secret value (securely)
const dbUrl = await vault.secrets.getValue("DATABASE_URL");

// Update secret
await vault.secrets.update("DATABASE_URL", {
  description: "Updated description",
  tags: ["database", "production", "updated"],
});

// Rotate secret value
const rotated = await vault.secrets.rotate("DATABASE_URL");
console.log("New value:", rotated.value);

// Archive when no longer needed
await vault.secrets.archive("OLD_API_KEY");
```

### Secret Management Patterns

```typescript
// Check if secret exists before creating
if (!(await vault.secrets.exists("REDIS_URL"))) {
  await vault.secrets.create({
    name: "REDIS_URL",
    value: "redis://localhost:6379",
    description: "Redis connection",
  });
}

// Bulk operations
const criticalSecrets = await vault.secrets.list({
  tags: ["critical"],
});

for (const secret of criticalSecrets.secrets) {
  if (secret.expired) {
    await vault.secrets.rotate(secret.name);
    console.log(`Rotated expired secret: ${secret.name}`);
  }
}
```

## 🔢 TOTP Management

### Two-Factor Authentication Setup

```typescript
// Generate new TOTP for a service
const totpSetup = await vault.totp.generate(
  {
    name: "GitHub",
    account: "user@example.com",
    issuer: "GitHub",
  },
  true,
  true,
); // Generate backup codes and QR code

// Display QR code to user
console.log("QR Code:", totpSetup.qrCode);
console.log("Backup Codes:", totpSetup.backupCodes);

// Verify TOTP code
const verification = await vault.totp.verify("github-totp", "123456", {
  allowDrift: true,
  maxDrift: 30,
});

if (verification.valid) {
  console.log("✅ 2FA verification successful");
} else {
  console.log(
    `❌ Invalid code. ${verification.remainingAttempts} attempts remaining`,
  );
}
```

### TOTP Management

```typescript
// List all TOTP entries
const { totps } = await vault.totp.list({
  active: true,
});

// Get current valid code (for development)
const { code, timeRemaining } = await vault.totp.getCurrentCode("github-totp");
console.log(`Current code: ${code} (valid for ${timeRemaining}s)`);

// Get TOTP statistics
const stats = await vault.totp.getStats("github-totp");
console.log(`Success rate: ${stats.successRate}%`);
console.log(`Total verifications: ${stats.totalVerifications}`);

// Regenerate backup codes
const { codes } = await vault.totp.generateBackupCodes("github-totp", 10);
console.log("New backup codes:", codes);
```

## 👤 Identity Management

### User Profile Management

```typescript
// Get current user profile
const user = await vault.identity.getCurrent();
console.log("Current user:", user.displayName);

// Update user profile
await vault.identity.update("user@example.com", {
  displayName: "John Smith",
  avatar: "https://example.com/avatar.jpg",
  metadata: {
    department: "Engineering",
    role: "Senior Developer",
  },
});

// List all users (admin only)
const { identities } = await vault.identity.list({
  status: "active",
  roles: ["developer"],
});
```

### Password & Security Management

```typescript
// Change password
await vault.identity.changePassword("user@example.com", {
  currentPassword: "oldPassword123",
  newPassword: "newSecurePassword456",
  confirmPassword: "newSecurePassword456",
});

// Setup 2FA
const twoFactorSetup = await vault.identity.setupTwoFactor();
console.log("Scan QR code:", twoFactorSetup.qrCode);

// Enable 2FA with verification code
await vault.identity.verifyTwoFactor("123456", "user@example.com");

// Manage active sessions
const sessions = await vault.identity.listSessions("user@example.com");

// Revoke suspicious sessions
await vault.identity.revokeSession("session-123", "user@example.com");

// Revoke all other sessions (login from new device)
await vault.identity.revokeAllSessions("user@example.com");
```

## 🌐 Next.js Integration Patterns

### Client Component Usage

```typescript
// app/components/secrets-manager.tsx
"use client";

import { createVaultClient } from "aether-vault";
import { useState, useEffect } from "react";

const vault = createVaultClient({
  baseURL: "/api/v1",
  auth: { type: "session" },
});

export function SecretsManager() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSecrets() {
      try {
        const response = await vault.secrets.list({ pageSize: 20 });
        setSecrets(response.secrets);
      } catch (error) {
        console.error("Failed to load secrets:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSecrets();
  }, []);

  const handleCreateSecret = async (name: string, value: string) => {
    try {
      await vault.secrets.create({ name, value });
      // Refresh the list
      const response = await vault.secrets.list({ pageSize: 20 });
      setSecrets(response.secrets);
    } catch (error) {
      console.error("Failed to create secret:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Secrets Manager</h1>
      <ul>
        {secrets.map((secret) => (
          <li key={secret.id}>{secret.name}</li>
        ))}
      </ul>
      <button onClick={() => handleCreateSecret("NEW_SECRET", "value")}>
        Create Secret
      </button>
    </div>
  );
}
```

### Server Component Usage

```typescript
// app/secrets/page.tsx
import { createVaultClient } from "aether-vault";
import { auth } from "@/lib/auth";

async function getSecrets() {
  const session = await auth();

  if (!session?.user?.token) {
    throw new Error("Unauthorized");
  }

  const vault = createVaultClient({
    baseURL: process.env.VAULT_API_URL!,
    auth: {
      type: "jwt",
      token: session.user.token,
    },
  });

  return await vault.secrets.list({ pageSize: 50 });
}

export default async function SecretsPage() {
  const secrets = await getSecrets();

  return (
    <div>
      <h1>All Secrets</h1>
      <p>Total: {secrets.total}</p>
      <ul>
        {secrets.secrets.map((secret) => (
          <li key={secret.id}>
            {secret.name} - {secret.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### API Routes Usage

```typescript
// pages/api/secrets/index.ts
import { createVaultClient } from "aether-vault";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const vault = createVaultClient({
      baseURL: process.env.VAULT_API_URL!,
      auth: {
        type: "jwt",
        token: req.headers.authorization?.replace("Bearer ", ""),
      },
    });

    const secrets = await vault.secrets.list({
      pageSize: parseInt(req.query.pageSize as string) || 20,
    });

    res.status(200).json(secrets);
  } catch (error) {
    console.error("Vault API error:", error);
    res.status(500).json({ error: "Failed to fetch secrets" });
  }
}
```

## 🛡️ Error Handling

The SDK provides comprehensive, typed error handling:

```typescript
import {
  VaultError,
  VaultAuthError,
  VaultPermissionError,
  VaultNotFoundError,
} from "aether-vault";

try {
  const secret = await vault.secrets.getValue("DATABASE_URL");
  console.log("Secret value:", secret);
} catch (error) {
  if (error instanceof VaultAuthError) {
    // Redirect to login
    window.location.href = "/login";
  } else if (error instanceof VaultPermissionError) {
    // Show permission denied message
    showError("You don't have permission to access this secret");
  } else if (error instanceof VaultNotFoundError) {
    // Handle not found
    showError("Secret not found");
  } else if (error instanceof VaultError) {
    // Handle general vault errors
    showError(`Vault error: ${error.message}`);
  } else {
    // Handle unexpected errors
    showError("An unexpected error occurred");
  }
}
```

## 🔧 Advanced Configuration

### Production Setup

```typescript
const vault = createVaultClient({
  baseURL: process.env.NEXT_PUBLIC_VAULT_URL || "/api/v1",
  auth: {
    type: "session", // Use cookies for web apps
  },
  timeout: 30000, // 30 seconds
  retry: true,
  maxRetries: 3,
  retryDelay: 1000,
  headers: {
    "X-Client-Version": "1.0.0",
    "X-Environment": process.env.NODE_ENV,
  },
  debug: process.env.NODE_ENV === "development",
});
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_VAULT_URL=https://vault.example.com/api/v1
VAULT_API_URL=https://vault.internal.example.com/api/v1
NODE_ENV=development
```

## 🏗️ Architecture

The SDK is built with a modular, domain-driven architecture:

```
src/
├── core/           # HTTP client, configuration, error handling
├── secrets/        # Secrets management operations
├── totp/          # TOTP generation and verification
├── identity/       # User identity and session management
├── auth/          # Authentication handling
└── types/          # TypeScript type definitions
```

**Key Benefits:**

- **Type Safety**: Full TypeScript support eliminates runtime errors
- **Consistency**: Standardized API across all operations
- **Maintainability**: Centralized HTTP logic and error handling
- **Security**: Built-in authentication and secure secret handling
- **DX**: Rich auto-completion and documentation

## 📋 Migration Guide

### From Raw Fetch to SDK

**Before:**

```typescript
// Raw fetch - error-prone, no types
const response = await fetch("/api/v1/secrets", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ name, value }),
});

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const data = await response.json();
```

**After:**

```typescript
// SDK - typed, handled errors
const secret = await vault.secrets.create({ name, value });
// All errors are typed and handled automatically
```

## 🚀 Deployment

### Next.js Project Structure

```
your-nextjs-app/
├── app/
│   ├── components/
│   │   └── secrets-manager.tsx      # Client components
│   ├── pages/
│   │   └── api/
│   │       └── secrets/              # API routes
│   └── layout.tsx
├── lib/
│   ├── auth.ts                     # Auth utilities
│   └── vault.ts                   # SDK instance
├── .env.local                     # Environment variables
└── package.json
```

### Recommended Patterns

1. **Create a vault instance** in a shared utility file
2. **Use session auth** for web applications
3. **Handle errors gracefully** with typed exceptions
4. **Leverage TypeScript** for full type safety
5. **Use server components** for data fetching when possible

## 📚 API Reference

### Main Export: `createVaultClient`

```typescript
function createVaultClient(config: VaultConfig): AetherVaultClient;
```

### Domain Clients

- `vault.secrets` - Secrets CRUD operations
- `vault.totp` - TOTP generation and verification
- `vault.identity` - User identity management
- `vault.auth` - Authentication operations

### Common Methods

All domain clients follow consistent patterns:

- `list(params)` - List with pagination and filtering
- `get(id)` - Get single item
- `create(data)` - Create new item
- `update(id, data)` - Update existing item
- `delete(id)` - Delete item

## 📄 License

MIT License - see [LICENSE](../../../LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](../../../docs)
- 🐛 [Issue Tracker](https://github.com/skygenesisenterprise/aether-vault/issues)
- 💬 [GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)
- 📧 [Support Email](mailto:support@skygenesisenterprise.com)

---

<div align="center">

**Made with ❤️ by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

Building the future of unified secrets management for modern web applications.

</div>