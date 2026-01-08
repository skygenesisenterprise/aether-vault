//! Transport layer abstraction for Aether Vault.
//! 
//! Provides unified interface for different transport mechanisms
//! with async-first design and proper error handling.

use crate::capability::{Capability, CapabilityRequest};
use crate::error::{Result, TransportError};
use crate::identity::Identity;
use async_trait::async_trait;
use std::time::Duration;

/// Transport trait for different communication mechanisms
#[async_trait]
pub trait Transport: Send + Sync {
    /// Request a capability from Vault
    async fn request_capability(
        &self,
        identity: &Identity,
        request: &CapabilityRequest,
    ) -> Result<Capability>;

    /// Access resource using a capability
    async fn access_with_capability<T>(&self, capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned + Send;

    /// Revoke a capability
    async fn revoke_capability(&self, capability_id: uuid::Uuid) -> Result<()>;

    /// Refresh a capability
    async fn refresh_capability(
        &self,
        identity: &Identity,
        capability_id: uuid::Uuid,
        new_ttl: Duration,
    ) -> Result<Capability>;

    /// Get Vault status
    async fn status(&self) -> Result<crate::client::VaultStatus>;

    /// Health check
    async fn health_check(&self) -> Result<crate::client::HealthStatus>;

    /// Close transport connection
    async fn close(&self) -> Result<()>;
}

/// HTTP/HTTPS transport implementation
pub struct HttpTransport {
    client: reqwest::Client,
    endpoint: String,
    auth_header: Option<String>,
}

impl HttpTransport {
    /// Create new HTTP transport
    pub async fn new(config: &crate::config::Config) -> Result<Self> {
        let mut client_builder = reqwest::Client::builder()
            .timeout(config.timeouts.request)
            .connect_timeout(config.timeouts.connect);

        // Configure TLS if specified
        if let Some(tls_config) = &config.tls {
            // TODO: Configure TLS based on config
        }

        let client = client_builder.build()
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        // Prepare authentication header
        let auth_header = match &config.auth.method {
            crate::config::AuthMethod::Token => {
                if let Some(token_file) = &config.auth.token_file {
                    let token = std::fs::read_to_string(token_file)
                        .map_err(|e| TransportError::ConnectionFailed(
                            format!("Failed to read token file: {}", e)
                        ))?;
                    Some(format!("Bearer {}", token.trim()))
                } else {
                    None
                }
            }
            _ => None,
        };

        Ok(Self {
            client,
            endpoint: config.endpoint.clone(),
            auth_header,
        })
    }
}

#[async_trait]
impl Transport for HttpTransport {
    async fn request_capability(
        &self,
        identity: &Identity,
        request: &CapabilityRequest,
    ) -> Result<Capability> {
        let url = format!("{}/v1/capabilities", self.endpoint);
        
        let mut req_builder = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .header("X-Vault-Identity", identity.token());

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .json(&request)
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            let capability: Capability = response.json().await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
            Ok(capability)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn access_with_capability<T>(&self, capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned + Send,
    {
        let url = format!("{}/v1/access", self.endpoint);
        
        let mut req_builder = self.client
            .post(&url)
            .header("Content-Type", "application/json");

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .json(&capability)
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            let result: T = response.json().await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
            Ok(result)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn revoke_capability(&self, capability_id: uuid::Uuid) -> Result<()> {
        let url = format!("{}/v1/capabilities/{}/revoke", self.endpoint, capability_id);
        
        let mut req_builder = self.client
            .post(&url);

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            Ok(())
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn refresh_capability(
        &self,
        identity: &Identity,
        capability_id: uuid::Uuid,
        new_ttl: Duration,
    ) -> Result<Capability> {
        let url = format!("{}/v1/capabilities/{}/refresh", self.endpoint, capability_id);
        
        let mut req_builder = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .header("X-Vault-Identity", identity.token())
            .json(&serde_json::json!({
                "ttl_seconds": new_ttl.as_secs()
            }));

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            let capability: Capability = response.json().await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
            Ok(capability)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn status(&self) -> Result<crate::client::VaultStatus> {
        let url = format!("{}/v1/status", self.endpoint);
        
        let mut req_builder = self.client.get(&url);

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            let status: crate::client::VaultStatus = response.json().await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
            Ok(status)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn health_check(&self) -> Result<crate::client::HealthStatus> {
        let url = format!("{}/v1/health", self.endpoint);
        
        let mut req_builder = self.client.get(&url);

        if let Some(auth) = &self.auth_header {
            req_builder = req_builder.header("Authorization", auth);
        }

        let response = req_builder
            .send()
            .await
            .map_err(|e| TransportError::Http(e.to_string()))?;

        if response.status().is_success() {
            let health: crate::client::HealthStatus = response.json().await
                .map_err(|e| TransportError::InvalidResponse(e.to_string()))?;
            Ok(health)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            Err(TransportError::Http(
                format!("HTTP {}: {}", status, error_text)
            ).into())
        }
    }

    async fn close(&self) -> Result<()> {
        // HTTP client doesn't need explicit closing
        Ok(())
    }
}

/// Unix socket transport implementation
pub struct UnixTransport {
    socket_path: String,
    _client: tokio::net::UnixStream, // Placeholder for actual implementation
}

impl UnixTransport {
    /// Create new Unix socket transport
    pub async fn new(config: &crate::config::Config) -> Result<Self> {
        let socket_path = config.endpoint.strip_prefix("unix://")
            .unwrap_or(&config.endpoint)
            .to_string();

        // TODO: Implement actual Unix socket connection
        let _client = tokio::net::UnixStream::connect(&socket_path)
            .await
            .map_err(|e| TransportError::ConnectionFailed(
                format!("Failed to connect to Unix socket: {}", e)
            ))?;

        Ok(Self {
            socket_path,
            _client,
        })
    }
}

#[async_trait]
impl Transport for UnixTransport {
    async fn request_capability(
        &self,
        _identity: &Identity,
        _request: &CapabilityRequest,
    ) -> Result<Capability> {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn access_with_capability<T>(&self, _capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned + Send,
    {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn revoke_capability(&self, _capability_id: uuid::Uuid) -> Result<()> {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn refresh_capability(
        &self,
        _identity: &Identity,
        _capability_id: uuid::Uuid,
        _new_ttl: Duration,
    ) -> Result<Capability> {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn status(&self) -> Result<crate::client::VaultStatus> {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn health_check(&self) -> Result<crate::client::HealthStatus> {
        // TODO: Implement Unix socket transport
        Err(TransportError::Protocol("Unix socket transport not implemented".to_string()).into())
    }

    async fn close(&self) -> Result<()> {
        // TODO: Implement Unix socket cleanup
        Ok(())
    }
}

/// mTLS transport implementation
pub struct MtlsTransport {
    client: reqwest::Client,
    endpoint: String,
}

impl MtlsTransport {
    /// Create new mTLS transport
    pub async fn new(config: &crate::config::Config) -> Result<Self> {
        // TODO: Implement mTLS client configuration
        let client = reqwest::Client::builder()
            .timeout(config.timeouts.request)
            .build()
            .map_err(|e| TransportError::ConnectionFailed(e.to_string()))?;

        Ok(Self {
            client,
            endpoint: config.endpoint.clone(),
        })
    }
}

#[async_trait]
impl Transport for MtlsTransport {
    async fn request_capability(
        &self,
        _identity: &Identity,
        _request: &CapabilityRequest,
    ) -> Result<Capability> {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn access_with_capability<T>(&self, _capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned + Send,
    {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn revoke_capability(&self, _capability_id: uuid::Uuid) -> Result<()> {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn refresh_capability(
        &self,
        _identity: &Identity,
        _capability_id: uuid::Uuid,
        _new_ttl: Duration,
    ) -> Result<Capability> {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn status(&self) -> Result<crate::client::VaultStatus> {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn health_check(&self) -> Result<crate::client::HealthStatus> {
        // TODO: Implement mTLS transport
        Err(TransportError::Protocol("mTLS transport not implemented".to_string()).into())
    }

    async fn close(&self) -> Result<()> {
        // TODO: Implement mTLS cleanup
        Ok(())
    }
}

/// Mock transport for testing
pub struct MockTransport {
    capabilities: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<uuid::Uuid, Capability>>>,
}

impl MockTransport {
    pub fn new() -> Self {
        Self {
            capabilities: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        }
    }
}

#[async_trait]
impl Transport for MockTransport {
    async fn request_capability(
        &self,
        _identity: &Identity,
        request: &CapabilityRequest,
    ) -> Result<Capability> {
        let capability = Capability::new(
            request.domain.clone(),
            request.action.clone(),
            request.target.clone(),
            request.context.clone(),
            request.ttl,
            "mock-vault".to_string(),
            "mock-client".to_string(),
        );

        let mut caps = self.capabilities.lock().unwrap();
        caps.insert(capability.id, capability.clone());

        Ok(capability)
    }

    async fn access_with_capability<T>(&self, capability: &Capability) -> Result<T>
    where
        T: serde::de::DeserializeOwned + Send,
    {
        // For testing, return a simple success response
        let response = serde_json::json!({
            "success": true,
            "capability_id": capability.id,
            "message": "Access granted"
        });

        serde_json::from_value(response)
            .map_err(|e| TransportError::InvalidResponse(e.to_string()).into())
    }

    async fn revoke_capability(&self, capability_id: uuid::Uuid) -> Result<()> {
        let mut caps = self.capabilities.lock().unwrap();
        caps.remove(&capability_id);
        Ok(())
    }

    async fn refresh_capability(
        &self,
        _identity: &Identity,
        capability_id: uuid::Uuid,
        new_ttl: Duration,
    ) -> Result<Capability> {
        let mut caps = self.capabilities.lock().unwrap();
        if let Some(cap) = caps.get_mut(&capability_id) {
            cap.expires_at = chrono::Utc::now() + chrono::Duration::from_std(new_ttl).unwrap();
            Ok(cap.clone())
        } else {
            Err(TransportError::Protocol("Capability not found".to_string()).into())
        }
    }

    async fn status(&self) -> Result<crate::client::VaultStatus> {
        Ok(crate::client::VaultStatus {
            version: "mock-v1.0.0".to_string(),
            server_time: chrono::Utc::now(),
            initialized: true,
            sealed: false,
            standby: false,
            performance_mode: Some("standard".to_string()),
            available_storage: Some(1000000000),
            total_storage: Some(2000000000),
        })
    }

    async fn health_check(&self) -> Result<crate::client::HealthStatus> {
        Ok(crate::client::HealthStatus {
            healthy: true,
            details: vec![],
            timestamp: chrono::Utc::now(),
        })
    }

    async fn close(&self) -> Result<()> {
        Ok(())
    }
}