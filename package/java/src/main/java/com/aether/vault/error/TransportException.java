package com.aether.vault.error;

/**
 * Exception thrown when transport-related errors occur.
 */
public class TransportException extends AetherVaultException {
    
    private final String transportType;
    private final int statusCode;
    
    public TransportException(String transportType, String message) {
        super("TRANSPORT_ERROR", message);
        this.transportType = transportType;
        this.statusCode = -1;
    }
    
    public TransportException(String transportType, int statusCode, String message) {
        super("TRANSPORT_ERROR", message);
        this.transportType = transportType;
        this.statusCode = statusCode;
    }
    
    public TransportException(String transportType, String message, Throwable cause) {
        super("TRANSPORT_ERROR", message, cause);
        this.transportType = transportType;
        this.statusCode = -1;
    }
    
    public String getTransportType() {
        return transportType;
    }
    
    public int getStatusCode() {
        return statusCode;
    }
}