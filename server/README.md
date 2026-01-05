<div align="center">

# 🚀 Aether Vault Server

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![Go](https://img.shields.io/badge/Go-1.21+-blue?style=for-the-badge&logo=go)](https://golang.org/) [![Gin](https://img.shields.io/badge/Gin-1.9+-lightgrey?style=for-the-badge&logo=go)](https://gin-gonic.com/) [![GORM](https://img.shields.io/badge/GORM-1.25+-green?style=for-the-badge&logo=go)](https://gorm.io/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

**🔥 Secure Vault Server Core - Enterprise-Grade Authentication & Identity Management**

A high-performance Go backend server providing comprehensive authentication, authorization, and vault management capabilities. Built with enterprise security best practices and modern Go architecture.

[🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🏗️ Architecture](#-architecture) • [📊 API Reference](#-api-reference) • [🛠️ Development](#️-development) • [🔧 Configuration](#-configuration)

[![Go Report](https://goreportcard.com/badge/github.com/skygenesisenterprise/aether-vault)](https://goreportcard.com/report/github.com/skygenesisenterprise/aether-vault) [![Coverage](https://img.shields.io/codecov/c/github/skygenesisenterprise/aether-vault?style=for-the-badge)](https://codecov.io/gh/skygenesisenterprise/aether-vault)

</div>

---

## 🌟 What is Aether Vault Server?

**Aether Vault Server** is the core backend component of the Aether Vault ecosystem, providing enterprise-grade security, authentication, and identity management services. It serves as the central authority for user authentication, secret management, and access control.

### 🎯 Core Mission

- **🔐 Enterprise Authentication** - JWT-based auth with TOTP, audit logging, and session management
- **🛡️ Security-First Design** - Rate limiting, input validation, comprehensive audit trails
- **⚡ High Performance** - Go-based concurrency with optimized database operations
- **🏗️ Modular Architecture** - Clean separation of concerns with controllers, services, and middleware
- **📊 Comprehensive Auditing** - Full audit logging for compliance and security monitoring
- **🔗 RESTful API** - Well-designed endpoints following REST principles
- **🗄️ Database Integration** - GORM with PostgreSQL for reliable data persistence

---

## 📋 Features

### 🔐 **Authentication & Authorization**

- ✅ **JWT Token Management** - Secure token generation, validation, and refresh
- ✅ **TOTP Support** - Time-based One-Time Password for 2FA
- ✅ **User Registration/Login** - Complete user lifecycle management
- ✅ **Password Security** - bcrypt hashing with secure random salts
- ✅ **Session Management** - Secure session handling and invalidation
- ✅ **Role-Based Access** - Configurable roles and permissions

### 🛡️ **Security & Compliance**

- ✅ **Rate Limiting** - Configurable rate limits per endpoint/user
- ✅ **Input Validation** - Comprehensive request validation and sanitization
- ✅ **Security Headers** - CORS, CSP, and other security headers
- ✅ **Audit Logging** - Complete audit trail for all operations
- ✅ **Secure Headers** - Security-focused HTTP headers middleware
- ✅ **IP Whitelisting** - Configurable IP access controls

### 🏗️ **Enterprise Features**

- ✅ **Identity Management** - User, role, and permission management
- ✅ **Secret Management** - Secure storage and retrieval of sensitive data
- ✅ **Policy Engine** - Configurable access policies and rules
- ✅ **System Monitoring** - Health checks and system metrics
- ✅ **Multi-tenancy** - Support for multiple organizations/tenants
- ✅ **Data Encryption** - Encryption at rest and in transit

### ⚡ **Performance & Reliability**

- ✅ **Gin Framework** - High-performance HTTP router and middleware
- ✅ **GORM Integration** - Efficient database operations with connection pooling
- ✅ **Concurrent Processing** - Goroutine-based request handling
- ✅ **Graceful Shutdown** - Proper cleanup and shutdown handling
- ✅ **Health Endpoints** - Comprehensive health and status monitoring
- ✅ **Error Handling** - Consistent error responses and logging

---

## 🏗️ Architecture

### 📁 **Project Structure**

```
server/src/
├── config/                 # 📋 Configuration Management
│   └── config.go           # Database, server, and security config
├── controllers/            # 🎮 HTTP Request Handlers
│   ├── auth.go            # Authentication endpoints
│   ├── user.go            # User management endpoints
│   ├── identity.go        # Identity and profile management
│   ├── secret.go          # Secret management endpoints
│   ├── totp.go            # TOTP/2FA endpoints
│   ├── audit.go           # Audit and logging endpoints
│   ├── system.go          # System health and metrics
│   └── policy.go          # Policy management endpoints
├── middleware/             # 🔧 HTTP Middleware Stack
│   ├── auth.go            # JWT authentication middleware
│   ├── security.go        # Security headers and validation
│   ├── ratelimit.go       # Rate limiting middleware
│   ├── audit.go           # Audit logging middleware
│   ├── user.go            # User context middleware
│   └── utils.go           # Utility middleware functions
├── model/                 # 📊 Data Models & DTOs
│   ├── user.go            # User model and structs
│   ├── secret.go          # Secret management models
│   ├── totp.go            # TOTP configuration models
│   ├── audit.go           # Audit log models
│   ├── policy.go          # Policy and rule models
│   └── dto.go             # Data Transfer Objects
├── routes/                # 🛣️ Route Definitions
│   └── routes.go          # API route configuration
├── services/              # 🔨 Business Logic Layer
│   ├── auth.go            # Authentication service logic
│   ├── user.go            # User management service
│   ├── identity.go        # Identity service logic
│   ├── secret.go          # Secret management service
│   ├── totp.go            # TOTP/2FA service logic
│   ├── audit.go           # Audit logging service
│   ├── policy.go          # Policy enforcement service
│   └── system.go          # System monitoring service
└── utils/                 # 🛠️ Utility Functions
    ├── crypto.go          # Cryptographic utilities
    └── validation.go      # Input validation helpers
```

### 🔄 **Request Flow Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───►│  Middleware │───►│ Controllers │───►│  Services   │
│   Request   │    │   Stack     │    │             │    │   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                    │   Security  │    │   Validation│    │  Business   │
                    │   Checks    │    │   & Auth    │    │   Logic     │
                    └─────────────┘    └─────────────┘    └─────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────┐
                                                  │   GORM      │
                                                  │  Database   │
                                                  │   Layer      │
                                                  └─────────────┘
```

### 🎯 **Layered Architecture Pattern**

```go
// Controller Layer (HTTP Handlers)
controllers/
├── auth.go              // Authentication HTTP endpoints
├── user.go              // User management HTTP endpoints
└── [other controllers]  // Feature-specific HTTP handlers

// Service Layer (Business Logic)
services/
├── auth.go              // Authentication business logic
├── user.go              // User management logic
└── [other services]     // Feature-specific business logic

// Model Layer (Data Structures)
model/
├── user.go              // User data models
├── secret.go            // Secret data models
└── [other models]       // Feature-specific data models
```

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Go** 1.21.0 or higher
- **PostgreSQL** 14.0 or higher
- **Make** (for command shortcuts)
- **Git** (for version control)

### 🔧 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/skygenesisenterprise/aether-vault.git
   cd aether-vault/server
   ```

2. **Install dependencies**

   ```bash
   go mod download
   go mod tidy
   ```

3. **Environment configuration**

   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit configuration
   nano .env
   ```

4. **Database setup**

   ```bash
   # Run database migrations
   go run main.go migrate

   # Seed development data (optional)
   go run main.go seed
   ```

5. **Start the server**

   ```bash
   # Development mode
   go run main.go

   # Or with Make
   make go-server
   ```

### 🌐 **Access Points**

Once running, you can access:

- **API Server**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)
- **API Documentation**: [http://localhost:8080/docs](http://localhost:8080/docs) (if enabled)

### ⚡ **Quick Commands**

```bash
# Development
go run main.go                    # Start development server
make go-server                    # Start with Make
make go-dev                       # Development mode with hot reload

# Database
make db-migrate                   # Run migrations
make db-seed                      # Seed development data
make db-reset                     # Reset database

# Building
make go-build                     # Build binary
make go-test                      # Run tests
make go-fmt                       # Format code
```

---

## 📊 API Reference

### 🔐 **Authentication Endpoints**

#### User Registration

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### User Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Token Refresh

```http
POST /api/v1/auth/refresh
Authorization: Bearer <refresh_token>
```

#### TOTP Setup

```http
POST /api/v1/auth/totp/setup
Authorization: Bearer <access_token>
```

### 👤 **User Management Endpoints**

#### Get Current User

```http
GET /api/v1/users/me
Authorization: Bearer <access_token>
```

#### Update User Profile

```http
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Change Password

```http
POST /api/v1/users/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "oldPassword",
  "new_password": "newPassword123"
}
```

### 🔒 **Secret Management Endpoints**

#### Create Secret

```http
POST /api/v1/secrets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "API Key",
  "value": "secret-value-123",
  "type": "api_key"
}
```

#### List Secrets

```http
GET /api/v1/secrets
Authorization: Bearer <access_token>
```

#### Get Secret

```http
GET /api/v1/secrets/{id}
Authorization: Bearer <access_token>
```

### 📋 **Audit & System Endpoints**

#### Get Audit Logs

```http
GET /api/v1/audit/logs
Authorization: Bearer <access_token>
```

#### System Health

```http
GET /api/v1/system/health
```

#### System Metrics

```http
GET /api/v1/system/metrics
Authorization: Bearer <admin_token>
```

---

## 🛠️ Development

### 🎯 **Development Commands**

```bash
# 🚀 Server Management
make go-server           # Start development server
make go-build            # Build production binary
make go-run              # Run with compiled binary
make go-dev              # Development with hot reload

# 📊 Database Operations
make db-migrate          # Run database migrations
make db-seed             # Seed development data
make db-studio           # Open database admin tool
make db-reset            # Reset database completely

# 🧪 Testing & Quality
make go-test             # Run all tests
make go-test-cover       # Run tests with coverage
make go-test-vet         # Run go vet static analysis
make go-fmt              # Format Go code
make go-lint             # Run linter
make go-mod-tidy         # Clean module dependencies

# 🔧 Build & Deploy
make go-build-linux      # Build for Linux
make go-build-darwin     # Build for macOS
make go-build-windows    # Build for Windows
make go-build-all        # Build for all platforms
```

### 📝 **Development Guidelines**

#### **Code Style**

```go
// Use gofmt and golangci-lint
go fmt ./...
goimports -w .
golangci-lint run

// Follow Go conventions:
// - Package names: short, lowercase, single words
// - Functions: camelCase with descriptive names
// - Variables: camelCase, meaningful names
// - Constants: UPPER_SNAKE_CASE
// - Interfaces: end with -er suffix (e.g., UserStore)
```

#### **Error Handling**

```go
// Always handle errors explicitly
result, err := service.DoSomething()
if err != nil {
    // Log error with context
    logger.Error("Operation failed",
        "operation", "do_something",
        "error", err,
        "user_id", userID)

    // Return appropriate error response
    c.JSON(http.StatusInternalServerError, gin.H{
        "error": "Internal server error",
        "code": "INTERNAL_ERROR",
    })
    return
}

// Use structured error types
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}
```

#### **Database Operations**

```go
// Use transactions for multi-step operations
func (s *UserService) CreateUserWithProfile(user *User, profile *Profile) error {
    return s.db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(user).Error; err != nil {
            return err
        }

        profile.UserID = user.ID
        if err := tx.Create(profile).Error; err != nil {
            return err
        }

        return nil
    })
}

// Use preloading for relationships
var users []User
err := db.Preload("Profile").Preload("Secrets").Find(&users).Error
```

### 🔄 **Development Workflow**

```bash
# 1. Setup development environment
make go-dev-setup

# 2. Create feature branch
git checkout -b feature/new-endpoint

# 3. Make changes and run tests
make go-test
make go-lint

# 4. Run locally
make go-server

# 5. Test API endpoints
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 6. Build and test
make go-build
./aether-vault-server

# 7. Submit pull request
git push origin feature/new-endpoint
```

---

## 🔧 Configuration

### 📋 **Environment Variables**

```bash
# Server Configuration
SERVER_PORT=8080
SERVER_HOST=localhost
SERVER_MODE=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aether_vault
DB_USER=postgres
DB_PASSWORD=password
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_TIME=24h
JWT_REFRESH_EXPIRE=168h

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1m

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# TOTP Configuration
TOTP_ISSUER=AetherVault
TOTP_DIGITS=6
TOTP_PERIOD=30
```

### ⚙️ **Configuration File**

```yaml
# config.yaml
server:
  port: 8080
  host: "0.0.0.0"
  mode: "development"

database:
  host: "localhost"
  port: 5432
  name: "aether_vault"
  user: "postgres"
  password: "password"
  ssl_mode: "disable"
  max_connections: 25
  connection_timeout: "5s"

security:
  jwt_secret: "your-super-secret-jwt-key"
  bcrypt_rounds: 12
  rate_limit:
    requests_per_minute: 100
    burst: 20

logging:
  level: "info"
  format: "json"
  output: "stdout"
```

---

## 📊 Monitoring & Observability

### 📈 **Health Checks**

```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-01-05T10:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "memory": "healthy"
  }
}
```

### 📊 **Metrics Endpoint**

```http
GET /metrics

Response:
{
  "requests_total": 15420,
  "requests_per_second": 45.2,
  "active_connections": 12,
  "database_connections": 8,
  "memory_usage": "45MB",
  "uptime": "72h30m15s"
}
```

### 🔍 **Audit Logging**

```go
// Automatic audit logging middleware
func AuditMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()

        // Log request completion
        audit.Log(c.Request.Context(), AuditEvent{
            Action:    c.Request.Method + " " + c.Request.URL.Path,
            User:      getCurrentUser(c),
            IP:        c.ClientIP(),
            Status:    c.Writer.Status(),
            Duration:  time.Since(start),
            UserAgent: c.Request.UserAgent(),
        })
    }
}
```

---

## 🤝 Contributing

We welcome contributions to improve the Aether Vault Server! Whether you're experienced with Go, security, authentication systems, or just want to help, there's a place for you.

### 🎯 **How to Contribute**

1. **Fork the repository** and create a feature branch
2. **Follow Go best practices** and our coding standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with clear description

### 🏗️ **Areas Needing Help**

- **Authentication Systems** - JWT, OAuth2, SAML integration
- **Security Enhancements** - Rate limiting, input validation, encryption
- **Database Optimization** - Query optimization, connection pooling
- **API Development** - New endpoints, versioning, documentation
- **Testing** - Unit tests, integration tests, performance tests
- **Documentation** - API docs, guides, examples

### 📝 **Contribution Guidelines**

- **Go Conventions** - Follow standard Go formatting and practices
- **Testing** - Write comprehensive tests for all new code
- **Documentation** - Update API docs and code comments
- **Security** - Consider security implications in all changes
- **Performance** - Optimize for high-performance scenarios

---

## 📞 Support & Community

### 💬 **Get Help**

- 📖 **[Documentation](../../docs/)** - Comprehensive guides
- 🐛 **[GitHub Issues](https://github.com/skygenesisenterprise/aether-vault/issues)** - Bug reports
- 💡 **[GitHub Discussions](https://github.com/skygenesisenterprise/aether-vault/discussions)** - Questions
- 📧 **Email** - support@skygenesisenterprise.com

### 🐛 **Reporting Issues**

When reporting bugs, please include:

- Go version and system information
- Clear steps to reproduce
- Error logs and stack traces
- Expected vs actual behavior

---

## 📊 Project Status

| Component             | Status         | Technology        | Notes                     |
| --------------------- | -------------- | ----------------- | ------------------------- |
| **Authentication**    | ✅ Working     | JWT + bcrypt      | Complete implementation   |
| **Database Layer**    | ✅ Working     | GORM + PostgreSQL | Auto-migrations, models   |
| **API Framework**     | ✅ Working     | Gin Router        | RESTful endpoints         |
| **Security**          | ✅ Working     | Custom middleware | Rate limiting, validation |
| **Audit System**      | ✅ Working     | Custom logging    | Complete audit trails     |
| **TOTP/2FA**          | ✅ Working     | Custom TOTP       | Time-based 2FA            |
| **Secret Management** | ✅ Working     | Encrypted storage | Secure secret handling    |
| **Policy Engine**     | 🔄 In Progress | Custom rules      | Access control policies   |
| **Testing Suite**     | 📋 Planned     | Go testing        | Unit and integration      |
| **API Documentation** | 📋 Planned     | Swagger/OpenAPI   | Interactive docs          |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](../../LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sky Genesis Enterprise** - Project leadership and development
- **Go Community** - Excellent programming language and ecosystem
- **Gin Framework** - High-performance HTTP web framework
- **GORM Team** - Modern Go ORM library
- **PostgreSQL Team** - Powerful relational database
- **Open Source Community** - Tools, libraries, and inspiration

---

<div align="center">

### 🚀 **Building the Future of Secure Identity Management!**

[⭐ Star This Repo](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Start a Discussion](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Enterprise-Grade Security with Modern Go Architecture**

**Made with ❤️ by the [Sky Genesis Enterprise](https://skygenesisenterprise.com) team**

_Building secure, scalable identity management solutions_

</div>
