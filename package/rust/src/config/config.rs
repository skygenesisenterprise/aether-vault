//! Configuration management for Aether Vault SDK.
//! 
//! Supports multiple configuration sources with precedence:
//! 1. Runtime configuration
//! 2. Environment variables
//! 3. Configuration files
//! 4. Default values

use crate::error::{ConfigError, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;

/// Main configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Vault endpoint URL
    pub endpoint: String,
    
    /// Transport type (http, unix, mtls)
    pub transport: TransportType,
    
    /// Authentication configuration
    pub auth: AuthConfig,
    
    /// Timeout configuration
    pub timeouts: TimeoutConfig,
    
    /// Retry configuration
    pub retry: RetryConfig,
    
    /// TLS configuration
    pub tls: Option<TlsConfig>,
    
    /// Logging configuration
    pub logging: LoggingConfig,
    
    /// Cache configuration (disabled by default for security)
    pub cache: Option<CacheConfig>,
}

/// Transport type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransportType {
    /// HTTP/HTTPS transport
    Http,
    /// Unix socket transport
    Unix,
    /// mTLS transport
    Mtls,
}

/// Authentication configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthConfig {
    /// Authentication method
    pub method: AuthMethod,
    
    /// Token file path (if applicable)
    pub token_file: Option<PathBuf>,
    
    /// Certificate file path (if applicable)
    pub cert_file: Option<PathBuf>,
    
    /// Key file path (if applicable)
    pub key_file: Option<PathBuf>,
    
    /// CA certificate file path
    pub ca_file: Option<PathBuf>,
}

/// Authentication method
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AuthMethod {
    /// Token-based authentication
    Token,
    /// Certificate-based authentication
    Certificate,
    /// Workload identity
    Workload,
    /// No authentication (local development only)
    None,
}

/// Timeout configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutConfig {
    /// Connection timeout
    pub connect: Duration,
    
    /// Request timeout
    pub request: Duration,
    
    /// Capability timeout
    pub capability: Duration,
}

/// Retry configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    /// Maximum number of retries
    pub max_retries: u32,
    
    /// Base delay between retries
    pub base_delay: Duration,
    
    /// Maximum delay between retries
    pub max_delay: Duration,
    
    /// Exponential backoff multiplier
    pub backoff_multiplier: f64,
}

/// TLS configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsConfig {
    /// Verify server certificate
    pub verify_cert: bool,
    
    /// Server name indication
    pub server_name: Option<String>,
    
    /// Minimum TLS version
    pub min_version: Option<String>,
    
    /// Maximum TLS version
    pub max_version: Option<String>,
    
    /// Cipher suites
    pub cipher_suites: Option<Vec<String>>,
}

/// Logging configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    /// Log level
    pub level: String,
    
    /// Enable audit logging
    pub audit: bool,
    
    /// Log format
    pub format: LogFormat,
}

/// Log format
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogFormat {
    /// JSON format
    Json,
    /// Plain text format
    Text,
}

/// Cache configuration (security note: disabled by default)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
    /// Enable in-memory cache
    pub enabled: bool,
    
    /// Maximum cache size
    pub max_size: usize,
    
    /// Cache TTL
    pub ttl: Duration,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            endpoint: "http://localhost:8200".to_string(),
            transport: TransportType::Http,
            auth: AuthConfig::default(),
            timeouts: TimeoutConfig::default(),
            retry: RetryConfig::default(),
            tls: None,
            logging: LoggingConfig::default(),
            cache: None, // Disabled by default for security
        }
    }
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            method: AuthMethod::Token,
            token_file: None,
            cert_file: None,
            key_file: None,
            ca_file: None,
        }
    }
}

impl Default for TimeoutConfig {
    fn default() -> Self {
        Self {
            connect: Duration::from_secs(10),
            request: Duration::from_secs(30),
            capability: Duration::from_secs(300),
        }
    }
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            base_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
            backoff_multiplier: 2.0,
        }
    }
}

