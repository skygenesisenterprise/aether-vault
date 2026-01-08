package com.aether.vault.identity;

import java.time.Instant;
import java.util.Map;

/**
 * Workload-based identity implementation for service-to-service authentication.
 */
public final class WorkloadIdentity extends Identity {
    
    private final String workloadName;
    private final String workloadNamespace;
    private final String workloadType;
    
    private WorkloadIdentity(Builder builder) {
        super(builder.identityId, Identity.IdentityType.WORKLOAD, builder.expiresAt, builder.metadata);
        this.workloadName = builder.workloadName;
        this.workloadNamespace = builder.workloadNamespace;
        this.workloadType = builder.workloadType;
    }
    
    public String getWorkloadName() {
        return workloadName;
    }
    
    public String getWorkloadNamespace() {
        return workloadNamespace;
    }
    
    public String getWorkloadType() {
        return workloadType;
    }
    
    @Override
    public void validate() throws InvalidIdentityException {
        if (workloadName == null || workloadName.trim().isEmpty()) {
            throw new InvalidIdentityException(identityId, "Workload name cannot be null or empty");
        }
        
        if (workloadNamespace == null || workloadNamespace.trim().isEmpty()) {
            throw new InvalidIdentityException(identityId, "Workload namespace cannot be null or empty");
        }
        
        if (isExpired()) {
            throw new InvalidIdentityException(identityId, "Workload identity has expired");
        }
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String identityId;
        private String workloadName;
        private String workloadNamespace;
        private String workloadType = "service";
        private Instant expiresAt;
        private Map<String, String> metadata = Map.of();
        
        public Builder identityId(String identityId) {
            this.identityId = identityId;
            return this;
        }
        
        public Builder workloadName(String workloadName) {
            this.workloadName = workloadName;
            return this;
        }
        
        public Builder workloadNamespace(String workloadNamespace) {
            this.workloadNamespace = workloadNamespace;
            return this;
        }
        
        public Builder workloadType(String workloadType) {
            this.workloadType = workloadType;
            return this;
        }
        
        public Builder expiresAt(Instant expiresAt) {
            this.expiresAt = expiresAt;
            return this;
        }
        
        public Builder metadata(Map<String, String> metadata) {
            this.metadata = metadata;
            return this;
        }
        
        public WorkloadIdentity build() {
            return new WorkloadIdentity(this);
        }
    }
}