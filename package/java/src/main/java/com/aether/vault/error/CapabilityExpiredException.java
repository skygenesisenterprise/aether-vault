package com.aether.vault.error;

/**
 * Exception thrown when a capability has expired before use.
 */
public class CapabilityExpiredException extends AetherVaultException {
    
    private final String capabilityId;
    private final long expirationTime;
    
    public CapabilityExpiredException(String capabilityId, long expirationTime) {
        super("CAPABILITY_EXPIRED",
              String.format("Capability '%s' expired at %d", capabilityId, expirationTime));
        this.capabilityId = capabilityId;
        this.expirationTime = expirationTime;
    }
    
    public String getCapabilityId() {
        return capabilityId;
    }
    
    public long getExpirationTime() {
        return expirationTime;
    }
}