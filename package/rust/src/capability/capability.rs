//! Capability-based access control for Aether Vault.
//! 
//! Implements strong typing for capabilities with domain-specific
//! validation and lifetime management.

use crate::error::{CapabilityError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fmt;
use uuid::Uuid;

/// Capability token with strong typing and lifetime management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    /// Unique capability identifier
    pub id: Uuid,
    
    /// Domain of access
    pub domain: Domain,
    
    /// Action allowed
    pub action: Action,
    
    /// Target resource
    pub target: String,
    
    /// Context constraints
    pub context: CapabilityContext,
    
    /// Issued timestamp
    pub issued_at: DateTime<Utc>,
    
    /// Expiration timestamp
    pub expires_at: DateTime<Utc>,
    
    /// Issuer identity
    pub issuer: String,
    
    /// Subject identity
    pub subject: String,
    
    /// Capability signature
    pub signature: Vec<u8>,
}

/// Capability context constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityContext {
    /// Allowed environments
    pub environments: Option<HashSet<String>>,
    
    /// Allowed services
    pub services: Option<HashSet<String>>,
    
    /// Allowed namespaces
    pub namespaces: Option<HashSet<String>>,
    
    /// IP address constraints
    pub ip_constraints: Option<Vec<String>>,
    
    /// Time window constraints
    pub time_window: Option<TimeWindow>,
    
    /// Usage limits
    pub usage_limits: Option<UsageLimits>,
}

/// Time window constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeWindow {
    /// Start of allowed time window
    pub start: DateTime<Utc>,
    /// End of allowed time window
    pub end: DateTime<Utc>,
    /// Allowed days of week (0=Sunday, 6=Saturday)
    pub days_of_week: Option<Vec<u8>>,
}

/// Usage limits
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageLimits {
    /// Maximum number of uses
    pub max_uses: Option<u32>,
    /// Uses per time window
    pub uses_per_window: Option<(u32, chrono::Duration)>,
    /// Current usage count
    pub current_uses: u32,
}

/// Capability request for creating new capabilities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityRequest {
    /// Domain of access
    pub domain: Domain,
    
    /// Action requested
    pub action: Action,
    
    /// Target resource
    pub target: String,
    
    /// Request context
    pub context: CapabilityContext,
    
    /// Requested TTL
    pub ttl: std::time::Duration,
    
    /// Justification for access
    pub justification: Option<String>,
}

/// Access domains
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Domain {
    /// Database access
    Database,
    /// TLS certificates
    Tls,
    /// SMTP access
    Smtp,
    /// IMAP access
    Imap,
    /// Docker registry
    Docker,
    /// Git repositories
    Git,
    /// File system access
    Filesystem,
    /// Cloud provider access
    Cloud,
    /// API access
    Api,
    /// SSH access
    Ssh,
    /// Custom domain
    Custom(String),
}

impl fmt::Display for Domain {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Domain::Database => write!(f, "database"),
            Domain::Tls => write!(f, "tls"),
            Domain::Smtp => write!(f, "smtp"),
            Domain::Imap => write!(f, "imap"),
            Domain::Docker => write!(f, "docker"),
            Domain::Git => write!(f, "git"),
            Domain::Filesystem => write!(f, "filesystem"),
            Domain::Cloud => write!(f, "cloud"),
            Domain::Api => write!(f, "api"),
            Domain::Ssh => write!(f, "ssh"),
            Domain::Custom(name) => write!(f, "custom:{}", name),
        }
    }
}

/// Access actions
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Action {
    /// Read access
    Read,
    /// Write access
    Write,
    /// Delete access
    Delete,
    /// Execute access
    Execute,
    /// List access
    List,
    /// Admin access
    Admin,
    /// Create access
    Create,
    /// Update access
    Update,
    /// Custom action
    Custom(String),
}

impl fmt::Display for Action {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Action::Read => write!(f, "read"),
            Action::Write => write!(f, "write"),
            Action::Delete => write!(f, "delete"),
            Action::Execute => write!(f, "execute"),
            Action::List => write!(f, "list"),
            Action::Admin => write!(f, "admin"),
            Action::Create => write!(f, "create"),
            Action::Update => write!(f, "update"),
            Action::Custom(name) => write!(f, "custom:{}", name),
        }
    }
}

