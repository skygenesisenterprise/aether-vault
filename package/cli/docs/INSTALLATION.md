# Installation Guide

## Overview

This guide covers various installation methods for Aether Vault CLI, system requirements, and post-installation verification. Choose the installation method that best fits your environment and use case.

## System Requirements

### Minimum Requirements

- **Operating System**: Linux, macOS, or Windows (WSL2)
- **Architecture**: x86_64 or ARM64
- **Memory**: 512MB RAM
- **Disk**: 100MB free space
- **Network**: Internet connection (for cloud mode, optional for local mode)

### Recommended Requirements

- **Operating System**: Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+) or macOS (11+)
- **Architecture**: x86_64
- **Memory**: 1GB RAM
- **Disk**: 500MB free space
- **Go**: Version 1.21+ (for building from source)

### Software Dependencies

- **Unix Socket Support**: Required for IPC communication
- **JSON/YAML Processors**: For configuration management
- **TLS Libraries**: For secure communication (optional)

## Installation Methods

### Method 1: Binary Download (Recommended)

#### Linux (x86_64)

```bash
# Download the latest binary
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault

# Verify the download (optional but recommended)
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64.sha256 -o vault.sha256
sha256sum -c vault.sha256

# Make it executable
chmod +x vault

# Move to system PATH
sudo mv vault /usr/local/bin/

# Verify installation
vault version
```

#### Linux (ARM64)

```bash
# Download the ARM64 binary
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-arm64 -o vault

# Verify and install
chmod +x vault
sudo mv vault /usr/local/bin/
vault version
```

#### macOS (Intel)

```bash
# Download the macOS binary
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-darwin-amd64 -o vault

# Verify and install
chmod +x vault
sudo mv vault /usr/local/bin/
vault version
```

#### macOS (Apple Silicon)

```bash
# Download the Apple Silicon binary
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-darwin-arm64 -o vault

# Verify and install
chmod +x vault
sudo mv vault /usr/local/bin/
vault version
```

#### Windows (WSL2)

```bash
# Inside WSL2, follow Linux instructions
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault
chmod +x vault
sudo mv vault /usr/local/bin/
vault version
```

### Method 2: Package Managers

#### Homebrew (macOS)

```bash
# Add the tap (coming soon)
brew tap aether-vault/tap

# Install vault
brew install aether-vault/tap/vault

# Verify installation
vault version
```

#### APT (Debian/Ubuntu)

```bash
# Add the Aether Vault repository (coming soon)
curl -fsSL https://download.aethervault.com/linux/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.aethervault.com/linux $(lsb_release -cs) stable"

# Update package list
sudo apt update

# Install vault
sudo apt install aether-vault-cli

# Verify installation
vault version
```

#### YUM/DNF (RHEL/CentOS/Fedora)

```bash
# Add the Aether Vault repository (coming soon)
sudo rpm --import https://download.aethervault.com/linux/gpg
sudo cat > /etc/yum.repos.d/aether-vault.repo << EOF
[aether-vault]
name=Aether Vault
baseurl=https://download.aethervault.com/linux/rpm/stable/\$basearch
enabled=1
gpgcheck=1
gpgkey=https://download.aethervault.com/linux/gpg
EOF

# Install vault
sudo yum install aether-vault-cli

# Verify installation
vault version
```

#### Pacman (Arch Linux)

```bash
# Install from AUR (coming soon)
git clone https://aur.archlinux.org/aether-vault-cli.git
cd aether-vault-cli
makepkg -si

# Verify installation
vault version
```

### Method 3: Build from Source

#### Prerequisites

```bash
# Install Go (if not already installed)
# Ubuntu/Debian
sudo apt update
sudo apt install golang-go

# macOS
brew install go

# Verify Go installation
go version
```

#### Build from Git Repository

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/cli

# Build the CLI
make build

# Install to system PATH
make install

# Verify installation
vault version
```

#### Manual Build

```bash
# Clone the repository
git clone https://github.com/skygenesisenterprise/aether-vault.git
cd aether-vault/package/cli

# Download dependencies
go mod download

# Build the binary
go build -o vault ./cmd/main.go

# Make it executable
chmod +x vault

# Move to system PATH
sudo mv vault /usr/local/bin/

# Verify installation
vault version
```

### Method 4: Docker

#### Pull Official Image

```bash
# Pull the official image
docker pull aether-vault/cli:latest

# Run vault commands
docker run --rm -v ~/.aether-vault:/root/.aether-vault aether-vault/cli:latest version
```

#### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  vault-cli:
    image: aether-vault/cli:latest
    volumes:
      - ~/.aether-vault:/root/.aether-vault
    entrypoint: ["tail", "-f", "/dev/null"]

  vault-agent:
    image: aether-vault/agent:latest
    volumes:
      - ~/.aether-vault:/root/.aether-vault
    command: ["start"]
```

```bash
# Start services
docker-compose up -d

# Use vault CLI
docker-compose exec vault-cli vault version
```

### Method 5: Kubernetes

