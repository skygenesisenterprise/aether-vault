<div align="center">

# ⚙️ Aether Vault Node.js SDK Configuration

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![SDK Version](https://img.shields.io/badge/SDK-v1.0.12-purple?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault)

**🔐 Complete Configuration Guide for Aether Vault Node.js SDK**

Comprehensive configuration documentation for Aether Vault Node.js SDK - covering all setup options, environment variables, and configuration patterns.

[🚀 Quick Start](#-quick-start) • [📋 Configuration Options](#-configuration-options) • [🔐 Authentication](#-authentication-configuration) • [🌍 Environment Setup](#-environment-setup) • [📁 Configuration Files](#-configuration-files) • [🔧 Advanced Configuration](#-advanced-configuration) • [🚨 Troubleshooting](#-troubleshooting)

</div>

---

## 🌟 Overview

The Aether Vault SDK supports flexible configuration through multiple sources: configuration files, environment variables, and runtime options. This guide covers all available configuration options and best practices.

### 🎯 **Configuration Priorities**

Configuration is loaded in the following order (higher priority overrides lower):

1. **Runtime Configuration** - Direct options passed to `createVaultClient()`
2. **Environment Variables** - Environment-specific overrides
3. **Configuration File** - `vault.config.ts` or custom path
4. **Default Values** - Built-in SDK defaults

---

## 🚀 Quick Start

### Basic Configuration

```typescript
import { createVaultClient } from "aether-vault";

// Minimal configuration with defaults
const vault = await createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});
```

### Configuration File Setup

```typescript
// vault.config.ts
import { VaultConfig } from "aether-vault";

export default {
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "jwt",
    token: process.env.VAULT_TOKEN,
  },
  timeout: 10000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
} satisfies VaultConfig;
```

```typescript
// app.ts
import { createVaultClient } from "aether-vault";

// Auto-load from vault.config.ts
const vault = await createVaultClient();
```

---

## 📋 Configuration Options

### Core Configuration

```typescript
interface VaultConfig {
  // Required: API base URL
  baseURL: string;

  // Required: Authentication configuration
  auth: AuthConfig;

  // Optional: Request timeout in milliseconds (default: 10000)
  timeout?: number;

  // Optional: Retry configuration
  retry?: {
    enabled: boolean; // default: true
    maxRetries: number; // default: 3
    retryDelay: number; // default: 1000ms
    backoffMultiplier: number; // default: 2
  };

  // Optional: Custom headers
  headers?: Record<string, string>;

  // Optional: Debug mode (default: false)
  debug?: boolean;

  // Optional: Custom user agent
  userAgent?: string;
}
```

### Authentication Configuration

```typescript
// Base authentication interface
interface AuthConfig {
  type: "session" | "jwt" | "bearer" | "none";
}

// Session-based authentication (web apps)
interface SessionAuthConfig extends AuthConfig {
  type: "session";
  cookieOptions?: {
    secure?: boolean; // default: true in production
    sameSite?: "strict" | "lax" | "none";
    domain?: string;
  };
}

// JWT-based authentication (API services)
interface JwtAuthConfig extends AuthConfig {
  type: "jwt";
  token: string;
  autoRefresh?: boolean; // default: false
  refreshEndpoint?: string; // default: "/auth/refresh"
  refreshBuffer?: number; // default: 300000ms (5min)
  refreshFn?: (token: string) => Promise<string>;
}

// Bearer token authentication
interface BearerAuthConfig extends AuthConfig {
  type: "bearer";
  token: string;
}
```

---

## 🔐 Authentication Configuration

### Session-Based Authentication

```typescript
// Recommended for web applications
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      domain: ".aethervault.com",
    },
  },
});
```

### JWT-Based Authentication

```typescript
// Recommended for API services and microservices
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "jwt",
    token: process.env.VAULT_JWT_TOKEN,
    autoRefresh: true,
    refreshBuffer: 300000, // 5 minutes before expiry
    refreshFn: async (token) => {
      // Custom refresh logic
      const response = await fetch("/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      return data.token;
    },
  },
});
```

### Bearer Token Authentication

```typescript
// For API integrations with static tokens
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "bearer",
    token: process.env.VAULT_BEARER_TOKEN,
  },
});
```

---

## 🌍 Environment Setup

### Environment Variables

The SDK automatically loads configuration from environment variables. These variables follow a consistent naming convention:

#### **Core Configuration**

```bash
# Base URL (required)
VAULT_BASE_URL=https://api.aethervault.com

# Authentication type (optional, default: session)
VAULT_AUTH_TYPE=session

# Request timeout (optional, default: 10000)
VAULT_TIMEOUT=15000

# Debug mode (optional, default: false)
VAULT_DEBUG=true

# Custom user agent (optional)
VAULT_USER_AGENT=MyApp/1.0.0
```

#### **JWT Authentication**

```bash
# JWT token
VAULT_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Auto refresh (optional, default: false)
VAULT_JWT_AUTO_REFRESH=true

# Refresh endpoint (optional)
VAULT_JWT_REFRESH_ENDPOINT=/auth/refresh

# Refresh buffer in milliseconds (optional, default: 300000)
VAULT_JWT_REFRESH_BUFFER=300000
```

#### **Bearer Authentication**

```bash
# Bearer token
VAULT_BEARER_TOKEN=sk_live_1234567890abcdef
```

#### **Retry Configuration**

```bash
# Enable retries (optional, default: true)
VAULT_RETRY_ENABLED=true

# Maximum retry attempts (optional, default: 3)
VAULT_RETRY_MAX_RETRIES=5

# Retry delay in milliseconds (optional, default: 1000)
VAULT_RETRY_DELAY=2000

# Backoff multiplier (optional, default: 2)
VAULT_RETRY_BACKOFF_MULTIPLIER=1.5
```

### Environment-Specific Configuration

```typescript
// vault.config.ts
import { VaultConfig } from "aether-vault";

const baseConfig: Partial<VaultConfig> = {
  timeout: 10000,
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
};

const environments = {
  development: {
    ...baseConfig,
    baseURL: "http://localhost:8080",
    auth: { type: "session" },
    debug: true,
  },

  staging: {
    ...baseConfig,
    baseURL: "https://staging-api.aethervault.com",
    auth: {
      type: "jwt",
      token: process.env.STAGING_JWT_TOKEN,
    },
    debug: false,
  },

  production: {
    ...baseConfig,
    baseURL: "https://api.aethervault.com",
    auth: {
      type: "jwt",
      token: process.env.PRODUCTION_JWT_TOKEN,
      autoRefresh: true,
    },
    debug: false,
    timeout: 15000,
  },
};

// Environment detection
const env = (process.env.NODE_ENV ||
  process.env.VAULT_ENV ||
  "development") as keyof typeof environments;

export default environments[env] as VaultConfig;
```

---

## 📁 Configuration Files

### vault.config.ts

The default configuration file is `vault.config.ts`. It should export a default configuration object that satisfies the `VaultConfig` interface.

#### **Basic Configuration File**

```typescript
// vault.config.ts
import { VaultConfig } from "aether-vault";

export default {
  baseURL: process.env.VAULT_BASE_URL || "http://localhost:8080",
  auth: {
    type: (process.env.VAULT_AUTH_TYPE as any) || "session",
    token: process.env.VAULT_JWT_TOKEN || process.env.VAULT_BEARER_TOKEN,
  },
  timeout: parseInt(process.env.VAULT_TIMEOUT || "10000"),
  debug: process.env.VAULT_DEBUG === "true",
  headers: {
    "X-App-Version": "1.0.0",
    "X-Client-ID": "my-app",
  },
} satisfies VaultConfig;
```

#### **Advanced Configuration File**

```typescript
// vault.config.ts
import { VaultConfig } from "aether-vault";

const config: VaultConfig = {
  baseURL: process.env.VAULT_BASE_URL!,
  auth: getAuthConfig(),
  timeout: getTimeout(),
  retry: getRetryConfig(),
  debug: isDebugMode(),
  headers: getDefaultHeaders(),
};

function getAuthConfig() {
  const authType = process.env.VAULT_AUTH_TYPE || "session";

  switch (authType) {
    case "jwt":
      return {
        type: "jwt" as const,
        token: process.env.VAULT_JWT_TOKEN!,
        autoRefresh: process.env.VAULT_JWT_AUTO_REFRESH === "true",
      };

    case "bearer":
      return {
        type: "bearer" as const,
        token: process.env.VAULT_BEARER_TOKEN!,
      };

    default:
      return { type: "session" as const };
  }
}

function getTimeout(): number {
  const timeout = process.env.VAULT_TIMEOUT;
  return timeout ? parseInt(timeout) : 10000;
}

function getRetryConfig() {
  return {
    enabled: process.env.VAULT_RETRY_ENABLED !== "false",
    maxRetries: parseInt(process.env.VAULT_RETRY_MAX_RETRIES || "3"),
    retryDelay: parseInt(process.env.VAULT_RETRY_DELAY || "1000"),
    backoffMultiplier: parseFloat(
      process.env.VAULT_RETRY_BACKOFF_MULTIPLIER || "2",
    ),
  };
}

function isDebugMode(): boolean {
  return (
    process.env.VAULT_DEBUG === "true" || process.env.NODE_ENV === "development"
  );
}

function getDefaultHeaders(): Record<string, string> {
  return {
    "X-App-Version": process.env.npm_package_version || "1.0.0",
    "X-Client-ID": process.env.CLIENT_ID || "unknown",
    "X-Environment": process.env.NODE_ENV || "development",
  };
}

export default config;
```

### Custom Configuration File Path

```typescript
// Load from custom path
const vault = await createVaultClient({
  configPath: "./config/my-vault.config.ts",
});

// Or with environment variable
// VAULT_CONFIG_PATH=./config/my-vault.config.ts
const vault = await createVaultClient();
```

### Multiple Configuration Files

```typescript
// vault.base.config.ts
export const baseConfig = {
  timeout: 10000,
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
  headers: {
    "X-App-Version": "1.0.0",
  },
};

// vault.development.config.ts
import { baseConfig } from "./vault.base.config";

export default {
  ...baseConfig,
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
  debug: true,
};

// vault.production.config.ts
import { baseConfig } from "./vault.base.config";

export default {
  ...baseConfig,
  baseURL: "https://api.aethervault.com",
  auth: {
    type: "jwt",
    token: process.env.PROD_VAULT_TOKEN,
  },
  debug: false,
  timeout: 15000,
};
```

---

## 🔧 Advanced Configuration

### Retry Configuration

```typescript
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: { type: "jwt", token: process.env.VAULT_TOKEN },
  retry: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 2000,
    backoffMultiplier: 1.5,
    retryCondition: (error, attempt) => {
      // Custom retry logic
      if (error.status === 429) return true; // Rate limited
      if (error.status >= 500) return true; // Server error
      if (error.status === 401) return false; // Auth error
      return attempt < 3; // Retry first 3 attempts
    },
  },
});
```

### Custom Headers

```typescript
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: { type: "bearer", token: process.env.VAULT_TOKEN },
  headers: {
    "X-App-Version": "1.0.0",
    "X-Client-ID": "my-app",
    "X-Request-ID": generateRequestId(),
    "User-Agent": "MyApp/1.0.0 (+https://myapp.com)",
  },
});

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### Debug Mode

```typescript
const vault = await createVaultClient({
  baseURL: "https://api.aethervault.com",
  auth: { type: "session" },
  debug: true, // Enable detailed logging
});

// Debug output includes:
// - Request/response details
// - Authentication flow
// - Retry attempts
// - Performance metrics
```

### Configuration Validation

```typescript
import { createVaultClient, validateVaultConfig } from "aether-vault";

const config = {
  baseURL: "https://api.aethervault.com",
  auth: { type: "jwt", token: "invalid-token" },
};

// Validate configuration before creating client
const validation = validateVaultConfig(config);
if (!validation.valid) {
  console.error("Configuration errors:", validation.errors);
  process.exit(1);
}

const vault = await createVaultClient(config);
```

### Configuration Merging

```typescript
// Default configuration
const defaultConfig = {
  timeout: 10000,
  retry: { maxRetries: 3 },
  headers: { "X-App": "MyApp" },
};

// Environment-specific overrides
const productionOverrides = {
  timeout: 15000,
  retry: { maxRetries: 5 },
  debug: false,
};

// Runtime overrides
const runtimeOverrides = {
  baseURL: process.env.VAULT_URL,
  auth: { type: "jwt", token: process.env.VAULT_TOKEN },
};

// Create client with merged configuration
const vault = await createVaultClient({
  ...defaultConfig,
  ...productionOverrides,
  ...runtimeOverrides,
});
```

---

## 🏢 Enterprise Configuration Patterns

### Multi-Service Configuration

```typescript
// vault.services.config.ts
interface ServiceConfig {
  name: string;
  baseURL: string;
  auth: any;
}

const services: Record<string, ServiceConfig> = {
  secrets: {
    name: "secrets",
    baseURL: process.env.SECRETS_SERVICE_URL || "http://secrets:8080",
    auth: {
      type: "jwt",
      token: process.env.SECRETS_SERVICE_TOKEN,
    },
  },

  auth: {
    name: "auth",
    baseURL: process.env.AUTH_SERVICE_URL || "http://auth:8080",
    auth: {
      type: "session",
    },
  },

  audit: {
    name: "audit",
    baseURL: process.env.AUDIT_SERVICE_URL || "http://audit:8080",
    auth: {
      type: "jwt",
      token: process.env.AUDIT_SERVICE_TOKEN,
    },
  },
};

// Create clients for multiple services
const clients = Object.fromEntries(
  Object.entries(services).map(([key, config]) => [
    key,
    createVaultClient(config),
  ]),
);

export { clients as vaultClients };
```

### Configuration with Secrets Management

```typescript
// vault.secure.config.ts
import { VaultConfig } from "aether-vault";
import { decryptSecret } from "./crypto";

async function loadSecureConfig(): Promise<VaultConfig> {
  // Load encrypted configuration
  const encryptedConfig = await import("./vault.config.encrypted");

  // Decrypt sensitive values
  const token = await decryptSecret(process.env.ENCRYPTED_TOKEN_KEY);
  const apiSecret = await decryptSecret(process.env.ENCRYPTED_API_SECRET);

  return {
    baseURL: encryptedConfig.baseURL,
    auth: {
      type: "jwt",
      token,
      autoRefresh: true,
    },
    headers: {
      "X-API-Secret": apiSecret,
    },
    timeout: encryptedConfig.timeout || 10000,
  };
}

export const secureVaultConfig = loadSecureConfig();
```

### Dynamic Configuration

```typescript
// vault.dynamic.config.ts
import { VaultConfig, createVaultClient } from "aether-vault";

class DynamicVaultConfig {
  private config: VaultConfig;
  private listeners: Array<(config: VaultConfig) => void> = [];

  constructor(initialConfig: VaultConfig) {
    this.config = initialConfig;
  }

  update(updates: Partial<VaultConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyListeners();
  }

  get(): VaultConfig {
    return this.config;
  }

  onChange(listener: (config: VaultConfig) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.config));
  }
}

