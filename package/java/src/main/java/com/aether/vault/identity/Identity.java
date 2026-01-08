package com.aether.vault.identity;

import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Abstract base class for identity providers.
 */
public abstract class Identity {
    
    protected final String identityId;
    protected final IdentityType type;
    protected final Instant expiresAt;
    protected final Map<String, String> metadata;
    
    protected Identity(String identityId, IdentityType type, Instant expiresAt, Map<String, String> metadata) {
        this.identityId = Objects.requireNonNull(identityId, "Identity ID cannot be null");
        this.type = Objects.requireNonNull(type, "Identity type cannot be null");
        this.expiresAt = expiresAt;
        this.metadata = Map.copyOf(metadata);
    }
    
    public String getIdentityId() {
        return identityId;
    }
    
    public IdentityType getType() {
        return type;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public Map<String, String> getMetadata() {
        return metadata;
    }
    
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
    
    public abstract void validate() throws InvalidIdentityException;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Identity identity = (Identity) o;
        return Objects.equals(identityId, identity.identityId) &&
               type == identity.type;
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(identityId, type);
    }
    
    @Override
    public String toString() {
        return String.format("Identity{id='%s', type=%s, expiresAt=%s}",
                identityId, type, expiresAt);
    }
    
    public enum IdentityType {
        TOKEN,
        CERTIFICATE,
        WORKLOAD,
        OAUTH2,
        MTLS
    }
}