#### Helm Chart (Coming Soon)

```bash
# Add the Aether Vault Helm repository
helm repo add aether-vault https://charts.aethervault.com
helm repo update

# Install vault CLI as a job
helm install vault-cli aether-vault/vault-cli
```

#### Kubernetes Manifest

```yaml
# vault-cli-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: vault-cli-test
spec:
  template:
    spec:
      containers:
        - name: vault-cli
          image: aether-vault/cli:latest
          command: ["vault", "version"]
      restartPolicy: Never
```

```bash
# Apply the manifest
kubectl apply -f vault-cli-job.yaml

# Check the job
kubectl get jobs
kubectl logs job/vault-cli-test
```

## Post-Installation Verification

### 1. Basic Verification

```bash
# Check version
vault version

# Expected output:
# Aether Vault CLI
# Version: 1.0.0
# Build: abc123def
# OS/Arch: linux/amd64
# Go Version: go1.21.0
```

### 2. Help System

```bash
# Show main help
vault --help

# Show command help
vault capability --help

# Show subcommand help
vault capability request --help
```

### 3. Initialize Environment

```bash
# Initialize local environment
vault init

# Expected output:
# ✓ Created configuration directory: /home/user/.aether-vault
# ✓ Generated default configuration file
# ✓ Created policy directory: /home/user/.aether-vault/policies
# ✓ Created audit log file: /home/user/.aether-vault/audit.log
# ✓ Local environment initialized successfully
```

### 4. Start Agent

```bash
# Start the agent
vault agent start

# Check agent status
vault agent status

# Expected output:
# Aether Vault Agent Status:
#   Running: true
#   PID: 12345
#   Uptime: 30s
#   Version: 1.0.0
```

### 5. Test Capability Request

```bash
# Request a test capability
vault capability request \
  --resource "secret:/test" \
  --action read \
  --ttl 60

# Expected output:
# Capability Request Result:
#   Status: granted
#   Request ID: req_1234567890_abcdef
#   Processing Time: 45ms
#
# Capability Details:
#   ID: cap_1234567890_ghijkl
#   Type: read
#   Resource: secret:/test
#   Actions: read
#   Identity: user
#   Issuer: aether-vault-agent
#   TTL: 60 seconds
#   Max Uses: 100
#   Issued At: 2024-01-08T10:00:00Z
#   Expires At: 2024-01-08T10:01:00Z
```

## Configuration

### Default Configuration Location

The CLI looks for configuration in the following locations (in order):

1. `--config` command line flag
2. `VAULT_CONFIG_PATH` environment variable
3. `~/.aether-vault/config.yaml`
4. `/etc/aether-vault/config.yaml`

### Environment Variables

```bash
# Set common environment variables
export VAULT_CONFIG_PATH="/path/to/config.yaml"
export VAULT_LOG_LEVEL="info"
export VAULT_AGENT_SOCKET_PATH="/tmp/vault.sock"

# Add to shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export VAULT_LOG_LEVEL="info"' >> ~/.bashrc
source ~/.bashrc
```

### Shell Completion

#### Bash Completion

```bash
# Enable bash completion
echo 'source <(vault completion bash)' >> ~/.bashrc
source ~/.bashrc
```

#### Zsh Completion

```bash
# Enable zsh completion
echo 'source <(vault completion zsh)' >> ~/.zshrc
source ~/.zshrc
```

#### Fish Completion

```bash
# Enable fish completion
vault completion fish > ~/.config/fish/completions/vault.fish
```

## Upgrading

### Upgrade Binary Installation

```bash
# Backup current configuration
cp -r ~/.aether-vault ~/.aether-vault.backup

# Stop running agent
vault agent stop

# Download new version
curl -L https://github.com/skygenesisenterprise/aether-vault/releases/latest/download/vault-linux-amd64 -o vault-new

# Replace binary
sudo mv vault-new /usr/local/bin/vault
chmod +x /usr/local/bin/vault

# Verify new version
vault version

# Start agent
vault agent start
```

### Upgrade from Source

```bash
# Backup configuration
cp -r ~/.aether-vault ~/.aether-vault.backup

# Stop agent
vault agent stop

# Update source code
cd aether-vault/package/cli
git pull origin main

# Rebuild
make clean
make build
make install

# Verify new version
vault version

# Start agent
vault agent start
```

### Upgrade Configuration

```bash
# Check if configuration needs migration
vault config validate

# Generate new default configuration for comparison
vault agent config --generate --output /tmp/new-config.yaml

# Compare configurations
diff ~/.aether-vault/config.yaml /tmp/new-config.yaml
```

## Uninstallation

### Remove Binary

```bash
# Stop agent
vault agent stop

# Remove binary
sudo rm /usr/local/bin/vault

# Remove configuration (optional)
rm -rf ~/.aether-vault
```

### Package Manager Removal

#### Homebrew

```bash
# Remove package
brew uninstall aether-vault/tap/vault

# Remove tap
brew untap aether-vault/tap
```