// Usage
const dynamicConfig = new DynamicVaultConfig({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});

// Update configuration at runtime
dynamicConfig.update({
  timeout: 15000,
  debug: true,
});

// Create client that responds to changes
const vault = await createVaultClient(dynamicConfig.get());
```

---

## 🚨 Troubleshooting

### Common Configuration Issues

#### **Invalid Base URL**

```typescript
// ❌ Wrong
baseURL: "api.aethervault.com"; // Missing protocol

// ✅ Correct
baseURL: "https://api.aethervault.com";
baseURL: "http://localhost:8080";
```

#### **Authentication Token Issues**

```typescript
// ❌ Missing token
auth: { type: "jwt" }  // token property missing

// ✅ Include token
auth: { type: "jwt", token: "your-jwt-token" }
```

#### **Environment Variable Issues**

```typescript
// ❌ Variables not loaded
const config = {
  baseURL: process.env.VAULT_BASE_URL, // Could be undefined
};

// ✅ Provide defaults or validation
const config = {
  baseURL: process.env.VAULT_BASE_URL || "http://localhost:8080",
};
```

### Debug Configuration

```typescript
import { createVaultClient, validateVaultConfig } from "aether-vault";

// Enable debug logging
const vault = await createVaultClient({
  baseURL: process.env.VAULT_BASE_URL,
  auth: { type: "jwt", token: process.env.VAULT_TOKEN },
  debug: true, // Enable detailed logging
});

