# Multi-stage build for Aether Vault Runtime
# Stage 1: Build the Go binary
FROM golang:1.25.5-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary with static linking
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o aether-runtime \
    ./cmd/aether-runtime

# Stage 2: Create minimal runtime image
FROM scratch

# Import CA certificates from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Import timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy the binary
COPY --from=builder /build/aether-runtime /aether-runtime

# Set entrypoint
ENTRYPOINT ["/aether-runtime"]

# Default arguments (can be overridden)
CMD ["--help"]

# Labels
LABEL maintainer="Sky Genesis Enterprise <developer@skygenesienterprise.com>"
LABEL description="Aether Vault Runtime - Secure execution environment for applications"
LABEL version="1.0.0"
LABEL vendor="Sky Genesis Enterprise"

# Security labels
LABEL security.scan="enabled"
LABEL security.policy="zero-trust"