impl Capability {
    /// Create a new capability
    pub fn new(
        domain: Domain,
        action: Action,
        target: String,
        context: CapabilityContext,
        ttl: std::time::Duration,
        issuer: String,
        subject: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            domain,
            action,
            target,
            context,
            issued_at: now,
            expires_at: now + chrono::Duration::from_std(ttl).unwrap(),
            issuer,
            subject,
            signature: Vec::new(), // To be filled by signing
        }
    }

    /// Check if capability is currently valid
    pub fn is_valid(&self) -> bool {
        let now = Utc::now();
        
        // Check expiration
        if now > self.expires_at {
            return false;
        }

        // Check time window
        if let Some(time_window) = &self.context.time_window {
            if now < time_window.start || now > time_window.end {
                return false;
            }
            
            // Check day of week
            if let Some(allowed_days) = &time_window.days_of_week {
                let current_day = now.weekday().num_days_from_sunday() as u8;
                if !allowed_days.contains(&current_day) {
                    return false;
                }
            }
        }

        // Check usage limits
        if let Some(usage_limits) = &self.context.usage_limits {
            if let Some(max_uses) = usage_limits.max_uses {
                if usage_limits.current_uses >= max_uses {
                    return false;
                }
            }
        }

        true
    }

    /// Check if capability is valid for specific context
    pub fn is_valid_for_context(&self, environment: &str, service: &str, namespace: &str) -> bool {
        if !self.is_valid() {
            return false;
        }

        // Check environment
        if let Some(allowed_envs) = &self.context.environments {
            if !allowed_envs.contains(environment) {
                return false;
            }
        }

        // Check service
        if let Some(allowed_services) = &self.context.services {
            if !allowed_services.contains(service) {
                return false;
            }
        }

        // Check namespace
        if let Some(allowed_namespaces) = &self.context.namespaces {
            if !allowed_namespaces.contains(namespace) {
                return false;
            }
        }

        true
    }

    /// Get remaining time until expiration
    pub fn remaining_ttl(&self) -> Option<std::time::Duration> {
        let now = Utc::now();
        if now < self.expires_at {
            Some((self.expires_at - now).to_std().unwrap())
        } else {
            None
        }
    }

    /// Increment usage count
    pub fn increment_usage(&mut self) -> Result<()> {
        if let Some(usage_limits) = &mut self.context.usage_limits {
            usage_limits.current_uses += 1;
            
            if let Some(max_uses) = usage_limits.max_uses {
                if usage_limits.current_uses > max_uses {
                    return Err(CapabilityError::ScopeMismatch(
                        "Usage limit exceeded".to_string(),
                    ).into());
                }
            }
        }
        Ok(())
    }

    /// Validate capability signature
    pub fn validate_signature(&self, public_key: &[u8]) -> Result<bool> {
        // TODO: Implement signature validation using ring
        // This would verify the capability signature against the public key
        Ok(true) // Placeholder
    }

    /// Serialize capability for transport
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        serde_json::to_vec(self).map_err(|e| CapabilityError::InvalidFormat(e.to_string()).into())
    }

    /// Deserialize capability from bytes
    pub fn from_bytes(data: &[u8]) -> Result<Self> {
        serde_json::from_slice(data).map_err(|e| CapabilityError::InvalidFormat(e.to_string()).into())
    }
}

impl CapabilityRequest {
    /// Create a new capability request
    pub fn new(
        domain: Domain,
        action: Action,
        target: String,
        context: CapabilityContext,
        ttl: std::time::Duration,
    ) -> Self {
        Self {
            domain,
            action,
            target,
            context,
            ttl,
            justification: None,
        }
    }

    /// Add justification to the request
    pub fn with_justification(mut self, justification: String) -> Self {
        self.justification = Some(justification);
        self
    }

    /// Validate the request
    pub fn validate(&self) -> Result<()> {
        // Validate TTL (must be reasonable)
        if self.ttl > std::time::Duration::from_secs(24 * 60 * 60) {
            return Err(CapabilityError::InvalidFormat(
                "TTL too long (max 24 hours)".to_string(),
            ).into());
        }

        if self.ttl < std::time::Duration::from_secs(10) {
            return Err(CapabilityError::InvalidFormat(
                "TTL too short (min 10 seconds)".to_string(),
            ).into());
        }

        // Validate target
        if self.target.is_empty() {
            return Err(CapabilityError::InvalidFormat(
                "Target cannot be empty".to_string(),
            ).into());
        }

        Ok(())
    }
}

