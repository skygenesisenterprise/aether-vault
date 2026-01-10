<div align="center">

# 🛠️ Aether Vault Scripts

[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](https://github.com/skygenesisenterprise/aether-vault/blob/main/LICENSE) [![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Bash](https://img.shields.io/badge/Bash-5+-black?style=for-the-badge&logo=gnu-bash)](https://www.gnu.org/software/bash/)

**🔧 Utility Scripts Library - Automation and Development Tools**

A comprehensive collection of utility scripts designed to streamline development, deployment, and maintenance tasks across the Aether Vault ecosystem.

[🚀 Quick Start](#-quick-start) • [📋 Available Scripts](#-available-scripts) • [🛠️ Usage](#️-usage) • [📁 Script Categories](#-script-categories) • [🤝 Contributing](#-contributing)

</div>

---

## 🌟 What is Aether Vault Scripts?

**Aether Vault Scripts** is a curated collection of automation and utility scripts that enhance the development experience and operational efficiency of the Aether Vault project. These scripts handle common tasks ranging from environment setup to deployment automation.

### 🎯 Key Features

- **🚀 Development Automation** - Streamlined setup and development workflows
- **🔧 Environment Management** - Easy environment configuration and validation
- **📦 Build Automation** - Automated building and packaging processes
- **🗄️ Database Utilities** - Database setup, migration, and maintenance tools
- **🐳 Docker Integration** - Container management and deployment scripts
- **🔍 Quality Assurance** - Code quality checks and validation tools
- **📊 Monitoring & Health** - System monitoring and health check utilities
- **🛠️ Maintenance Tools** - Cleanup, backup, and maintenance scripts

---

## 📋 Available Scripts

### 🚀 **Development Scripts**

| Script          | Purpose                            | Usage                    |
| --------------- | ---------------------------------- | ------------------------ |
| `setup-dev.sh`  | Initialize development environment | `./setup-dev.sh`         |
| `dev-server.sh` | Start development servers          | `./dev-server.sh`        |
| `watch.sh`      | Watch files and auto-reload        | `./watch.sh [directory]` |
| `lint.sh`       | Run code quality checks            | `./lint.sh`              |
| `format.sh`     | Format code automatically          | `./format.sh`            |
| `typecheck.sh`  | TypeScript type checking           | `./typecheck.sh`         |

### 🏗️ **Build & Deployment Scripts**

| Script             | Purpose              | Usage                       |
| ------------------ | -------------------- | --------------------------- |
| `build.sh`         | Build all components | `./build.sh`                |
| `build-prod.sh`    | Production build     | `./build-prod.sh`           |
| `deploy.sh`        | Deploy to production | `./deploy.sh [environment]` |
| `docker-build.sh`  | Build Docker images  | `./docker-build.sh`         |
| `docker-deploy.sh` | Deploy with Docker   | `./docker-deploy.sh`        |
| `rollback.sh`      | Rollback deployment  | `./rollback.sh [version]`   |

### 🗄️ **Database Scripts**

| Script          | Purpose                | Usage                        |
| --------------- | ---------------------- | ---------------------------- |
| `db-setup.sh`   | Initialize database    | `./db-setup.sh`              |
| `db-migrate.sh` | Run migrations         | `./db-migrate.sh`            |
| `db-seed.sh`    | Seed development data  | `./db-seed.sh`               |
| `db-backup.sh`  | Create database backup | `./db-backup.sh [filename]`  |
| `db-restore.sh` | Restore from backup    | `./db-restore.sh [filename]` |
| `db-reset.sh`   | Reset database         | `./db-reset.sh`              |

### 🔧 **Utility Scripts**

| Script              | Purpose                     | Usage                       |
| ------------------- | --------------------------- | --------------------------- |
| `cleanup.sh`        | Clean build artifacts       | `./cleanup.sh`              |
| `health-check.sh`   | System health check         | `./health-check.sh`         |
| `log-viewer.sh`     | View application logs       | `./log-viewer.sh [service]` |
| `port-check.sh`     | Check port availability     | `./port-check.sh`           |
| `deps-update.sh`    | Update dependencies         | `./deps-update.sh`          |
| `security-audit.sh` | Security vulnerability scan | `./security-audit.sh`       |

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **Bash** 5.0 or higher (most Unix systems)
- **Make** (optional, for integration with main project)
- **Docker** (optional, for container-related scripts)

### 🔧 Getting Started

1. **Make scripts executable**

   ```bash
   chmod +x scripts/*.sh
   ```

2. **Initialize development environment**

   ```bash
   ./scripts/setup-dev.sh
   ```

3. **Start development servers**

   ```bash
   ./scripts/dev-server.sh
   ```

4. **Run health checks**

   ```bash
   ./scripts/health-check.sh
   ```

### 🎯 **Common Workflows**

```bash
# New developer setup
./scripts/setup-dev.sh && ./scripts/dev-server.sh

# Daily development routine
./scripts/lint.sh && ./scripts/typecheck.sh && ./scripts/dev-server.sh

# Before committing
./scripts/format.sh && ./scripts/lint.sh && ./scripts/typecheck.sh

# Production deployment
./scripts/build-prod.sh && ./scripts/deploy.sh production

# Database maintenance
./scripts/db-backup.sh daily-backup && ./scripts/db-migrate.sh

# Security checks
./scripts/security-audit.sh && ./scripts/health-check.sh
```

---

## 🛠️ Usage Guidelines

### 📝 **Script Standards**

All scripts follow these conventions:

- **Executable Permissions** - All scripts are executable (`chmod +x`)
- **Error Handling** - Proper exit codes and error messages
- **Logging** - Structured output with timestamps
- **Configuration** - Environment-based configuration
- **Idempotency** - Safe to run multiple times
- **Dependencies** - Clear dependency requirements

### 🔧 **Configuration**

Scripts use environment variables for configuration:

```bash
# .env file example
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/aether-vault
PORT=3000
LOG_LEVEL=info
```

### 📊 **Exit Codes**

- `0` - Success
- `1` - General error
- `2` - Configuration error
- `3` - Dependency missing
- `4` - Permission denied
- `5` - Network/Connection error

---

## 📁 Script Categories

### 🚀 **Development Scripts**

Focus on enhancing the development experience:

```bash
scripts/
├── development/
│   ├── setup-dev.sh        # Environment initialization
│   ├── dev-server.sh       # Start development servers
│   ├── watch.sh            # File watching and reload
│   ├── hot-reload.sh       # Hot reload utilities
│   └── debug.sh            # Debugging helpers
```

**Key Features:**

- ✅ Automatic environment detection
- ✅ Hot reload capabilities
- ✅ Debug mode support
- ✅ Multi-service orchestration
- ✅ Development data seeding

### 🏗️ **Build & Deployment Scripts**

Handle building and deployment processes:

```bash
scripts/
├── build/
│   ├── build.sh            # Standard build process
│   ├── build-prod.sh       # Production optimization
│   ├── deploy.sh           # Deployment automation
│   ├── rollback.sh         # Deployment rollback
│   └── version.sh          # Version management
```

**Key Features:**

- ✅ Environment-specific builds
- ✅ Zero-downtime deployment
- ✅ Automatic rollback capability
- ✅ Version management
- ✅ Build artifact management

### 🗄️ **Database Scripts**

Database management and maintenance:

```bash
scripts/
├── database/
│   ├── db-setup.sh         # Database initialization
│   ├── db-migrate.sh       # Migration management
│   ├── db-seed.sh          # Data seeding
│   ├── db-backup.sh        # Backup creation
│   ├── db-restore.sh       # Backup restoration
│   └── db-optimize.sh      # Performance optimization
```

**Key Features:**

- ✅ Automated migrations
- ✅ Scheduled backups
- ✅ Data validation
- ✅ Performance monitoring
- ✅ Schema management

### 🔧 **Utility Scripts**

General-purpose utilities and helpers:

```bash
scripts/
├── utils/
│   ├── cleanup.sh          # Artifact cleanup
│   ├── health-check.sh     # System health
│   ├── log-viewer.sh       # Log management
│   ├── port-check.sh       # Port validation
│   ├── deps-update.sh      # Dependency management
│   └── security-audit.sh   # Security scanning
```

**Key Features:**

- ✅ System monitoring
- ✅ Log aggregation
- ✅ Security validation
- ✅ Dependency management
- ✅ Performance analysis

---

## 🔧 Advanced Usage

### 🔄 **Script Composition**

Scripts can be combined for complex workflows:

```bash
# Complete development setup
./scripts/setup-dev.sh && \
./scripts/db-setup.sh && \
./scripts/dev-server.sh

# Production deployment pipeline
./scripts/lint.sh && \
./scripts/typecheck.sh && \
./scripts/build-prod.sh && \
./scripts/security-audit.sh && \
./scripts/deploy.sh production

# Database maintenance routine
./scripts/db-backup.sh maintenance-backup && \
./scripts/db-migrate.sh && \
./scripts/db-optimize.sh
```

### 📊 **Integration with Make**

Scripts integrate seamlessly with the main project's Makefile:

```makefile
# Example Make targets
dev-setup:
	./scripts/setup-dev.sh

build-production:
	./scripts/build-prod.sh

deploy-staging:
	./scripts/deploy.sh staging

health-check:
	./scripts/health-check.sh
```

### 🔍 **Monitoring and Logging**

Scripts provide structured output for monitoring:

```bash
# Enable verbose logging
export LOG_LEVEL=debug
./scripts/dev-server.sh

# JSON output for parsing
export OUTPUT_FORMAT=json
./scripts/health-check.sh

# Log to file
./scripts/deploy.sh production 2>&1 | tee deploy.log
```

---

## 🤝 Contributing

We welcome contributions to expand and improve the script library!

### 🎯 **Adding New Scripts**

1. **Follow naming conventions** - Use kebab-case, descriptive names
2. **Include help text** - Add `--help` support
3. **Handle errors** - Proper exit codes and error messages
4. **Add documentation** - Update this README with script details
5. **Test thoroughly** - Test in various environments

### 📝 **Script Template**

```bash
#!/bin/bash

# Script: example-script.sh
# Purpose: Brief description of what the script does
# Usage: ./example-script.sh [options]
# Author: Your Name <email@example.com>

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/tmp/example-script.log"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG_FILE"
}

# Main function
main() {
    log "Starting example script..."

    # Your script logic here

    log "Script completed successfully"
}

# Help function
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help      Show this help message
    -v, --verbose   Enable verbose output
    -f, --force     Force operation

Examples:
    $0 --verbose
    $0 --force
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
```

### 🏗️ **Areas for Contribution**

- **New utility scripts** - Additional automation tools
- **Platform support** - Windows/macOS compatibility
- **Monitoring enhancements** - Better logging and metrics
- **Security improvements** - Enhanced security scanning
- **Performance optimization** - Faster script execution
- **Integration improvements** - Better CI/CD integration

---

## 📞 Support

### 🐛 **Reporting Issues**

When reporting script issues, please include:

- Script name and version
- Operating system and shell environment
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

### 💬 **Getting Help**

- 📖 **Documentation** - Check inline script help (`--help`)
- 🐛 **Issues** - Report bugs via GitHub issues
- 💡 **Discussions** - Join community discussions
- 📧 **Email** - support@skygenesisenterprise.com

---

## 📊 Script Status

| Category             | Status         | Coverage | Notes                                  |
| -------------------- | -------------- | -------- | -------------------------------------- |
| **Development**      | ✅ Active      | 85%      | Core development workflows covered     |
| **Build & Deploy**   | ✅ Active      | 90%      | Production-ready deployment tools      |
| **Database**         | ✅ Active      | 80%      | Essential database utilities available |
| **Utilities**        | ✅ Active      | 75%      | Common system utilities implemented    |
| **Monitoring**       | 🔄 In Progress | 60%      | Enhanced monitoring tools coming       |
| **Security**         | 🔄 In Progress | 70%      | Additional security scanning planned   |
| **Platform Support** | 📋 Planned     | 40%      | Windows/macOS compatibility planned    |

---

## 📄 License

This script collection is licensed under the **MIT License** - see the main project [LICENSE](../LICENSE) file for details.

---

<div align="center">

### 🚀 **Streamline Your Development Workflow with Aether Vault Scripts!**

[⭐ Star Project](https://github.com/skygenesisenterprise/aether-vault) • [🐛 Report Issues](https://github.com/skygenesisenterprise/aether-vault/issues) • [💡 Suggest Improvements](https://github.com/skygenesisenterprise/aether-vault/discussions)

---

**🔧 Automation Tools for Enhanced Development Experience!**

**Made with ❤️ by the [Aether Vault](https://skygenesisenterprise.com) team**

</div>
