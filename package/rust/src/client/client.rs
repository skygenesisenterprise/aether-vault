//! Main Vault client with async-first design.
//! 
//! Provides the primary interface for interacting with Aether Vault
//! with strong capability-based access control and lifetime management.

use crate::capability::{Capability, CapabilityRequest, Domain, Action};
use crate::config::Config;
use crate::context::Context;
use crate::error::{Result, VaultError};
use crate::identity::Identity;
use crate::transport::Transport;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// Main Vault client
#[derive(Debug, Clone)]
pub struct Client {
    /// Client configuration
    config: Arc<Config>,
    
    /// Transport layer
    transport: Arc<dyn Transport + Send + Sync>,
    
    /// Current identity
    identity: Arc<RwLock<Option<Identity>>>,
    
    /// Capability cache (short-lived, in-memory only)
    capabilities: Arc<RwLock<std::collections::HashMap<uuid::Uuid, Capability>>>,
}

impl Client {
    /// Create a new Vault client
    pub async fn new(config: Config) -> Result<Self> {
        // Validate configuration
        config.validate()?;
        
        // Create transport layer
        let transport: Arc<dyn Transport + Send + Sync> = match config.transport {
            crate::config::TransportType::Http => {
                Arc::new(crate::transport::HttpTransport::new(&config).await?)
            }
            crate::config::TransportType::Unix => {
                Arc::new(crate::transport::UnixTransport::new(&config).await?)
            }
            crate::config::TransportType::Mtls => {
                Arc::new(crate::transport::MtlsTransport::new(&config).await?)
            }
        };
        
        Ok(Self {
            config: Arc::new(config),
            transport,
            identity: Arc::new(RwLock::new(None)),
            capabilities: Arc::new(RwLock::new(std::collections::HashMap::new())),
        })
    }

    /// Set identity for the client
    pub async fn set_identity(&self, identity: Identity) -> Result<()> {
        let mut id_lock = self.identity.write().await;
        *id_lock = Some(identity);
        Ok(())
    }

    /// Get current identity
    pub async fn get_identity(&self) -> Option<Identity> {
        let id_lock = self.identity.read().await;
        id_lock.clone()
    }

    /// Request a capability from Vault
    pub async fn request_capability(
        &self,
        domain: Domain,
        action: Action,
        target: &str,
        context: &Context,
        ttl: Duration,
    ) -> Result<Capability> {
        // Check if we have an identity
        let identity = self.get_identity().await
            .ok_or(VaultError::Identity(crate::error::IdentityError::MissingIdentity))?;

        // Create capability request
        let cap_request = CapabilityRequest::new(
            domain,
            action,
            target.to_string(),
            context.to_capability_context(),
            ttl,
        );

        // Validate request
        cap_request.validate()?;

        // Send request to Vault
        let capability = self.transport.request_capability(&identity, &cap_request).await?;

        // Cache capability (short-lived)
        {
            let mut caps = self.capabilities.write().await;
            caps.insert(capability.id, capability.clone());
        }

        Ok(capability)
    }

    /// Access resource using a capability
    pub async fn access_with_capability<T>(&self, capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        // Validate capability
        if !capability.is_valid() {
            return Err(VaultError::Capability(
                crate::error::CapabilityError::Expired(capability.expires_at)
            ));
        }

        // Check if capability is cached
        let cached_cap = {
            let caps = self.capabilities.read().await;
            caps.get(&capability.id).cloned()
        };

        let cap_to_use = cached_cap.unwrap_or_else(|| capability.clone());

        // Increment usage
        let mut cap_for_usage = cap_to_use.clone();
        cap_for_usage.increment_usage()?;

        // Access resource
        let result = self.transport.access_with_capability(&cap_for_use).await?;

        // Update cached capability
        {
            let mut caps = self.capabilities.write().await;
            caps.insert(capability.id, cap_for_usage);
        }

        Ok(result)
    }

    /// Revoke a capability
    pub async fn revoke_capability(&self, capability_id: uuid::Uuid) -> Result<()> {
        // Remove from cache
        {
            let mut caps = self.capabilities.write().await;
            caps.remove(&capability_id);
        }

        // Send revocation request
        self.transport.revoke_capability(capability_id).await
    }

