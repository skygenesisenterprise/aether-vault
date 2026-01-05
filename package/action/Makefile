# Makefile for Aether Vault Action

.PHONY: build clean test deps

# Build variables
BINARY_NAME=aether-vault
VERSION=$(shell git describe --tags --always --dirty)
LDFLAGS=-ldflags "-X main.version=$(VERSION)"

# Build targets
BUILD_TARGETS=linux-amd64 linux-arm64 darwin-amd64 darwin-arm64

# Default target
all: deps build

# Install dependencies
deps:
	go mod download
	go mod tidy

# Build all architectures
build: $(BUILD_TARGETS)

# Build specific architectures
linux-amd64:
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-amd64 ./cmd

linux-arm64:
	GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-arm64 ./cmd

darwin-amd64:
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-amd64 ./cmd

darwin-arm64:
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-arm64 ./cmd

# Build current platform
build-local:
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out coverage.html

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Run security checks
security:
	gosec ./...

# Run all checks
check: fmt lint security test

# Create release package
release: clean build
	mkdir -p release
	for target in $(BUILD_TARGETS); do \
		cp bin/$(BINARY_NAME)-$$target release/; \
		cd release && tar -czf $(BINARY_NAME)-$$target.tar.gz $(BINARY_NAME)-$$target && cd ..; \
	done

# Install binary locally
install: build-local
	cp bin/$(BINARY_NAME) /usr/local/bin/

# Development helpers
dev-setup:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest

# Run integration tests (requires Vault)
test-integration:
	VAULT_URL=$(VAULT_URL) go test -v -tags=integration ./...

# Generate documentation
docs:
	godoc -http=:6060

# Show help
help:
	@echo "Available targets:"
	@echo "  build          - Build all architectures"
	@echo "  build-local    - Build for current platform"
	@echo "  test           - Run tests"
	@echo "  test-coverage  - Run tests with coverage"
	@echo "  clean          - Clean build artifacts"
	@echo "  fmt            - Format code"
	@echo "  lint           - Lint code"
	@echo "  security       - Run security checks"
	@echo "  check          - Run all checks (fmt, lint, security, test)"
	@echo "  release        - Create release package"
	@echo "  install        - Install binary locally"
	@echo "  dev-setup      - Setup development tools"
	@echo "  test-integration - Run integration tests"
	@echo "  docs           - Generate documentation"
	@echo "  help           - Show this help"