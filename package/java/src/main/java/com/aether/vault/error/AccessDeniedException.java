package com.aether.vault.error;

/**
 * Exception thrown when access to a vault resource is denied.
 */
public class AccessDeniedException extends AetherVaultException {
    
    private final String resourceId;
    private final String requestedAction;
    
    public AccessDeniedException(String resourceId, String requestedAction) {
        super("ACCESS_DENIED", 
              String.format("Access denied to resource '%s' for action '%s'", resourceId, requestedAction));
        this.resourceId = resourceId;
        this.requestedAction = requestedAction;
    }
    
    public AccessDeniedException(String resourceId, String requestedAction, String reason) {
        super("ACCESS_DENIED", 
              String.format("Access denied to resource '%s' for action '%s': %s", resourceId, requestedAction, reason));
        this.resourceId = resourceId;
        this.requestedAction = requestedAction;
    }
    
    public String getResourceId() {
        return resourceId;
    }
    
    public String getRequestedAction() {
        return requestedAction;
    }
}