impl Default for LoggingConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            audit: true,
            format: LogFormat::Json,
        }
    }
}

impl Config {
    /// Create configuration from environment variables
    pub fn from_env() -> Result<Self> {
        let mut config = Self::default();

        // Override with environment variables
        if let Ok(endpoint) = std::env::var("VAULT_ENDPOINT") {
            config.endpoint = endpoint;
        }

        if let Ok(transport) = std::env::var("VAULT_TRANSPORT") {
            config.transport = match transport.to_lowercase().as_str() {
                "http" => TransportType::Http,
                "unix" => TransportType::Unix,
                "mtls" => TransportType::Mtls,
                _ => return Err(ConfigError::InvalidValue(
                    "transport".to_string(),
                    transport,
                ).into()),
            };
        }

        if let Ok(auth_method) = std::env::var("VAULT_AUTH_METHOD") {
            config.auth.method = match auth_method.to_lowercase().as_str() {
                "token" => AuthMethod::Token,
                "certificate" => AuthMethod::Certificate,
                "workload" => AuthMethod::Workload,
                "none" => AuthMethod::None,
                _ => return Err(ConfigError::InvalidValue(
                    "auth_method".to_string(),
                    auth_method,
                ).into()),
            };
        }

        if let Ok(token_file) = std::env::var("VAULT_TOKEN_FILE") {
            config.auth.token_file = Some(PathBuf::from(token_file));
        }

        if let Ok(cert_file) = std::env::var("VAULT_CERT_FILE") {
            config.auth.cert_file = Some(PathBuf::from(cert_file));
        }

        if let Ok(key_file) = std::env::var("VAULT_KEY_FILE") {
            config.auth.key_file = Some(PathBuf::from(key_file));
        }

        if let Ok(ca_file) = std::env::var("VAULT_CA_FILE") {
            config.auth.ca_file = Some(PathBuf::from(ca_file));
        }

        if let Ok(log_level) = std::env::var("VAULT_LOG_LEVEL") {
            config.logging.level = log_level;
        }

        Ok(config)
    }