#### APT

```bash
# Remove package
sudo apt remove aether-vault-cli

# Remove repository
sudo add-apt-repository --remove "deb [arch=amd64] https://download.aethervault.com/linux $(lsb_release -cs) stable"
sudo apt update
```

#### YUM/DNF

```bash
# Remove package
sudo yum remove aether-vault-cli

# Remove repository
sudo rm /etc/yum.repos.d/aether-vault.repo
```

### Clean Up

```bash
# Remove all data (WARNING: This deletes everything)
rm -rf ~/.aether-vault

# Remove systemd service files (if created)
sudo rm -f /etc/systemd/system/vault-agent.service
sudo systemctl daemon-reload
```

## Troubleshooting

### Installation Issues

#### Permission Denied

```bash
# Problem: Permission denied when moving binary
sudo mv vault /usr/local/bin/vault

# Alternative: Install to user directory
mkdir -p ~/.local/bin
mv vault ~/.local/bin/
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Command Not Found

```bash
# Check if vault is in PATH
which vault

# If not found, add to PATH
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
/usr/local/bin/vault version
```

#### Library Dependencies

```bash
# On Linux, install required libraries
# Ubuntu/Debian
sudo apt update
sudo apt install -y libssl-dev libyaml-dev

# CentOS/RHEL
sudo yum install -y openssl-devel libyaml-devel

# macOS
brew install openssl libyaml
```

### Runtime Issues

#### Agent Won't Start

```bash
# Check for existing agent
ps aux | grep vault-agent

# Remove stale socket file
rm -f ~/.aether-vault/agent.sock

# Start agent with debug logging
VAULT_LOG_LEVEL=debug vault agent start
```

#### Socket Connection Issues

```bash
# Check socket file permissions
ls -la ~/.aether-vault/agent.sock

# Fix permissions
chmod 666 ~/.aether-vault/agent.sock

# Check socket directory
ls -la ~/.aether-vault/
chmod 700 ~/.aether-vault/
```

#### Configuration Issues

```bash
# Validate configuration
vault config validate

# Show current configuration
vault config show

# Reset to defaults
rm ~/.aether-vault/config.yaml
vault init
```

### Platform-Specific Issues

#### macOS Gatekeeper

```bash
# If Gatekeeper blocks the binary
xattr -d com.apple.quarantine /usr/local/bin/vault

# Or allow the app
sudo spctl --add --label "Aether Vault" /usr/local/bin/vault
```

#### Windows WSL2

```bash
# Inside WSL2, ensure Unix socket support
sudo apt update
sudo apt install -y unixodbc-dev

# Check WSL2 version
wsl.exe --version
```

#### SELinux (RHEL/CentOS)

```bash
# Check SELinux status
sestatus

# If needed, set SELinux context
sudo setsebool -P httpd_can_network_connect 1
```

## Verification Script

Use this script to verify your installation:

```bash
#!/bin/bash
# verify-installation.sh

set -e

echo "🔍 Verifying Aether Vault CLI Installation..."
echo "============================================"

# Check if vault is installed
if ! command -v vault &> /dev/null; then
    echo "❌ Vault CLI is not installed or not in PATH"
    exit 1
fi

echo "✅ Vault CLI is installed"

# Check version
echo "📋 Version information:"
vault version

# Check configuration directory
if [ ! -d "$HOME/.aether-vault" ]; then
    echo "⚠️  Configuration directory not found. Run 'vault init' to create it."
else
    echo "✅ Configuration directory exists"
fi

# Check if agent is running
if vault agent status > /dev/null 2>&1; then
    echo "✅ Agent is running"
else
    echo "⚠️  Agent is not running. Start it with 'vault agent start'"
fi

# Test capability request
echo "🧪 Testing capability request..."
if vault capability request --resource "secret:/test" --action read --ttl 60 > /dev/null 2>&1; then
    echo "✅ Capability request works"
else
    echo "⚠️  Capability request failed. Check if agent is running."
fi

echo "🎉 Installation verification completed!"
echo ""
echo "Next steps:"
echo "1. Run 'vault init' if you haven't already"
echo "2. Start the agent with 'vault agent start'"
echo "3. Try 'vault capability request --help' to see available commands"
```

Make it executable and run:

```bash
chmod +x verify-installation.sh
./verify-installation.sh
```

## Getting Help

### Documentation

- **Complete Documentation**: [https://docs.aethervault.com](https://docs.aethervault.com)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Command Reference**: [COMMANDS\_\*.md](COMMANDS_*.md)

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/skygenesisenterprise/aether-vault/issues)
- **Discussions**: [Ask questions](https://github.com/skygenesisenterprise/aether-vault/discussions)
- **Discord**: [Join community](https://discord.gg/aethervault)

### Command Line Help

```bash
# General help
vault --help

# Command-specific help
vault capability --help
vault agent --help

# Subcommand help
vault capability request --help
```

---

_For detailed configuration and usage, see the [QUICK_START.md](QUICK_START.md) guide._
