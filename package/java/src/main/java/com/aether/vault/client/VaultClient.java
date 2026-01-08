package com.aether.vault.client;

import com.aether.vault.capability.Capability;
import com.aether.vault.capability.GrantedCapability;
import com.aether.vault.capability.TTL;
import com.aether.vault.context.Context;
import com.aether.vault.error.AetherVaultException;
import com.aether.vault.error.AccessDeniedException;
import com.aether.vault.error.CapabilityExpiredException;
import com.aether.vault.error.PolicyViolationException;
import com.aether.vault.identity.Identity;
import com.aether.vault.transport.Transport;
import com.aether.vault.audit.AuditLogger;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Main client interface for Aether Vault operations.
 * Thread-safe with proper lifecycle management.
 */
public interface VaultClient extends AutoCloseable {
    
    /**
     * Requests a capability with the specified context and TTL.
     */
    GrantedCapability requestCapability(Capability capability, Context context, TTL ttl) 
            throws AetherVaultException;
    
    /**
     * Asynchronously requests a capability.
     */
    CompletableFuture<GrantedCapability> requestCapabilityAsync(Capability capability, Context context, TTL ttl);
    
    /**
     * Revokes a granted capability.
     */
    void revokeCapability(String capabilityId) throws AetherVaultException;
    
    /**
     * Asynchronously revokes a capability.
     */
    CompletableFuture<Void> revokeCapabilityAsync(String capabilityId);
    
    /**
     * Validates a granted capability.
     */
    boolean validateCapability(GrantedCapability grantedCapability);
    
    /**
     * Gets the transport layer used by this client.
     */
    Transport getTransport();
    
    /**
     * Gets the audit logger.
     */
    AuditLogger getAuditLogger();
    
    /**
     * Checks if the client is connected.
     */
    boolean isConnected();
    
    /**
     * Builder for creating VaultClient instances.
     */
    interface Builder {
        Builder transport(Transport transport);
        Builder identity(Identity identity);
        Builder auditLogger(AuditLogger auditLogger);
        Builder connectionTimeout(long timeout, TimeUnit unit);
        Builder requestTimeout(long timeout, TimeUnit unit);
        Builder retryPolicy(RetryPolicy retryPolicy);
        VaultClient build();
    }
    
    /**
     * Retry policy configuration.
     */
    interface RetryPolicy {
        int getMaxRetries();
        long getRetryDelay(TimeUnit unit);
        boolean shouldRetry(Exception exception);
        
        static RetryPolicy defaultPolicy() {
            return new DefaultRetryPolicy();
        }
        
        static RetryPolicy custom(int maxRetries, long retryDelay, TimeUnit unit) {
            return new CustomRetryPolicy(maxRetries, retryDelay, unit);
        }
    }
    
    /**
     * Factory for creating VaultClient builders.
     */
    static Builder builder() {
        return new VaultClientBuilder();
    }
}