<div align="center">

# 📚 Aether Vault Node.js SDK Documentation

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![SDK Version](https://img.shields.io/badge/SDK-v1.0.12-purple?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault)

**🔐 Complete Documentation for the Official Aether Vault Node.js SDK**

Comprehensive documentation for the Aether Vault Node.js SDK - the official TypeScript client for secure secrets management, TOTP, and identity operations.

[📖 Overview](#-overview) • [🚀 Quick Start](#-quick-start) • [📚 Documentation Set](#-documentation-set) • [🛠️ Development](#️-development) • [🔗 Resources](#-resources)

</div>

---

## 🌟 Overview

The **Aether Vault Node.js SDK** provides a comprehensive, type-safe interface for interacting with the Aether Vault API. This documentation set covers everything from basic setup to advanced enterprise integrations.

### 🎯 **What You'll Find Here**

- **📚 Complete API Reference** - Detailed documentation of all SDK methods
- **🏗️ Architecture Guide** - Understanding the SDK's modular design
- **⚙️ Configuration Guide** - Setup and configuration options
- **🎨 Usage Examples** - Real-world implementation patterns
- **🛠️ Development Guide** - Contributing and extending the SDK

### 🚀 **Key Capabilities**

- **🔐 Authentication Management** - JWT, session, and token-based auth
- **🔒 Secrets Operations** - Complete CRUD with encryption
- **⚡ TOTP Management** - QR codes, verification, and backup codes
- **👤 Identity Services** - User profiles and session control
- **📊 Audit Logging** - Complete audit trails and compliance
- **🛡️ Type Safety** - Full TypeScript support with strict mode

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

### Basic Usage

```typescript
import { createVaultClient } from "aether-vault";

// Create vault client
const vault = await createVaultClient({
  baseURL: "http://localhost:8080",
  auth: { type: "session" },
});

// Login and use
await vault.auth.login({
  username: "user@example.com",
  password: "securePassword123",
});

const secrets = await vault.secrets.list();
console.log("Found secrets:", secrets.secrets.length);
```

---

## 📚 Documentation Set

### 📖 **Core Documentation**

| Document                                         | Description                                                          | Link                                     |
| ------------------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------- |
| **[📚 API Reference](./api.md)**                 | Complete SDK API documentation with all methods, types, and examples | [View API Docs](./api.md)                |
| **[🏗️ Architecture Guide](./architecture.md)**   | Detailed SDK architecture, modular design, and component overview    | [View Architecture](./architecture.md)   |
| **[⚙️ Configuration Guide](./configuration.md)** | Setup, configuration options, and environment variables              | [View Configuration](./configuration.md) |
| **[🎨 Examples Guide](./examples.md)**           | Real-world usage examples and implementation patterns                | [View Examples](./examples.md)           |

### 🎯 **Quick Reference**

#### **Authentication Methods**

```typescript
// Session-based (web apps)
vault.auth.login(credentials);

// JWT-based (API services)
vault.auth.validate();

// Token management
vault.auth.logout();
```

#### **Secrets Operations**

```typescript
// CRUD operations
vault.secrets.create(secret);
vault.secrets.list(filter);
vault.secrets.getValue(id);
vault.secrets.update(id, updates);
vault.secrets.delete(id);
```

#### **TOTP Management**

```typescript
// Generate and verify
vault.totp.generate(config);
vault.totp.getCode(id);
vault.totp.verify(id, code);
```

#### **System Operations**

```typescript
// Health and status
vault.system.health();
vault.system.version();
vault.system.status();
```

---

## 🛠️ Development

### 📋 **Prerequisites**

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0 or higher
- **pnpm** 9.0.0 or higher (recommended)

### 🔧 **Development Setup**

```bash
# Clone repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/node

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### 📝 **Code Quality**

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm typecheck
```

### 🧪 **Testing**

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## 📊 SDK Architecture

### 🏗️ **Modular Design**

```
Aether Vault Node.js SDK
├── 📁 Core Infrastructure
│   ├── HTTP Client (fetch/isomorphic)
│   ├── Configuration Management
│   ├── Error Handling & Types
│   └── Authentication Layer
├── 📁 Domain Clients
│   ├── Authentication (auth.*)
│   ├── Secrets Management (secrets.*)
│   ├── TOTP Operations (totp.*)
│   ├── Identity Management (identity.*)
│   ├── Audit Logging (audit.*)
│   ├── Policy Management (policies.*)
│   └── System Operations (system.*)
└── 📁 Type Definitions
    ├── Core API Types
    ├── Domain-Specific Types
    └── Error Types
```

### 🔄 **Request Flow**

```
Client Application
        ↓
SDK Method Call
        ↓
Domain Client
        ↓
HTTP Client
        ↓
Aether Vault API
        ↓
Response Processing
        ↓
Typed Response
```

---

## 🔐 Security Features

### 🛡️ **Built-in Security**

- **Secure Token Management** - Automatic token refresh and storage
- **Type-Safe Operations** - Compile-time error prevention
- **Input Validation** - Comprehensive request validation
- **HTTPS Support** - Secure communication with API endpoints
- **Rate Limiting Awareness** - Respects server rate limits

### 🔑 **Authentication Options**

```typescript
// Session-based (recommended for web apps)
{ type: "session" }

// JWT-based (recommended for API services)
{ type: "jwt", token: "jwt-token", autoRefresh: true }

// Bearer token-based
{ type: "bearer", token: "bearer-token" }

// No authentication (for public endpoints)
{ type: "none" }
```

---

## 📈 Performance & Optimization

### ⚡ **Performance Features**

- **Connection Pooling** - Efficient HTTP connection reuse
- **Request Caching** - Intelligent caching for repeated requests
- **Batch Operations** - Support for bulk operations
- **Lazy Loading** - On-demand type and module loading
- **Memory Efficiency** - Optimized memory usage patterns

### 📊 **Monitoring & Debugging**

```typescript
// Enable debug mode
const vault = createVaultClient({
  baseURL: "http://localhost:8080",
  debug: true, // Enables request/response logging
});

// Monitor performance
vault.system.metrics().then((metrics) => {
  console.log("System metrics:", metrics);
});
```

---

## 🌍 Environment Support

### 🔄 **Multi-Environment**

- **Development** - Local development with debugging
- **Staging** - Pre-production testing environment
- **Production** - Optimized for production use
- **Appliance** - On-premises deployment support

### ⚙️ **Configuration Sources**

```typescript
// 1. Configuration file (vault.config.ts)
// 2. Environment variables
// 3. Runtime configuration
// 4. Default values
```

---

## 🤝 Contributing

### 🎯 **How to Contribute**

1. **Fork the repository** and create a feature branch
2. **Check the issues** for tasks that need help
3. **Join discussions** about architecture and features
4. **Follow our guidelines** and commit standards
5. **Submit a pull request** with clear description

### 📋 **Areas Needing Help**

- **Core SDK Development** - API clients and HTTP layer
- **TypeScript Types** - Type definitions and interfaces
- **Documentation** - API docs and examples
- **Testing** - Unit tests and integration tests
- **Developer Experience** - Debugging and tooling

### 🛠️ **Development Guidelines**

- **TypeScript Strict Mode** - All code must pass strict type checking
- **Component Structure** - Follow established patterns
- **API Design** - RESTful endpoints with proper HTTP methods
- **Error Handling** - Comprehensive error handling and logging
- **Security First** - Validate all inputs and implement proper auth

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](.)** - Comprehensive guides and API docs
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - General questions and ideas
- 📧 **Email** - support@skygenesisenterprise.com

### 🐛 **Reporting Issues**

When reporting bugs, please include:

- **Clear description** of the problem
- **Steps to reproduce**
- **Environment information** - Node.js version, TypeScript version, OS
- **Error logs** or screenshots
- **Expected vs actual behavior**
- **SDK version** being used

---

## 📊 Project Status

### ✅ **Current Status**

| Component               | Status     | Technology                | Features             |
| ----------------------- | ---------- | ------------------------- | -------------------- |
| **Core SDK**            | ✅ Working | TypeScript + Native Fetch | Complete HTTP client |
| **Authentication**      | ✅ Working | JWT + Session + Refresh   | Full auth support    |
| **Secrets Management**  | ✅ Working | CRUD + Encryption         | Complete operations  |
| **TOTP Support**        | ✅ Working | QR Codes + Verification   | Full TOTP workflow   |
| **Identity Management** | ✅ Working | Profiles + Sessions       | User operations      |
| **Audit Logging**       | ✅ Working | Full Audit + Export       | Compliance features  |
| **System Operations**   | ✅ Working | Health + Metrics          | Monitoring support   |
| **Type Safety**         | ✅ Working | Strict Mode + Types       | Complete TypeScript  |
| **Error Handling**      | ✅ Working | Typed Errors              | Comprehensive errors |
| **Documentation**       | ✅ Working | Complete Examples         | Full documentation   |

### 🔄 **In Development**

- **Advanced Caching** - Intelligent request caching
- **Performance Monitoring** - Built-in APM features
- **Enhanced Debugging** - Advanced debugging tools
- **Plugin System** - Extensible plugin architecture

---

## 🔗 Related Resources

### 📚 **Documentation**

- **[📖 Server Documentation](../server/)** - Aether Vault Server docs
- **[🚀 API Documentation](../server/api.md)** - Complete REST API reference
- **[🏗️ Architecture Guide](../server/architecture.md)** - System architecture

### 🛠️ **Development**

- **[GitHub Repository](https://github.com/skygenesisenterprise/aether-vault)** - Source code and issues
- **[Package on NPM](https://www.npmjs.com/package/aether-vault)** - Package information
- **[Type Definitions](https://github.com/skygenesisenterprise/aether-vault/tree/main/package/node/src/types)** - Complete type reference

### 🌐 **Community**

- **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - Community discussions
- **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports and feature requests
- **[Sky Genesis Enterprise](https://skygenesisenterprise.com)** - Company website

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../../../LICENSE) file for details.

---

<div align="center">

### 🚀 **Start Building with the Aether Vault Node.js SDK Today!**

[📖 Full Documentation](.) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Get Help](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Enterprise-Grade Secrets Management SDK for Modern Applications**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

</div>
