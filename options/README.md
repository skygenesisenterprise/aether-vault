<div align="center">

# ⚙️ Aether Vault Options

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)](https://react.dev/)

**🔧 Configuration Management System - Extensible Options Framework**

A comprehensive configuration management system that provides a flexible, type-safe approach to handling application settings, user preferences, and system options across the Ather Vault ecosystem.

[🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📁 Architecture](#-architecture) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-vault)](https://github.com/skygenesisenterprise/aether-vault/issues)

</div>

---

## 🌟 What is Aether Vault Options?

**Aether Vault Options** is a sophisticated configuration management system designed to provide a unified, type-safe approach to handling settings, preferences, and options throughout the Aether Vault ecosystem. It serves as the central configuration hub for both system administrators and end users.

### 🎯 Core Vision

- **🔧 Type-Safe Configuration** - Full TypeScript support with compile-time validation
- **⚙️ Hierarchical Settings** - Multi-level configuration with inheritance and overrides
- **🔄 Real-Time Updates** - Live configuration changes without application restart
- **🛡️ Validation & Schema** - JSON Schema-based validation for all configuration options
- **🌐 Environment Aware** - Separate configurations for development, staging, and production
- **🔐 Permission-Based Access** - Role-based access control for sensitive settings
- **📊 Audit & History** - Complete audit trail of configuration changes
- **🔌 Plugin System** - Extensible architecture for custom configuration providers

---

## 📋 Key Features

### 🔧 **Core Configuration Management**

- ✅ **Type-Safe Options** - Full TypeScript integration with strict typing
- ✅ **Schema Validation** - JSON Schema-based validation for all settings
- ✅ **Hierarchical Overrides** - Environment-specific configuration overrides
- ✅ **Hot Reloading** - Real-time configuration updates without restart
- ✅ **Default Values** - Sensible defaults with easy customization
- ✅ **Configuration Groups** - Logical grouping of related settings

### 🔄 **Dynamic Configuration**

- ✅ **Runtime Updates** - Apply configuration changes at runtime
- ✅ **Validation Pipeline** - Multi-stage validation before applying changes
- ✅ **Rollback Support** - Automatic rollback on invalid configurations
- ✅ **Change Notifications** - Event-driven notifications for configuration changes
- ✅ **Dependency Resolution** - Handle configuration dependencies automatically

### 🛡️ **Security & Validation**

- ✅ **Input Sanitization** - Automatic cleaning and validation of user inputs
- ✅ **Type Coercion** - Smart type conversion and validation
- ✅ **Security Scoping** - Permission-based access to sensitive options
- ✅ **Audit Logging** - Complete audit trail of all configuration changes
- ✅ **Encryption Support** - Encrypted storage for sensitive data

### 🌐 **Environment Management**

- ✅ **Multi-Environment** - Development, staging, and production configurations
- ✅ **Environment Variables** - Integration with system environment variables
- ✅ **Configuration Profiles** - Named configuration sets for different scenarios
- ✅ **Feature Flags** - Built-in feature flag management
- ✅ **A/B Testing** - Configuration support for experimental features

---

## 🛠️ Tech Stack

### 🎨 **Frontend Integration**

```
Next.js 16 + React 19.2.1 + TypeScript 5
├── 🎨 Tailwind CSS v4 + shadcn/ui (Configuration UI Components)
├── 📝 TypeScript Strict Mode (Type-Safe Configuration)
├── 🔄 React Context (Configuration State Management)
├── 🛣️ Next.js App Router (Configuration Routes)
└── 🔧 Custom Hooks (Configuration Access & Updates)
```

### ⚙️ **Core Library**

```
TypeScript 5 + Node.js Runtime
├── 📝 TypeScript Compiler (Type Safety)
├── 🗄️ JSON Schema (Validation Framework)
├── 🔄 Event System (Change Notifications)
├── 🔌 Plugin Architecture (Extensibility)
├── 🛡️ Validation Pipeline (Input Processing)
└── 📊 Configuration Store (Persistent Storage)
```

### 🗄️ **Storage Layer**

```
Flexible Storage Backends
├── 💾 File System (JSON/YAML Configuration Files)
├── 🗄️ Database (PostgreSQL/SQLite for Large-Scale)
├── 🔐 Environment Variables (System Integration)
├── ☁️ Cloud Storage (AWS S3/Azure Blob for Distributed)
└── 🗂️ Memory Cache (Fast Access & Performance)
```

---

## 📁 Architecture

### 🏗️ **Core Components**

```
options/
├── core/                    # 🔧 Core Configuration Engine
│   ├── schema/             # JSON Schema definitions
│   ├── validators/         # Validation logic & pipelines
│   ├── stores/             # Storage abstraction layer
│   └── types/              # TypeScript type definitions
├── providers/              # 🌐 Configuration Providers
│   ├── file/               # File-based configuration
│   ├── database/           # Database storage
│   ├── env/                # Environment variables
│   └── cloud/              # Cloud storage backends
├── ui/                     # 🎨 User Interface Components
│   ├── components/         # React configuration components
│   ├── forms/              # Configuration forms & editors
│   ├── hooks/              # Custom React hooks
│   └── pages/              # Next.js configuration pages
├── plugins/                # 🔌 Plugin System
│   ├── validation/         # Custom validation plugins
│   ├── storage/            # Custom storage plugins
│   └── notification/       # Custom notification plugins
├── schemas/                # 📋 Configuration Schemas
│   ├── system/             # System-level configuration
│   ├── user/               # User preferences
│   ├── feature-flags/      # Feature flag definitions
│   └── security/           # Security settings
└── examples/               # 📚 Usage Examples
    ├── basic/              # Basic configuration examples
    ├── advanced/           # Advanced usage patterns
    └── integrations/       # Third-party integrations
```

### 🔄 **Configuration Flow Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Configuration │    │   Validation     │    │   Storage       │
│   Request       │◄──►│   Pipeline       │◄──►│   Backend       │
│                 │    │                  │    │                 │
│ • Form Input    │    │ • Schema Check   │    │ • File System   │
│ • API Call      │    │ • Type Coercion  │    │ • Database      │
│ • Programmatic  │    │ • Security Check │    │ • Environment   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
      ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
      │   Event System  │    │   Notifications   │    │   Audit Trail   │
      │                 │    │                  │    │                 │
      │ • Change Events │    │ • UI Updates     │    │ • Change Log    │
      │ • Rollback      │    │ • Webhooks       │    │ • User Tracking │
      │ • Validation    │    │ • Emails         │    │ • Timestamps    │
      └─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0 or higher
- **pnpm** 9.0.0 or higher (recommended)

### 🔧 Installation

```bash
# Install the options package
pnpm add @aether-vault/options

# Install peer dependencies
pnpm add react @types/react next

# For development setup
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/options
pnpm install
```

### ⚡ Basic Usage

```typescript
// Import core configuration system
import { OptionsManager, OptionSchema } from "@aether-vault/options";

// Define configuration schema
const appConfig: OptionSchema = {
  database: {
    type: "object",
    properties: {
      host: { type: "string", default: "localhost" },
      port: { type: "number", default: 5432 },
      ssl: { type: "boolean", default: false },
    },
  },
  features: {
    type: "object",
    properties: {
      darkMode: { type: "boolean", default: true },
      notifications: { type: "boolean", default: true },
    },
  },
};

// Initialize options manager
const options = new OptionsManager({
  schema: appConfig,
  environment: "development",
});

// Get configuration values
const dbHost = options.get("database.host");
const darkMode = options.get("features.darkMode");

// Update configuration
await options.set("features.darkMode", false);
```

### 🎨 React Integration

```tsx
// Use the configuration in React components
import { useOptions, OptionProvider } from "@aether-vault/options/react";

function SettingsPanel() {
  const { options, update, isLoading } = useOptions();

  const handleDarkModeToggle = async (enabled: boolean) => {
    await update("features.darkMode", enabled);
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={options.get("features.darkMode")}
          onChange={(e) => handleDarkModeToggle(e.target.checked)}
        />
        Dark Mode
      </label>
    </div>
  );
}

// Wrap your app with the provider
function App() {
  return (
    <OptionProvider schema={appConfig}>
      <SettingsPanel />
    </OptionProvider>
  );
}
```

---

## 🔧 Advanced Configuration

### 🗂️ **Hierarchical Configuration**

```typescript
const manager = new OptionsManager({
  schema: appConfig,
  environment: "production",
  layers: [
    // Base configuration
    { source: "file", path: "./config/default.json" },
    // Environment-specific
    { source: "file", path: "./config/production.json" },
    // User overrides
    { source: "database", table: "user_settings" },
    // Runtime environment
    { source: "env", prefix: "AETHER_" },
  ],
});
```

### 🔌 **Custom Validation Plugins**

```typescript
import { ValidationPlugin } from "@aether-vault/options";

class EmailValidator extends ValidationPlugin {
  validate(value: any, schema: any) {
    if (schema.format === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error("Invalid email format");
      }
    }
    return value;
  }
}

manager.registerPlugin(new EmailValidator());
```

### 🔄 **Real-Time Updates**

```typescript
// Listen to configuration changes
manager.on("change", (event) => {
  console.log(`Configuration changed: ${event.key} = ${event.value}`);

  // Trigger application reload if needed
  if (event.key.startsWith("database.")) {
    restartDatabaseConnection();
  }
});

// Batch updates for atomic changes
await manager.batch({
  "features.darkMode": true,
  "theme.primaryColor": "#007acc",
  "ui.language": "en",
});
```

---

## 📚 API Reference

### 🔧 **Core Classes**

#### `OptionsManager`

Main configuration management class.

```typescript
class OptionsManager {
  constructor(config: OptionsManagerConfig);

  // Get configuration values
  get<T>(key: string, defaultValue?: T): T;
  getAll(): Record<string, any>;
  has(key: string): boolean;

  // Update configuration
  set(key: string, value: any): Promise<void>;
  setAll(values: Record<string, any>): Promise<void>;
  batch(updates: Record<string, any>): Promise<void>;

  // Schema and validation
  addSchema(name: string, schema: OptionSchema): void;
  validate(key: string, value: any): boolean;

  // Events and lifecycle
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  reload(): Promise<void>;

  // Environment and layers
  setEnvironment(env: string): void;
  addLayer(layer: ConfigurationLayer): void;
}
```

#### `OptionSchema`

JSON Schema-based configuration definition.

```typescript
interface OptionSchema {
  type: string;
  properties?: Record<string, OptionSchema>;
  items?: OptionSchema;
  required?: string[];
  default?: any;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  description?: string;
  sensitive?: boolean; // Marks field as encrypted
}
```

### 🎨 **React Components**

#### `useOptions` Hook

Access configuration in React components.

```typescript
const { options, update, isLoading, error } = useOptions();
```

#### `OptionProvider` Component

Provide configuration context to React tree.

```typescript
<OptionProvider schema={appConfig} environment="production">
  <App />
</OptionProvider>
```

---

## 🔌 Plugin Development

### 🛠️ **Creating Custom Plugins**

```typescript
import { Plugin, PluginContext } from "@aether-vault/options";

interface RedisPluginConfig {
  host: string;
  port: number;
  keyPrefix: string;
}

class RedisStoragePlugin extends Plugin {
  private client: Redis;

  constructor(private config: RedisPluginConfig) {
    super("redis-storage");
  }

  async initialize(context: PluginContext): Promise<void> {
    this.client = new Redis({
      host: this.config.host,
      port: this.config.port,
    });
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(this.config.keyPrefix + key);
    return value ? JSON.parse(value) : undefined;
  }

  async set(key: string, value: any): Promise<void> {
    await this.client.set(this.config.keyPrefix + key, JSON.stringify(value));
  }
}
```

---

## 🤝 Contributing

We welcome contributions to the Aether Vault Options system! Whether you're interested in core functionality, validation plugins, UI components, or documentation, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Read the development guidelines** in the main repository
3. **Check existing issues** for enhancement requests
4. **Start with small contributions** - bug fixes, documentation, or tests
5. **Follow our code standards** and commit guidelines

### 🏗️ **Areas Needing Help**

- **Core Development** - Validation, storage backends, performance optimization
- **Plugin System** - Custom plugins for various use cases
- **UI Components** - React components for configuration management
- **Schema Development** - Pre-built schemas for common applications
- **Documentation** - API docs, tutorials, and examples
- **Testing** - Unit tests, integration tests, and E2E tests
- **Performance** - Optimization for large-scale configurations

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](./docs/)** - Comprehensive guides and API reference
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - General questions and ideas
- 📧 **Email** - support@skygenesisenterprise.com

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../../LICENSE) file for details.

---

<div align="center">

### 🚀 **Join Us in Building the Future of Configuration Management!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Type-Safe Configuration Management for Modern Applications**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
