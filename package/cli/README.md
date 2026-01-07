<div align="center">

# 🔐 Aether Vault CLI

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.25+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Cobra](https://img.shields.io/badge/Cobra-1.8+-lightgrey?style=for-the-badge&logo=go)](https://github.com/spf13/cobra) [![Viper](https://img.shields.io/badge/Viper-1.16+-green?style=for-the-badge&logo=go)](https://github.com/spf13/viper) [![DevOps](https://img.shields.io/badge/DevOps-Ready-orange?style=for-the-badge&logo=devops)](https://www.devops.com/)

**🚀 Modern DevOps & Security CLI - Enterprise-Grade Secret Management with Extensible Architecture**

A next-generation command-line interface for Aether Vault that provides **comprehensive secret management**, **DevOps automation**, and **security workflows**. Built with Go 1.25+, featuring **modular architecture**, **extensible design**, and **enterprise-ready capabilities**.

[🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🛠️ Architecture](#️-architecture) • [📚 Commands](#-commands) • [🔧 Development](#-development) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-vault)](https://github.com/skygenesisenterprise/aether-vault/issues)

</div>

---

## 🌟 What is Aether Vault CLI?

**Aether Vault CLI** is a comprehensive command-line interface designed for **DevOps and security workflows**. It serves as the primary tool for interacting with Aether Vault both **locally** (offline) and in **cloud environments**, with a focus on **modularity**, **extensibility**, and **enterprise-grade security**.

### 🎯 Our Vision

- **🚀 Modular Architecture** - Clean separation between commands, configuration, and business logic
- **📦 Extensible Design** - Plugin-ready architecture for future modules (docker, git, db, etc.)
- **🔐 Security-First** - Secure defaults, proper credential handling, and encryption
- **⚡ DevOps Ready** - Built for automation, CI/CD, and enterprise workflows
- **🎨 Professional UX** - Clean, intuitive interface with comprehensive help system
- **🏗️ Enterprise Grade** - Scalable, maintainable, and production-ready

---

## 🆕 Key Features

### 🎯 **Core CLI Capabilities**

- ✅ **Modular Command Structure** - Clean Cobra-based architecture with subcommands
- ✅ **Dual Mode Operation** - Local (offline) and cloud (connected) modes
- ✅ **Professional Output** - Table, JSON, YAML formatting with color support
- ✅ **Configuration Management** - YAML-based config with environment variable overrides
- ✅ **Authentication System** - OAuth and token-based authentication (stub)
- ✅ **Status Monitoring** - Comprehensive status and runtime information
- ✅ **Help System** - Built-in help with examples and workflows

### 🏗️ **Architecture Highlights**

- ✅ **Clean Interfaces** - Well-defined interfaces for clients and contexts
- ✅ **Type Safety** - Comprehensive type definitions and validation
- ✅ **Error Handling** - Structured errors with actionable messages
- ✅ **Testing Ready** - Designed for comprehensive unit and integration testing
- ✅ **Performance Optimized** - Efficient startup and operation
- ✅ **Cross-Platform** - Linux, macOS, and Windows support

### 🔧 **Development Features**

- ✅ **Go Best Practices** - Follows Go conventions and standards
- ✅ **Comprehensive Documentation** - Inline docs and README guides
- ✅ **Build Automation** - Makefile with build, test, and install targets
- ✅ **Dependency Management** - Go modules with proper versioning
- ✅ **Code Quality** - Linting, formatting, and validation tools

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.25.0 or higher
- **Make** (for command shortcuts - included with most systems)
- **Git** (for cloning and version control)

### 🔧 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/skygenesisenterprise/aether-vault.git
   cd aether-vault/package/cli
   ```

2. **Build and install**

   ```bash
   # Build the CLI
   make build

   # Install to system PATH
   make install
   ```

3. **Initialize local environment**

   ```bash
   # Initialize local Vault environment
   vault init

   # Check status
   vault status
   ```

### 🎯 **Basic Usage**

```bash
# Show help and available commands
vault --help

# Display version information
vault version

# Initialize local environment
vault init

# Check current status
vault status

# Connect to cloud (future feature)
vault login

# Get help for specific command
vault help init
```

---

## 📚 Command Reference

### 🔐 **Core Commands**

#### `vault` - Root Command

```bash
vault
```

Display welcome banner, available commands, and current status.

#### `vault version` - Version Information

```bash
vault version [--format json|yaml|table]
```

Display CLI version, build information, and runtime details.

**Flags:**

- `--format`: Output format (json, yaml, table)

#### `vault init` - Initialize Environment

```bash
vault init [--path ~/.aether/vault] [--force]
```

Initialize local Vault environment with configuration and encryption keys.

**Flags:**

- `--path`: Custom path for Vault directory
- `--force`: Force reinitialization if already exists

#### `vault login` - Authentication

```bash
vault login [--method oauth|token] [--url https://cloud.aethervault.com]
```

Authenticate with Aether Vault cloud services (stub implementation).

**Flags:**

- `--method`: Authentication method (oauth, token)
- `--token`: API token for token-based authentication
- `--url`: Aether Vault cloud URL

#### `vault status` - Status Information

```bash
vault status [--verbose] [--format json|yaml|table]
```

Display comprehensive status information including mode, configuration, and runtime.

**Flags:**

- `--verbose`: Show detailed status information
- `--format`: Output format (json, yaml, table)

#### `vault help` - Help System

```bash
vault help [command]
```

Display help for commands with examples and workflows.

### 🎨 **Output Formats**

All commands support multiple output formats:

```bash
# Table format (default)
vault status

# JSON format for automation
vault status --format json

# YAML format for configuration
vault status --format yaml
```

---

## 🛠️ Architecture

### 🏗️ **Package Structure**

```
package/cli/
├── cmd/                    # Cobra command definitions
│   ├── root.go            # Root command and main entry point
│   ├── version.go         # Version command
│   ├── init.go            # Initialization command
│   ├── auth.go            # Login/connect commands
│   ├── status.go          # Status command
│   └── help.go            # Help system
├── internal/              # Internal packages (non-exportable)
│   ├── config/            # Configuration management
│   │   ├── manager.go     # Config manager interface
│   │   ├── file.go        # File-based configuration
│   │   └── defaults.go    # Default configurations
│   ├── context/           # Execution context
│   │   ├── context.go     # Main context struct
│   │   ├── local.go       # Local execution context
│   │   └── cloud.go       # Cloud execution context
│   ├── ui/                # User interface utilities
│   │   ├── formatter.go   # Output formatting (JSON, YAML, table)
│   │   ├── spinner.go     # Loading indicators
│   │   ├── color.go       # Color management
│   │   └── banner.go      # ASCII art banners
│   ├── runtime/           # Runtime detection
│   │   ├── detector.go    # Environment detection
│   │   ├── docker.go      # Docker detection
│   │   └── platform.go    # Platform-specific info
│   └── client/            # Vault client (stub/interface)
│       ├── interface.go   # Client interface definition
│       ├── local.go       # Local client implementation
│       └── cloud.go       # Cloud client implementation (stub)
├── pkg/                   # Public packages (exportable)
│   └── types/             # Shared types and interfaces
│       ├── config.go      # Configuration types
│       ├── context.go     # Context types
│       └── client.go      # Client types
├── main.go                # CLI entry point
├── go.mod                 # Go module definition
├── Makefile               # Build automation
└── README.md              # CLI documentation
```

### 🔄 **Component Interaction**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Commands  │    │  Execution       │    │  Configuration  │
│   (Cobra)       │◄──►│  Context         │◄──►│  Manager        │
│  Port N/A       │    │  (Local/Cloud)   │    │  (YAML/Env)     │
│  Go 1.25+       │    │  Go Interfaces   │    │  Viper          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
      User Interaction        Mode Management        Settings Storage
      Flag Validation         Session State         Environment Overrides
      Error Handling          Runtime Detection     Default Values
            │                       │
            ▼                       ▼
     ┌─────────────────┐    ┌──────────────────┐
     │  UI Components  │    │  Vault Client    │
     │  (Formatting)   │    │  (Local/Cloud)   │
     │  Tables/JSON    │    │  Interface       │
     │  Colors/Help    │    │  Stub/Impl       │
     └─────────────────┘    └──────────────────┘
```

---

## 🔧 Development

### 🎯 **Build Commands**

The project uses a comprehensive **Makefile** for streamlined development:

```bash
# 🚀 Building & Installation
make build              # Build CLI binary
make install            # Install to system PATH
make clean              # Clean build artifacts

# 🔧 Development & Testing
make test               # Run unit tests
make lint               # Run linters
make fmt                # Format code
make vet                # Run go vet

# 📦 Dependencies
make deps               # Download dependencies
make tidy               # Clean dependencies

# 🚀 Release
make release            # Build release binaries
make cross              # Cross-platform builds

# 📋 Information
make version            # Show version information
make help               # Show all commands
```

### 📋 **Development Workflow**

```bash
# New developer setup
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/cli
make deps
make build

# Daily development
make build              # Build changes
make test               # Run tests
make lint               # Check code quality
make fmt                # Format code

# Testing commands
./build/vault version   # Test CLI
./build/vault init      # Test initialization
./build/vault status    # Test status

# Before committing
make fmt                # Format code
make lint               # Check code quality
make test               # Run tests
```

### 🎯 **Code Standards**

- **Go Conventions** - Follow standard Go formatting and practices
- **Cobra Best Practices** - Use proper command structure and validation
- **Error Handling** - Comprehensive error handling with context
- **Documentation** - Complete inline documentation and examples
- **Testing** - Unit tests for all components
- **Type Safety** - Strong typing with proper interfaces

---

## 🔮 Future Roadmap

### 🚀 **Phase 1: Core Enhancement (Current)**

- ✅ **Basic CLI Structure** - Commands, configuration, help system
- ✅ **Local Mode** - Complete offline operation
- 🔄 **Authentication Stubs** - OAuth and token authentication flow
- 📋 **Output Formatting** - JSON, YAML, table implementations
- 📋 **Error Handling** - Comprehensive error system

### 📦 **Phase 2: Module System (Next)**

- 📋 **Plugin Interface** - Dynamic module loading
- 📋 **Docker Module** - Container secret management
- 📋 **Git Module** - Git credential helpers
- 📋 **Database Module** - DB credential rotation
- 📋 **Kubernetes Module** - K8s integration

### ☁️ **Phase 3: Cloud Integration (Future)**

- 📋 **Complete OAuth** - Full Aether Identity integration
- 📋 **API Client** - REST API client implementation
- 📋 **Sync Features** - Local/cloud synchronization
- 📋 **Enterprise Features** - SSO, audit logs, policies

### 🎨 **Phase 4: UX Enhancement (Future)**

- 📋 **Interactive Mode** - TUI with menus and wizards
- 📋 **Auto-completion** - Shell completion scripts
- 📋 **Progress Indicators** - Spinners and progress bars
- 📋 **Enhanced Help** - Contextual help and examples

---

## 🤝 Contributing

We're looking for contributors to help build this comprehensive DevOps CLI! Whether you're experienced with Go, CLI development, DevOps, security, or user experience design, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Check the issues** for tasks that need help
3. **Join discussions** about architecture and features
4. **Start small** - Documentation, tests, or minor features
5. **Follow our code standards** and commit guidelines

### 🏗️ **Areas Needing Help**

- **Go CLI Development** - Command implementation, Cobra expertise
- **DevOps Engineers** - Workflow integration, automation features
- **Security Specialists** - Authentication, encryption, best practices
- **UX Designers** - Command-line interface design and help systems
- **Module Developers** - Plugin system and module development
- **Documentation Writers** - Command docs, examples, tutorials
- **Test Engineers** - Unit tests, integration tests, test coverage

### 📝 **Contribution Process**

1. **Choose an area** - Core commands, modules, or documentation
2. **Read the architecture docs** - Understand the design patterns
3. **Create a branch** with a descriptive name
4. **Implement your changes** following Go best practices
5. **Test thoroughly** with `make test`
6. **Submit a pull request** with clear description
7. **Address feedback** from maintainers

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](ARCHITECTURE.md)** - Comprehensive architecture guide
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports and feature requests
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - General questions and ideas
- 📧 **Email** - support@skygenesisenterprise.com

### 🐛 **Reporting Issues**

When reporting bugs, please include:

- Clear description of the problem
- Steps to reproduce
- Environment information (Go version, OS, etc.)
- Error logs or screenshots
- Expected vs actual behavior
- Command used and flags

---

## 📊 Project Status

| Component             | Status     | Technology    | Notes                                |
| --------------------- | ---------- | ------------- | ------------------------------------ |
| **CLI Framework**     | ✅ Working | Cobra + Go    | Complete command structure           |
| **Configuration**     | ✅ Working | Viper + YAML  | File-based with env overrides        |
| **Local Mode**        | ✅ Working | Go Interfaces | Complete offline operation           |
| **Cloud Mode**        | 🔄 Stub    | Go Interfaces | Prepared for cloud integration       |
| **Authentication**    | 🔄 Stub    | OAuth/Token   | Flow prepared, implementation needed |
| **Output Formatting** | 🔄 Partial | Custom/JSON   | Table format working, others stub    |
| **Help System**       | ✅ Working | Custom        | Comprehensive help with examples     |
| **Error Handling**    | ✅ Working | Go Errors     | Structured errors with context       |
| **Build System**      | ✅ Working | Make + Go     | Complete build automation            |
| **Testing**           | 📋 Planned | Go Testing    | Unit and integration tests           |
| **Documentation**     | ✅ Working | Markdown      | Complete docs and examples           |

---

## 🏆 Sponsors & Partners

**Development led by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

We're looking for sponsors and partners to help accelerate development of this open-source DevOps CLI project.

[🤝 Become a Sponsor](https://github.com/sponsors/skygenesisenterprise)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Sky Genesis Enterprise

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and architecture
- **Go Community** - Excellent programming language and ecosystem
- **Cobra Team** - Powerful CLI framework for Go
- **Viper Team** - Configuration management library
- **DevOps Community** - Inspiration and best practices
- **Open Source Contributors** - Tools, libraries, and feedback

---

<div align="center">

### 🚀 **Join Us in Building the Future of DevOps Security!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Enterprise-Grade CLI with Extensible Architecture!**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building a comprehensive DevOps CLI for secret management and security workflows_

</div>
