<div align="center">

# 🔒 Aether Vault Docker Image

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.25.5-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)](https://www.docker.com/) [![Vault](https://img.shields.io/badge/Vault-Compatible-green?style=for-the-badge&logo=hashicorp)](https://www.vaultproject.io/)

**🚀 Secure Execution Runtime for Aether Vault - Zero Environment Variables Architecture**

A lightweight Go runtime that eliminates environment variable management by dynamically injecting configuration from Aether Vault. Built as an independent alternative to existing secret management solutions.

[🚀 Quick Start](#-quick-start) • [📋 What's New](#-whats-new) • [📊 Current Status](#-current-status) • [🛠️ Tech Stack](#️-tech-stack) • [🔐 Security](#-security) • [📁 Architecture](#-architecture) • [🤝 Contributing](#-contributing)

[![GitHub stars](https://img.shields.io/github/stars/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/stargazers) [![GitHub forks](https://img.shields.io/github/forks/skygenesisenterprise/aether-vault?style=social)](https://github.com/skygenesisenterprise/aether-vault/network) [![GitHub issues](https://img.shields.io/github/issues/github/skygenesisenterprise/aether-vault)](https://github.com/skygenesisenterprise/aether-vault/issues)

</div>

---

## 🌟 What is Aether Vault Runtime?

**Aether Vault Runtime** is a secure execution environment that completely removes the need for developers to manage environment variables. It dynamically discovers, authenticates with, and retrieves configuration from Aether Vault, then injects it into applications before execution.

### 🎯 Our Philosophy: "Zero Env"

❌ **No .env files**  
❌ **No environment: blocks**  
❌ **No secrets in Git**  
✅ **Vault is the single source of truth**

### 🚀 Key Features

- **🔒 Zero-Trust Architecture** - No static secrets, everything retrieved dynamically
- **⚡ Native Go Implementation** - No HashiCorp/Bitwarden dependencies, pure HTTP client
- **🐳 Docker-Ready** - Multi-stage builds with distroless final images
- **🔄 Automatic Token Management** - Token renewal and revocation handled automatically
- **📊 Comprehensive Auditing** - All secret accesses logged to Vault
- **🏗️ Kubernetes-Native** - Automatic context discovery in K8s environments
- **🛡️ Security-First** - No secrets written to disk, no secrets in logs

---

## 🆕 What's New - v1.0.0

### 🎯 **Core Runtime Features**

#### 🔒 **Independent Vault Client** (NEW)

- ✅ **Pure HTTP Implementation** - No external Vault SDK dependencies
- ✅ **Native Go Client** - Custom-built HTTP client for Vault API
- ✅ **Authentication Methods** - Token, Kubernetes, AppRole support
- ✅ **Automatic Health Checks** - Vault connectivity validation

#### 🚀 **Zero-Env Injection System** (NEW)

- ✅ **Dynamic Environment Building** - Runtime environment variable construction
- ✅ **Smart Path Resolution** - Intelligent Vault path discovery
- ✅ **Context-Aware Injection** - Kubernetes and Docker context detection
- ✅ **Security Validation** - Environment variable name validation

#### 🏗️ **Production-Ready Architecture** (NEW)

- ✅ **Multi-Stage Docker Builds** - Static compilation with distroless images
- ✅ **Signal Handling** - Proper process lifecycle management
- ✅ **Graceful Shutdown** - Clean token revocation and cleanup
- ✅ **Process Supervision** - Restart policies and health monitoring

---

## 📊 Current Status

> **✅ Production Ready**: Complete runtime implementation with comprehensive security features.

### ✅ **Currently Implemented**

#### 🔒 **Core Runtime Engine**

- ✅ **Bootstrap System** - Secure Vault connection and authentication
- ✅ **Context Discovery** - Automatic service/environment detection
- ✅ **Configuration Resolution** - Multi-path Vault secret retrieval
- ✅ **Environment Injection** - Secure variable injection before execution
- ✅ **Process Management** - Complete lifecycle control and supervision

#### 🛡️ **Security Features**

- ✅ **No External Dependencies** - Pure Go implementation without Vault SDKs
- ✅ **Token Management** - Automatic renewal and revocation
- ✅ **Audit Logging** - Comprehensive access logging to Vault
- ✅ **Memory-Only Secrets** - No secrets written to disk
- ✅ **Encrypted Communication** - All Vault communications over HTTPS

#### 🐳 **Deployment Infrastructure**

- ✅ **Multi-Stage Dockerfile** - Static Go compilation with distroless final image
- ✅ **Kubernetes Integration** - Automatic K8s context discovery
- ✅ **Docker Compose Ready** - Simple deployment configurations
- ✅ **Production Optimization** - Minimal image size (~8MB)

### 🔄 **Enhanced Features**

- **Advanced Authentication** - Kubernetes auth method, AppRole support
- **Configuration Validation** - Secret presence and format validation
- **Performance Monitoring** - Runtime metrics and health checks
- **Enhanced Error Handling** - Comprehensive error reporting and recovery

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.25.5 or higher (for development)
- **Docker** (for deployment)
- **Aether Vault** instance (for secret management)
- **Vault Token** with appropriate permissions

### 🔧 Installation & Setup

1. **Build the Docker image**

   ```bash
   git clone https://github.com/skygenesisenterprise/aether-vault.git
   cd aether-vault/package/docker
   docker build -t skygenesisenterprise/aether-vault:latest .
   ```

2. **Run with Docker Compose**

   ```yaml
   version: "3.8"
   services:
     app:
       image: skygenesisenterprise/aether-vault:latest
       environment:
         AETHER_VAULT_ADDR: https://vault.company.com:8200
         AETHER_VAULT_TOKEN: ${VAULT_TOKEN}
         AETHER_SERVICE_NAME: my-app
         AETHER_ENVIRONMENT: production
         AETHER_ROLE: web
       command: ["node", "server.js"]
   ```

3. **Kubernetes Deployment**

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: my-app
   spec:
     containers:
       - name: app
         image: skygenesisenterprise/aether-vault:latest
         env:
           - name: AETHER_VAULT_ADDR
             value: "https://vault.company.com:8200"
           - name: AETHER_SERVICE_NAME
             value: "my-app"
         command: ["python", "app.py"]
   ```

### 🌐 Usage Examples

#### Basic Application Execution

```bash
docker run --rm \
  -e AETHER_VAULT_ADDR=https://vault:8200 \
  -e AETHER_VAULT_TOKEN=xxx \
  -e AETHER_SERVICE_NAME=my-app \
  skygenesisenterprise/aether-vault:latest \
  echo "Hello World"
```

#### Web Application

```dockerfile
FROM skygenesisenterprise/aether-vault:latest

# No environment variables needed here!
# The runtime handles everything automatically.
```

---

## 🛠️ Tech Stack

### 🔒 **Security Layer**

```
Pure Go Implementation (No External Dependencies)
├── 🌐 Custom HTTP Client (Vault API Communication)
├── 🔐 JWT Token Management (Automatic Renewal/Revocation)
├── 🛡️ Memory-Only Secret Storage (No Disk Writing)
├── 📊 Comprehensive Auditing (Vault Integration)
└── 🔒 TLS Encryption (All Communications)
```

### ⚙️ **Runtime Engine**

```
Go 1.25.5 + Static Compilation
├── 🚀 Bootstrap System (Secure Vault Connection)
├── 🔍 Context Discovery (Service/Environment Detection)
├── 📋 Configuration Resolution (Multi-Path Retrieval)
├── 💉 Environment Injection (Dynamic Variable Building)
├── 🏃 Process Management (Lifecycle Control)
└── 📊 Health Monitoring (Runtime Metrics)
```

### 🐳 **Deployment Layer**

```
Multi-Stage Docker + Distroless
├── 🔨 Build Stage (Go 1.25.5 + Static Compilation)
├── 📦 Runtime Stage (Scratch/Distroless Image)
├── 🚀 Minimal Footprint (~8MB Final Image)
├── 🔒 Security Hardened (No Shell, No Debug Tools)
└── 📡 Production Ready (Signal Handling, Graceful Shutdown)
```

---

## 🔐 Security Architecture

### 🎯 **Zero-Trust Design**

The runtime follows a zero-trust security model:

- **No Static Secrets** - All secrets retrieved dynamically from Vault
- **Short-Lived Tokens** - Automatic token renewal with minimal TTL
- **Memory-Only Storage** - Secrets never written to disk
- **Comprehensive Auditing** - All accesses logged to Vault audit trail
- **Automatic Cleanup** - Token revocation on process termination

### 🔄 **Security Flow**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Container     │    │   Aether Vault   │    │   Application   │
│   Startup       │◄──►│   Authentication │◄──►│   Execution     │
│                 │    │   & Secrets      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   Context Discovery        Token Management        Environment
   Service Detection         Automatic Renewal       Injection
   Environment Resolution    Secure Communication    Process Launch
```

### 🛡️ **Security Guarantees**

- **✅ No Secret Persistence** - Secrets never written to filesystem
- **✅ No Secret Logging** - Runtime logs contain no secret values
- **✅ Encrypted Communication** - All Vault communications over TLS
- **✅ Token Isolation** - Short-lived tokens with automatic renewal
- **✅ Audit Trail** - Complete access logging to Vault audit backend
- **✅ Graceful Shutdown** - Automatic token revocation on termination

---

## 📁 Architecture

### 🏗️ **Runtime Structure**

```
package/docker/
├── cmd/
│   └── aether-runtime/
│       └── main.go              # Runtime entry point
├── internal/
│   ├── vault/                   # 🔒 Custom Vault Client
│   │   └── client.go           # Pure HTTP implementation
│   ├── auth/                    # 🛡️ Authentication Management
│   │   └── client.go           # Token handling & auth methods
│   ├── config/                  # 📋 Configuration Resolution
│   │   └── resolver.go         # Context discovery & path building
│   ├── injector/                # 💉 Environment Injection
│   │   └── injector.go         # Dynamic environment building
│   ├── runtime/                 # 🏃 Process Management
│   │   └── manager.go          # Lifecycle & supervision
│   └── audit/                   # 📊 Security Auditing
│       └── logger.go           # Vault audit integration
├── Dockerfile                   # 🐳 Multi-stage build
├── go.mod                       # 📦 Go modules
└── README.md                    # 📚 Documentation
```

### 🔄 **Execution Flow**

```
1. Bootstrap Phase
   ├── Vault Connection (Health Check)
   ├── Authentication (Token/AppRole/K8s)
   └── Context Validation

2. Discovery Phase
   ├── Service Detection (AETHER_SERVICE_NAME)
   ├── Environment Resolution (AETHER_ENVIRONMENT)
   ├── Role Identification (AETHER_ROLE)
   └── Kubernetes Context (Auto-detection)

3. Resolution Phase
   ├── Path Building (Service/Environment/Role)
   ├── Secret Retrieval (Multi-path lookup)
   ├── Configuration Loading (Config + Secrets)
   └── Validation (Required secrets present)

4. Injection Phase
   ├── Environment Building (AETHER_* prefixing)
   ├── Variable Validation (Name format checking)
   ├── Metadata Addition (Runtime information)
   └── Security Verification (No secret logging)

5. Execution Phase
   ├── Process Launch (syscall.Exec)
   ├── Signal Handling (Forwarding)
   ├── Health Monitoring (Process supervision)
   └── Graceful Shutdown (Token revocation)

6. Audit Phase
   ├── Access Logging (Vault audit trail)
   ├── Event Tracking (Security events)
   ├── Metrics Collection (Runtime stats)
   └── Cleanup Completion (Resource release)
```

---

## 📊 Vault Integration

### 🗂️ **Expected Vault Structure**

```
aether/
├── config/
│   ├── production/
│   │   ├── my-app              # Service-specific configuration
│   │   └── global              # Environment-wide settings
│   ├── development/
│   │   └── my-app
│   └── staging/
├── secrets/
│   ├── production/
│   │   ├── my-app/
│   │   │   ├── web             # Role-specific secrets
│   │   │   ├── api             # API service secrets
│   │   │   └── default         # Default service secrets
│   │   └── global              # Environment-wide secrets
│   └── development/
└── k8s/
    ├── namespace/
    │   └── my-app/
    │       └── web             # Kubernetes-specific secrets
    └── audit/
        ├── production/
        │   └── my-app          # Runtime audit logs
        └── development/
```

### 🔧 **Environment Variables**

#### Required Variables

| Variable              | Description          | Example                          |
| --------------------- | -------------------- | -------------------------------- |
| `AETHER_VAULT_ADDR`   | Vault server URL     | `https://vault.company.com:8200` |
| `AETHER_VAULT_TOKEN`  | Authentication token | `s.xxxxxxxx`                     |
| `AETHER_SERVICE_NAME` | Service identifier   | `my-app`                         |

#### Optional Variables

| Variable               | Description      | Default       |
| ---------------------- | ---------------- | ------------- |
| `AETHER_ENVIRONMENT`   | Environment name | `development` |
| `AETHER_ROLE`          | Service role     | `default`     |
| `KUBERNETES_NAMESPACE` | K8s namespace    | Auto-detected |
| `KUBERNETES_POD_NAME`  | Pod name         | Auto-detected |

### 💉 **Injected Environment Variables**

#### Secrets (Prefix: `AETHER_SECRET_`)

```bash
AETHER_SECRET_DATABASE_PASSWORD=xxx
AETHER_SECRET_API_KEY=xxx
AETHER_SECRET_JWT_SECRET=xxx
```

#### Configuration (Prefix: `AETHER_CONFIG_`)

```bash
AETHER_CONFIG_DATABASE_HOST=postgres.prod
AETHER_CONFIG_REDIS_URL=redis://redis.prod:6379
AETHER_CONFIG_LOG_LEVEL=info
```

#### Metadata (Prefix: `AETHER_`)

```bash
AETHER_VAULT_INJECTED=true
AETHER_VAULT_SECRETS_COUNT=3
AETHER_VAULT_CONFIG_COUNT=5
AETHER_VAULT_LEASE_ID=xxx
AETHER_VAULT_LEASE_DURATION=3600
```

---

## 🚀 Deployment Examples

### 🐳 **Docker Compose**

```yaml
version: "3.8"
services:
  web-app:
    image: skygenesisenterprise/aether-vault:latest
    environment:
      AETHER_VAULT_ADDR: https://vault.company.com:8200
      AETHER_VAULT_TOKEN: ${VAULT_TOKEN}
      AETHER_SERVICE_NAME: web-app
      AETHER_ENVIRONMENT: production
      AETHER_ROLE: web
    command: ["node", "server.js"]
    depends_on:
      - vault

  api-service:
    image: skygenesisenterprise/aether-vault:latest
    environment:
      AETHER_VAULT_ADDR: https://vault.company.com:8200
      AETHER_VAULT_TOKEN: ${VAULT_TOKEN}
      AETHER_SERVICE_NAME: api-service
      AETHER_ENVIRONMENT: production
      AETHER_ROLE: api
    command: ["python", "api.py"]
    depends_on:
      - vault

  vault:
    image: vault:1.15.0
    environment:
      VAULT_ADDR: https://vault.company.com:8200
      VAULT_TOKEN: ${VAULT_ROOT_TOKEN}
    ports:
      - "8200:8200"
```

### ☸️ **Kubernetes Deployment**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
        - name: app
          image: skygenesisenterprise/aether-vault:latest
          env:
            - name: AETHER_VAULT_ADDR
              value: "https://vault.company.com:8200"
            - name: AETHER_VAULT_TOKEN
              valueFrom:
                secretKeyRef:
                  name: vault-token
                  key: token
            - name: AETHER_SERVICE_NAME
              value: "web-app"
            - name: AETHER_ENVIRONMENT
              value: "production"
            - name: AETHER_ROLE
              value: "web"
          command: ["npm", "start"]
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
```

### 🔧 **CI/CD Integration**

#### GitHub Actions

```yaml
name: Deploy with Aether Runtime
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Tests
        run: |
          docker run --rm \
            -e AETHER_VAULT_ADDR=${{ secrets.VAULT_ADDR }} \
            -e AETHER_VAULT_TOKEN=${{ secrets.VAULT_TOKEN }} \
            -e AETHER_SERVICE_NAME=test-app \
            -e AETHER_ENVIRONMENT=ci \
            skygenesisenterprise/aether-vault:latest \
            npm test

      - name: Deploy to Production
        run: |
          docker build -t my-app:latest .
          docker push my-app:latest
```

---

## 📊 Monitoring & Auditing

### 📈 **Runtime Metrics**

The runtime provides comprehensive monitoring:

- **Startup Time** - Time to bootstrap and inject
- **Secret Retrieval** - Count and size of secrets retrieved
- **Token Operations** - Renewals and revocations
- **Process Health** - Application lifecycle events
- **Error Rates** - Authentication and resolution failures

### 📊 **Audit Events**

All runtime actions are audited to Vault:

```json
{
  "timestamp": 1704067200,
  "event_type": "secret_access",
  "service": "web-app",
  "environment": "production",
  "role": "web",
  "namespace": "default",
  "pod_name": "web-app-7d4f8c9b-xyz",
  "secrets_count": 3,
  "config_count": 5,
  "success": true
}
```

### 🔍 **Health Checks**

```bash
# Runtime health
docker exec <container> /aether-runtime --health

# Vault connectivity
curl -X GET "https://vault:8200/v1/sys/health"

# Environment verification
env | grep AETHER_
```

---

## 🤝 Contributing

We're looking for contributors to help enhance this secure runtime! Whether you're experienced with Go, security, Vault, or containerization, there's a place for you.

### 🎯 **How to Get Started**

1. **Fork the repository** and create a feature branch
2. **Read the architecture** and understand the security model
3. **Choose an area** - Core runtime, security, deployment, or documentation
4. **Start small** - Bug fixes, tests, or minor features
5. **Follow security guidelines** and Go best practices

### 🏗️ **Areas Needing Help**

- **Go Runtime Development** - Core engine, process management, security
- **Vault Integration** - Advanced auth methods, API enhancements
- **Security Specialists** - Token management, audit logging, validation
- **DevOps Engineers** - Kubernetes deployment, CI/CD integration
- **Documentation** - Security guides, deployment tutorials, API docs
- **Testing** - Unit tests, integration tests, security testing

### 📝 **Development Guidelines**

- **Security First** - All changes must maintain security guarantees
- **No External Dependencies** - Keep the runtime independent
- **Go Best Practices** - Follow Go conventions and idioms
- **Comprehensive Testing** - Test all security paths and error conditions
- **Clear Documentation** - Document security implications and usage

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](../../docs/)** - Comprehensive guides
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - Questions
- 📧 **Email** - security@aether-vault.io

### 🐛 **Security Issues**

For security vulnerabilities, please email: security@aether-vault.io

---

## 📊 Project Status

| Component                  | Status      | Technology   | Security   | Notes                    |
| -------------------------- | ----------- | ------------ | ---------- | ------------------------ |
| **Runtime Engine**         | ✅ Working  | Go 1.25.5    | **High**   | Complete implementation  |
| **Vault Client**           | ✅ Working  | Pure HTTP    | **High**   | No external dependencies |
| **Authentication**         | ✅ Working  | JWT/Tokens   | **High**   | Multiple auth methods    |
| **Environment Injection**  | ✅ Working  | Dynamic      | **High**   | Zero-env architecture    |
| **Process Management**     | ✅ Working  | syscall.Exec | **High**   | Complete lifecycle       |
| **Docker Image**           | ✅ Working  | Multi-stage  | **High**   | Distroless final image   |
| **Security Auditing**      | ✅ Working  | Vault API    | **High**   | Comprehensive logging    |
| **Kubernetes Integration** | ✅ Working  | Auto-detect  | **High**   | Context discovery        |
| **Token Management**       | ✅ Working  | Auto-renew   | **High**   | Graceful handling        |
| **Error Handling**         | 🔄 Enhanced | Go idioms    | **Medium** | Improvements planned     |

---

## 🏆 Sponsors & Partners

**Development led by [Sky Genesis Enterprise](https://skygenesisenterprise.com)**

Building the future of secure application deployment with zero-trust architecture.

[🤝 Become a Sponsor](https://github.com/sponsors/skygenesisenterprise)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../../LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Sky Genesis Enterprise

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
```

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and security vision
- **Go Team** - Secure and performant programming language
- **Vault Project** - Inspiration for secret management architecture
- **Docker Team** - Container platform and security features
- **Kubernetes Team** - Orchestration platform and security primitives
- **Open Source Community** - Security tools and best practices

---

<div align="center">

### 🔒 **Join Us in Building the Future of Secure Application Deployment!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Security Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🚀 Zero Environment Variables - Maximum Security - Complete Audit Trail**

**Made with 🔒 by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) security team**

_Building secure runtime environments with zero-trust architecture_

</div>
