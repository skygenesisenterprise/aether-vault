package com.aether.vault.error;

/**
 * Exception thrown when a policy violation occurs.
 */
public class PolicyViolationException extends AetherVaultException {
    
    private final String policyName;
    private final String violationDetails;
    
    public PolicyViolationException(String policyName, String violationDetails) {
        super("POLICY_VIOLATION",
              String.format("Policy '%s' violated: %s", policyName, violationDetails));
        this.policyName = policyName;
        this.violationDetails = violationDetails;
    }
    
    public String getPolicyName() {
        return policyName;
    }
    
    public String getViolationDetails() {
        return violationDetails;
    }
}