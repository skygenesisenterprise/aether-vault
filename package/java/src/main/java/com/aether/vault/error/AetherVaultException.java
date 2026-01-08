package com.aether.vault.error;

/**
 * Base exception for all Aether Vault SDK exceptions.
 */
public class AetherVaultException extends Exception {
    
    private final String errorCode;
    
    public AetherVaultException(String message) {
        super(message);
        this.errorCode = "VAULT_GENERIC_ERROR";
    }
    
    public AetherVaultException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "VAULT_GENERIC_ERROR";
    }
    
    public AetherVaultException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public AetherVaultException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}