// Validate configuration
const validation = validateVaultConfig(vault.getConfig());
if (!validation.valid) {
  console.error("Configuration validation failed:");
  validation.errors.forEach((error) => {
    console.error(`- ${error.field}: ${error.message}`);
  });
}
```

### Configuration Testing

```typescript
// config.test.ts
import { validateVaultConfig } from "aether-vault";
import config from "./vault.config";

describe("Vault Configuration", () => {
  it("should be valid", () => {
    const validation = validateVaultConfig(config);
    expect(validation.valid).toBe(true);
    if (!validation.valid) {
      console.error("Configuration errors:", validation.errors);
    }
  });

  it("should have required fields", () => {
    expect(config.baseURL).toBeDefined();
    expect(config.auth).toBeDefined();
    expect(config.auth.type).toBeDefined();
  });

  it("should have valid URL format", () => {
    expect(config.baseURL).toMatch(/^https?:\/\/.+/);
  });
});
```

---

## 🔗 Related Documentation

- **[📚 API Reference](./api.md)** - Complete SDK API documentation
- **[🏗️ Architecture Guide](./architecture.md)** - SDK architecture and design
- **[🎨 Examples Guide](./examples.md)** - Real-world usage examples
- **[📖 SDK Overview](./README.md)** - General SDK documentation

---

<div align="center">

### ⚙️ **Configure Your Aether Vault SDK for Production Use!**

[📖 SDK Overview](./README.md) • [🎨 Usage Examples](./examples.md) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues)

---

**🔧 Flexible Configuration for Enterprise Environments**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