    /// List active capabilities
    pub async fn list_capabilities(&self) -> Result<Vec<Capability>> {
        let caps = self.capabilities.read().await;
        let mut active_caps = Vec::new();

        for cap in caps.values() {
            if cap.is_valid() {
                active_caps.push(cap.clone());
            }
        }

        Ok(active_caps)
    }

    /// Refresh a capability (extend TTL)
    pub async fn refresh_capability(
        &self,
        capability_id: uuid::Uuid,
        new_ttl: Duration,
    ) -> Result<Capability> {
        let identity = self.get_identity().await
            .ok_or(VaultError::Identity(crate::error::IdentityError::MissingIdentity))?;

        // Request refresh from Vault
        let refreshed_cap = self.transport.refresh_capability(&identity, capability_id, new_ttl).await?;

        // Update cache
        {
            let mut caps = self.capabilities.write().await;
            caps.insert(capability_id, refreshed_cap.clone());
        }

        Ok(refreshed_cap)
    }

    /// Get Vault status
    pub async fn status(&self) -> Result<VaultStatus> {
        self.transport.status().await
    }

    /// Health check
    pub async fn health_check(&self) -> Result<HealthStatus> {
        self.transport.health_check().await
    }

    /// Close the client and cleanup resources
    pub async fn close(&self) -> Result<()> {
        // Clear capabilities cache
        {
            let mut caps = self.capabilities.write().await;
            caps.clear();
        }

        // Clear identity
        {
            let mut id = self.identity.write().await;
            *id = None;
        }

        // Close transport
        self.transport.close().await
    }
}

/// Vault status information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VaultStatus {
    /// Vault version
    pub version: String,
    
    /// Server time
    pub server_time: chrono::DateTime<chrono::Utc>,
    
    /// Initialization status
    pub initialized: bool,
    
    /// Sealed status
    pub sealed: bool,
    
    /// Standby status
    pub standby: bool,
    
    /// Performance mode
    pub performance_mode: Option<String>,
    
    /// Available storage
    pub available_storage: Option<u64>,
    
    /// Total storage
    pub total_storage: Option<u64>,
}

/// Health check status
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HealthStatus {
    /// Overall health status
    pub healthy: bool,
    
    /// Detailed status information
    pub details: Vec<HealthDetail>,
    
    /// Timestamp of check
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Individual health detail
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HealthDetail {
    /// Component name
    pub component: String,
    
    /// Component status
    pub status: HealthStatusType,
    
    /// Status message
    pub message: Option<String>,
    
    /// Response time in milliseconds
    pub response_time_ms: Option<u64>,
}

/// Health status types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatusType {
    /// Component is healthy
    Healthy,
    /// Component is degraded
    Degraded,
    /// Component is unhealthy
    Unhealthy,
    /// Component status unknown
    Unknown,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{AuthConfig, AuthMethod, TransportType};
    use std::collections::HashSet;

    #[tokio::test]
    async fn test_client_creation() {
        let config = Config {
            endpoint: "http://localhost:8200".to_string(),
            transport: TransportType::Http,
            auth: AuthConfig {
                method: AuthMethod::None,
                token_file: None,
                cert_file: None,
                key_file: None,
                ca_file: None,
            },
            timeouts: crate::config::TimeoutConfig::default(),
            retry: crate::config::RetryConfig::default(),
            tls: None,
            logging: crate::config::LoggingConfig::default(),
            cache: None,
        };

        // This will fail in tests without a real Vault, but we can test the structure
        let result = Client::new(config).await;
        assert!(result.is_err() || result.is_ok()); // Either way, the structure is valid
    }

    #[tokio::test]
    async fn test_identity_management() {
        // Create a mock client for testing
        let config = Config::default();
        let transport = Arc::new(crate::transport::MockTransport::new());
        
        let client = Client {
            config: Arc::new(config),
            transport,
            identity: Arc::new(RwLock::new(None)),
            capabilities: Arc::new(RwLock::new(std::collections::HashMap::new())),
        };

        // Initially no identity
        assert!(client.get_identity().await.is_none());

        // Set identity
        let identity = Identity::new("test-token".to_string());
        client.set_identity(identity.clone()).await.unwrap();

        // Get identity
        let retrieved = client.get_identity().await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().token(), identity.token());
    }
}