impl Domain {
    /// Parse domain from string
    pub fn parse(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "database" => Ok(Domain::Database),
            "tls" => Ok(Domain::Tls),
            "smtp" => Ok(Domain::Smtp),
            "imap" => Ok(Domain::Imap),
            "docker" => Ok(Domain::Docker),
            "git" => Ok(Domain::Git),
            "filesystem" => Ok(Domain::Filesystem),
            "cloud" => Ok(Domain::Cloud),
            "api" => Ok(Domain::Api),
            "ssh" => Ok(Domain::Ssh),
            custom if custom.starts_with("custom:") => {
                Ok(Domain::Custom(custom[7..].to_string()))
            }
            _ => Err(CapabilityError::InvalidDomain(s.to_string()).into()),
        }
    }

    /// Get all standard domains
    pub fn standard_domains() -> Vec<&'static str> {
        vec![
            "database", "tls", "smtp", "imap", "docker", 
            "git", "filesystem", "cloud", "api", "ssh"
        ]
    }
}

impl Action {
    /// Parse action from string
    pub fn parse(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "read" => Ok(Action::Read),
            "write" => Ok(Action::Write),
            "delete" => Ok(Action::Delete),
            "execute" => Ok(Action::Execute),
            "list" => Ok(Action::List),
            "admin" => Ok(Action::Admin),
            "create" => Ok(Action::Create),
            "update" => Ok(Action::Update),
            custom if custom.starts_with("custom:") => {
                Ok(Action::Custom(custom[7..].to_string()))
            }
            _ => Err(CapabilityError::InvalidAction(s.to_string()).into()),
        }
    }

    /// Get all standard actions
    pub fn standard_actions() -> Vec<&'static str> {
        vec![
            "read", "write", "delete", "execute", "list", 
            "admin", "create", "update"
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_capability_creation() {
        let context = CapabilityContext {
            environments: Some(HashSet::from(["production".to_string()])),
            services: Some(HashSet::from(["api-service".to_string()])),
            namespaces: None,
            ip_constraints: None,
            time_window: None,
            usage_limits: None,
        };

        let capability = Capability::new(
            Domain::Database,
            Action::Read,
            "users",
            context,
            std::time::Duration::from_secs(300),
            "vault".to_string(),
            "api-service".to_string(),
        );

        assert_eq!(capability.domain, Domain::Database);
        assert_eq!(capability.action, Action::Read);
        assert_eq!(capability.target, "users");
        assert!(capability.is_valid());
    }

    #[test]
    fn test_capability_expiration() {
        let context = CapabilityContext {
            environments: None,
            services: None,
            namespaces: None,
            ip_constraints: None,
            time_window: None,
            usage_limits: None,
        };

        let capability = Capability::new(
            Domain::Database,
            Action::Read,
            "users",
            context,
            std::time::Duration::from_millis(1), // Very short TTL
            "vault".to_string(),
            "test".to_string(),
        );

        // Should be valid initially
        assert!(capability.is_valid());
        
        // Wait for expiration
        std::thread::sleep(std::time::Duration::from_millis(10));
        assert!(!capability.is_valid());
    }

    #[test]
    fn test_domain_parsing() {
        assert_eq!(Domain::parse("database").unwrap(), Domain::Database);
        assert_eq!(Domain::parse("custom:mydomain").unwrap(), Domain::Custom("mydomain".to_string()));
        assert!(Domain::parse("invalid").is_err());
    }

    #[test]
    fn test_action_parsing() {
        assert_eq!(Action::parse("read").unwrap(), Action::Read);
        assert_eq!(Action::parse("custom:myaction").unwrap(), Action::Custom("myaction".to_string()));
        assert!(Action::parse("invalid").is_err());
    }

    #[test]
    fn test_capability_request_validation() {
        let context = CapabilityContext {
            environments: None,
            services: None,
            namespaces: None,
            ip_constraints: None,
            time_window: None,
            usage_limits: None,
        };

        let valid_request = CapabilityRequest::new(
            Domain::Database,
            Action::Read,
            "users",
            context,
            std::time::Duration::from_secs(300),
        );
        assert!(valid_request.validate().is_ok());

        let invalid_request = CapabilityRequest::new(
            Domain::Database,
            Action::Read,
            "", // Empty target
            context,
            std::time::Duration::from_secs(300),
        );
        assert!(invalid_request.validate().is_err());
    }
}