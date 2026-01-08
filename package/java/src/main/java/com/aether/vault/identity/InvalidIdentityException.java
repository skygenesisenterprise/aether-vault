package com.aether.vault.identity;

/**
 * Exception thrown when an identity is invalid.
 */
public class InvalidIdentityException extends Exception {
    
    private final String identityId;
    private final String reason;
    
    public InvalidIdentityException(String identityId, String reason) {
        super(String.format("Invalid identity '%s': %s", identityId, reason));
        this.identityId = identityId;
        this.reason = reason;
    }
    
    public InvalidIdentityException(String identityId, String reason, Throwable cause) {
        super(String.format("Invalid identity '%s': %s", identityId, reason), cause);
        this.identityId = identityId;
        this.reason = reason;
    }
    
    public String getIdentityId() {
        return identityId;
    }
    
    public String getReason() {
        return reason;
    }
}