    /// Load configuration from file
    pub fn from_file<P: AsRef<std::path::Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| ConfigError::FileNotFound(e.to_string()))?;

        toml::from_str(&content)
            .map_err(|e| ConfigError::ParseError(e.to_string()).into())
    }

    /// Load configuration with multiple sources (file + env)
    pub fn load_with_file<P: AsRef<std::path::Path>>(file_path: P) -> Result<Self> {
        let mut config = Self::from_file(file_path)?;
        
        // Override with environment variables
        let env_config = Self::from_env()?;
        config.merge(env_config);

        Ok(config)
    }

    /// Merge another configuration, with other taking precedence
    pub fn merge(&mut self, other: Config) {
        if other.endpoint != Config::default().endpoint {
            self.endpoint = other.endpoint;
        }
        
        if !matches!(other.transport, TransportType::Http) {
            self.transport = other.transport;
        }
        
        if !matches!(other.auth.method, AuthMethod::Token) {
            self.auth.method = other.auth.method;
        }
        
        if other.auth.token_file.is_some() {
            self.auth.token_file = other.auth.token_file;
        }
        
        if other.auth.cert_file.is_some() {
            self.auth.cert_file = other.auth.cert_file;
        }
        
        if other.auth.key_file.is_some() {
            self.auth.key_file = other.auth.key_file;
        }
        
        if other.auth.ca_file.is_some() {
            self.auth.ca_file = other.auth.ca_file;
        }
        
        if other.logging.level != "info" {
            self.logging.level = other.logging.level;
        }
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        // Validate endpoint
        if self.endpoint.is_empty() {
            return Err(ConfigError::MissingField("endpoint".to_string()).into());
        }

        // Validate transport-specific requirements
        match self.transport {
            TransportType::Http => {
                if !self.endpoint.starts_with("http") {
                    return Err(ConfigError::InvalidValue(
                        "endpoint".to_string(),
                        "must start with http/https for HTTP transport".to_string(),
                    ).into());
                }
            }
            TransportType::Unix => {
                if self.auth.cert_file.is_some() || self.auth.key_file.is_some() {
                    return Err(ConfigError::InvalidValue(
                        "auth".to_string(),
                        "certificate auth not supported with Unix transport".to_string(),
                    ).into());
                }
            }
            TransportType::Mtls => {
                if self.auth.cert_file.is_none() || self.auth.key_file.is_none() {
                    return Err(ConfigError::MissingField(
                        "cert_file and key_file required for mTLS".to_string(),
                    ).into());
                }
            }
        }

        // Validate authentication
        match self.auth.method {
            AuthMethod::Token => {
                if self.auth.token_file.is_none() {
                    return Err(ConfigError::MissingField(
                        "token_file required for token auth".to_string(),
                    ).into());
                }
            }
            AuthMethod::Certificate => {
                if self.auth.cert_file.is_none() || self.auth.key_file.is_none() {
                    return Err(ConfigError::MissingField(
                        "cert_file and key_file required for certificate auth".to_string(),
                    ).into());
                }
            }
            AuthMethod::Workload => {
                // Workload identity doesn't require files
            }
            AuthMethod::None => {
                // Only allowed for local development
                if !self.endpoint.contains("localhost") && !self.endpoint.contains("127.0.0.1") {
                    return Err(ConfigError::InvalidValue(
                        "auth".to_string(),
                        "no auth only allowed for localhost".to_string(),
                    ).into());
                }
            }
        }

        Ok(())
    }

    /// Get the effective endpoint URL
    pub fn endpoint_url(&self) -> String {
        match self.transport {
            TransportType::Http => self.endpoint.clone(),
            TransportType::Unix => format!("unix:{}", self.endpoint),
            TransportType::Mtls => self.endpoint.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;
    use tempfile::NamedTempFile;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.endpoint, "http://localhost:8200");
        assert!(matches!(config.transport, TransportType::Http));
        assert!(config.cache.is_none()); // Security: disabled by default
    }

    #[test]
    fn test_from_env() {
        // Set environment variables
        env::set_var("VAULT_ENDPOINT", "https://vault.example.com");
        env::set_var("VAULT_TRANSPORT", "mtls");
        env::set_var("VAULT_AUTH_METHOD", "certificate");

        let config = Config::from_env().unwrap();
        assert_eq!(config.endpoint, "https://vault.example.com");
        assert!(matches!(config.transport, TransportType::Mtls));
        assert!(matches!(config.auth.method, AuthMethod::Certificate));

        // Clean up
        env::remove_var("VAULT_ENDPOINT");
        env::remove_var("VAULT_TRANSPORT");
        env::remove_var("VAULT_AUTH_METHOD");
    }

    #[test]
    fn test_config_validation() {
        let mut config = Config::default();
        
        // Valid config should pass
        assert!(config.validate().is_ok());
        
        // Invalid endpoint should fail
        config.endpoint = "".to_string();
        assert!(config.validate().is_err());
        
        // mTLS without certs should fail
        config.endpoint = "https://vault.example.com".to_string();
        config.transport = TransportType::Mtls;
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_from_file() {
        let config_content = r#"
endpoint = "https://vault.example.com"
transport = "http"

[auth]
method = "token"
token_file = "/path/to/token"

[timeouts]
connect = "5s"
request = "10s"

[logging]
level = "debug"
audit = true
format = "json"
"#;

        let mut temp_file = NamedTempFile::new().unwrap();
        temp_file.write_all(config_content.as_bytes()).unwrap();
        
        let config = Config::from_file(temp_file.path()).unwrap();
        assert_eq!(config.endpoint, "https://vault.example.com");
        assert_eq!(config.logging.level, "debug");
        assert_eq!(config.timeouts.connect, Duration::from_secs(5));
    }
}