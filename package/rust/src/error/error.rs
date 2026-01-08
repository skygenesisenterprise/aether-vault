//! Strong error typing for Aether Vault operations.
//! 
//! This module provides comprehensive error handling with specific
//! error types for different failure scenarios.

use thiserror::Error;

/// Result type alias for convenience
pub type Result<T> = std::result::Result<T, VaultError>;

/// Main error type for all Vault operations
#[derive(Error, Debug)]
pub enum VaultError {
    /// Authentication failed
    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    /// Authorization failed
    #[error("Access denied: {0}")]
    AccessDenied(String),

    /// Capability-related errors
    #[error("Capability error: {0}")]
    Capability(#[from] CapabilityError),

    /// Identity-related errors
    #[error("Identity error: {0}")]
    Identity(#[from] IdentityError),

    /// Transport/network errors
    #[error("Transport error: {0}")]
    Transport(#[from] TransportError),

    /// Cryptographic errors
    #[error("Crypto error: {0}")]
    Crypto(#[from] CryptoError),

    /// Configuration errors
    #[error("Configuration error: {0}")]
    Config(#[from] ConfigError),

    /// Validation errors
    #[error("Validation failed: {0}")]
    Validation(String),

    /// Timeout errors
    #[error("Operation timed out after {0}")]
    Timeout(std::time::Duration),

    /// Rate limiting
    #[error("Rate limit exceeded: retry after {0}")]
    RateLimit(std::time::Duration),

    /// Vault server errors
    #[error("Vault server error: {0}")]
    Server(String),

    /// Invalid response from server
    #[error("Invalid server response: {0}")]
    InvalidResponse(String),

    /// Internal SDK errors
    #[error("Internal error: {0}")]
    Internal(String),

    /// IO errors
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON serialization/deserialization errors
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// TOML parsing errors
    #[error("TOML error: {0}")]
    Toml(#[from] toml::de::Error),
}

/// Capability-specific errors
#[derive(Error, Debug)]
pub enum CapabilityError {
    /// Invalid capability format
    #[error("Invalid capability format: {0}")]
    InvalidFormat(String),

    /// Capability expired
    #[error("Capability expired at {0}")]
    Expired(chrono::DateTime<chrono::Utc>),

    /// Capability not found
    #[error("Capability not found: {0}")]
    NotFound(uuid::Uuid),

    /// Invalid domain
    #[error("Invalid domain: {0}")]
    InvalidDomain(String),

    /// Invalid action
    #[error("Invalid action: {0}")]
    InvalidAction(String),

    /// Capability revoked
    #[error("Capability revoked: {0}")]
    Revoked(uuid::Uuid),

    /// Scope mismatch
    #[error("Capability scope mismatch: {0}")]
    ScopeMismatch(String),
}

/// Identity-specific errors
#[derive(Error, Debug)]
pub enum IdentityError {
    /// Invalid identity token
    #[error("Invalid identity token: {0}")]
    InvalidToken(String),

    /// Token expired
    #[error("Identity token expired at {0}")]
    TokenExpired(chrono::DateTime<chrono::Utc>),

    /// Missing identity
    #[error("No identity provided")]
    MissingIdentity,

    /// Invalid workload identity
    #[error("Invalid workload identity: {0}")]
    InvalidWorkload(String),

    /// Identity verification failed
    #[error("Identity verification failed: {0}")]
    VerificationFailed(String),
}

/// Transport/network errors
#[derive(Error, Debug)]
pub enum TransportError {
    /// Connection failed
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    /// TLS errors
    #[error("TLS error: {0}")]
    Tls(String),

    /// HTTP errors
    #[error("HTTP error: {0}")]
    Http(String),

    /// Protocol errors
    #[error("Protocol error: {0}")]
    Protocol(String),

    /// Invalid endpoint
    #[error("Invalid endpoint: {0}")]
    InvalidEndpoint(String),

    /// Connection timeout
    #[error("Connection timeout")]
    ConnectionTimeout,
}

/// Cryptographic errors
#[derive(Error, Debug)]
pub enum CryptoError {
    /// Invalid key format
    #[error("Invalid key format: {0}")]
    InvalidKeyFormat(String),

    /// Signature verification failed
    #[error("Signature verification failed")]
    SignatureVerificationFailed,

    /// Encryption failed
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    /// Decryption failed
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    /// Invalid certificate
    #[error("Invalid certificate: {0}")]
    InvalidCertificate(String),

    /// Key not found
    #[error("Key not found: {0}")]
    KeyNotFound(String),
}

/// Configuration errors
#[derive(Error, Debug)]
pub enum ConfigError {
    /// Missing required field
    #[error("Missing required configuration field: {0}")]
    MissingField(String),

    /// Invalid configuration value
    #[error("Invalid configuration value for {0}: {1}")]
    InvalidValue(String, String),

    /// Configuration file not found
    #[error("Configuration file not found: {0}")]
    FileNotFound(String),

    /// Configuration parse error
    #[error("Configuration parse error: {0}")]
    ParseError(String),

    /// Environment variable error
    #[error("Environment variable error: {0}")]
    EnvironmentVariable(String),
}

impl VaultError {
    /// Check if this is a retryable error
    pub fn is_retryable(&self) -> bool {
        match self {
            VaultError::Transport(_) => true,
            VaultError::Timeout(_) => true,
            VaultError::RateLimit(_) => true,
            VaultError::Server(_) => true,
            _ => false,
        }
    }

    /// Check if this is an authentication error
    pub fn is_authentication_error(&self) -> bool {
        matches!(self, VaultError::AuthenticationFailed(_))
    }

    /// Check if this is an authorization error
    pub fn is_authorization_error(&self) -> bool {
        matches!(self, VaultError::AccessDenied(_))
    }

    /// Get error code for logging/monitoring
    pub fn error_code(&self) -> &'static str {
        match self {
            VaultError::AuthenticationFailed(_) => "AUTH_FAILED",
            VaultError::AccessDenied(_) => "ACCESS_DENIED",
            VaultError::Capability(_) => "CAPABILITY_ERROR",
            VaultError::Identity(_) => "IDENTITY_ERROR",
            VaultError::Transport(_) => "TRANSPORT_ERROR",
            VaultError::Crypto(_) => "CRYPTO_ERROR",
            VaultError::Config(_) => "CONFIG_ERROR",
            VaultError::Validation(_) => "VALIDATION_ERROR",
            VaultError::Timeout(_) => "TIMEOUT",
            VaultError::RateLimit(_) => "RATE_LIMIT",
            VaultError::Server(_) => "SERVER_ERROR",
            VaultError::InvalidResponse(_) => "INVALID_RESPONSE",
            VaultError::Internal(_) => "INTERNAL_ERROR",
            VaultError::Io(_) => "IO_ERROR",
            VaultError::Json(_) => "JSON_ERROR",
            VaultError::Toml(_) => "TOML_ERROR",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_codes() {
        let err = VaultError::AuthenticationFailed("test".to_string());
        assert_eq!(err.error_code(), "AUTH_FAILED");
        assert!(err.is_authentication_error());
        assert!(!err.is_retryable());
    }

    #[test]
    fn test_retryable_errors() {
        let retryable = VaultError::Timeout(std::time::Duration::from_secs(1));
        assert!(retryable.is_retryable());

        let non_retryable = VaultError::AccessDenied("test".to_string());
        assert!(!non_retryable.is_retryable());
    }
}