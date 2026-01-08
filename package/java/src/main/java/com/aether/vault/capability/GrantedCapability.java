package com.aether.vault.capability;

import com.aether.vault.context.Context;
import com.aether.vault.error.CapabilityExpiredException;

import java.time.Instant;
import java.util.Objects;
import java.util.Set;

/**
 * Represents a granted capability with context and TTL.
 * Immutable and thread-safe.
 */
public final class GrantedCapability {
    
    private final Capability capability;
    private final Context context;
    private final TTL ttl;
    private final String capabilityId;
    private final Instant grantedAt;
    private final Set<String> permissions;
    
    private GrantedCapability(Builder builder) {
        this.capability = Objects.requireNonNull(builder.capability, "Capability cannot be null");
        this.context = Objects.requireNonNull(builder.context, "Context cannot be null");
        this.ttl = Objects.requireNonNull(builder.ttl, "TTL cannot be null");
        this.capabilityId = Objects.requireNonNull(builder.capabilityId, "Capability ID cannot be null");
        this.grantedAt = Instant.now();
        this.permissions = Set.copyOf(builder.permissions);
    }
    
    public Capability getCapability() {
        return capability;
    }
    
    public Context getContext() {
        return context;
    }
    
    public TTL getTTL() {
        return ttl;
    }
    
    public String getCapabilityId() {
        return capabilityId;
    }
    
    public Instant getGrantedAt() {
        return grantedAt;
    }
    
    public Set<String> getPermissions() {
        return permissions;
    }
    
    public boolean isValid() {
        return !ttl.isExpired();
    }
    
    public void validate() throws CapabilityExpiredException {
        if (ttl.isExpired()) {
            throw new CapabilityExpiredException(capabilityId, ttl.getExpiresAt().toEpochMilli());
        }
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GrantedCapability that = (GrantedCapability) o;
        return Objects.equals(capabilityId, that.capabilityId) &&
               Objects.equals(capability, that.capability) &&
               Objects.equals(context, that.context);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(capabilityId, capability, context);
    }
    
    @Override
    public String toString() {
        return String.format("GrantedCapability{id='%s', capability=%s, context=%s, ttl=%s, valid=%s}",
                capabilityId, capability, context, ttl, isValid());
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private Capability capability;
        private Context context;
        private TTL ttl;
        private String capabilityId;
        private Set<String> permissions = Set.of();
        
        public Builder capability(Capability capability) {
            this.capability = capability;
            return this;
        }
        
        public Builder context(Context context) {
            this.context = context;
            return this;
        }
        
        public Builder ttl(TTL ttl) {
            this.ttl = ttl;
            return this;
        }
        
        public Builder capabilityId(String capabilityId) {
            this.capabilityId = capabilityId;
            return this;
        }
        
        public Builder permissions(Set<String> permissions) {
            this.permissions = permissions;
            return this;
        }
        
        public GrantedCapability build() {
            return new GrantedCapability(this);
        }
    }
}