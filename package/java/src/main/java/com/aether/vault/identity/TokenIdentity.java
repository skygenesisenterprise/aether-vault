package com.aether.vault.identity;

import java.time.Instant;
import java.util.Map;

/**
 * Token-based identity implementation.
 */
public final class TokenIdentity extends Identity {
    
    private final String token;
    private final TokenType tokenType;
    
    private TokenIdentity(Builder builder) {
        super(builder.identityId, Identity.IdentityType.TOKEN, builder.expiresAt, builder.metadata);
        this.token = builder.token;
        this.tokenType = builder.tokenType;
    }
    
    public String getToken() {
        return token;
    }
    
    public TokenType getTokenType() {
        return tokenType;
    }
    
    @Override
    public void validate() throws InvalidIdentityException {
        if (token == null || token.trim().isEmpty()) {
            throw new InvalidIdentityException(identityId, "Token cannot be null or empty");
        }
        
        if (isExpired()) {
            throw new InvalidIdentityException(identityId, "Token has expired");
        }
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String identityId;
        private String token;
        private TokenType tokenType = TokenType.BEARER;
        private Instant expiresAt;
        private Map<String, String> metadata = Map.of();
        
        public Builder identityId(String identityId) {
            this.identityId = identityId;
            return this;
        }
        
        public Builder token(String token) {
            this.token = token;
            return this;
        }
        
        public Builder tokenType(TokenType tokenType) {
            this.tokenType = tokenType;
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
        
        public TokenIdentity build() {
            return new TokenIdentity(this);
        }
    }
    
    public enum TokenType {
        BEARER,
        JWT,
        OPAQUE
    }
}