//! # Aether Vault SDK
//! 
//! Security & Secrets Operating System SDK for Rust.
//! 
//! ## Overview
//! 
//! This SDK provides secure, capability-based access to Aether Vault
//! with zero-trust principles and strong lifetime management.
//! 
//! ## Quick Start
//! 
//! ```rust,no_run
//! use aether_vault::{Client, Config, Context};
//! use std::time::Duration;
//! 
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = Config::from_env()?;
//!     let client = Client::new(config).await?;
//!     
//!     let context = Context::builder()
//!         .service("my-app")
//!         .environment("production")
//!         .build()?;
//!     
//!     let capability = client
//!         .request_capability("database", "read", "users", &context, Duration::from_secs(300))
//!         .await?;
//!     
//!     // Use capability within its lifetime
//!     let data = client.access_with_capability(&capability).await?;
//!     
//!     Ok(())
//! }
//! ```
//! 
//! ## Core Principles
//! 
//! - **No long-lived secrets**: All access is capability-based with TTL
//! - **Strong typing**: Rust lifetimes reflect Vault TTLs
//! - **Zero-trust**: Every access is authenticated and audited
//! - **No persistent storage**: SDK never stores secrets locally
//! 
//! ## Modules
//! 
//! - [`client`]: Main Vault client
//! - [`capability`]: Capability-based access control
//! - [`identity`]: Runtime identity management
//! - [`context`]: Execution context modeling
//! - [`transport`]: Network abstraction layer
//! - [`crypto`]: Cryptographic primitives (standard only)
//! - [`audit`]: Automatic audit logging
//! - [`error`]: Strong error typing
//! - [`config`]: Configuration management

pub mod client;
pub mod capability;
pub mod identity;
pub mod context;
pub mod transport;
pub mod crypto;
pub mod audit;
pub mod error;
pub mod config;

// Re-export main types for convenience
pub use client::Client;
pub use capability::{Capability, CapabilityRequest, Domain, Action};
pub use identity::{Identity, WorkloadIdentity};
pub use context::{Context, ContextBuilder};
pub use error::{VaultError, Result};
pub use config::Config;

/// SDK version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
    }
}