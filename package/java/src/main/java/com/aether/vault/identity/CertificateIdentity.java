package com.aether.vault.identity;

import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.Map;

/**
 * Certificate-based identity implementation.
 */
public final class CertificateIdentity extends Identity {
    
    private final X509Certificate certificate;
    private final String subjectDN;
    private final String issuerDN;
    
    private CertificateIdentity(Builder builder) {
        super(builder.identityId, Identity.IdentityType.CERTIFICATE, builder.expiresAt, builder.metadata);
        this.certificate = builder.certificate;
        this.subjectDN = certificate != null ? certificate.getSubjectX500Principal().getName() : null;
        this.issuerDN = certificate != null ? certificate.getIssuerX500Principal().getName() : null;
    }
    
    public X509Certificate getCertificate() {
        return certificate;
    }
    
    public String getSubjectDN() {
        return subjectDN;
    }
    
    public String getIssuerDN() {
        return issuerDN;
    }
    
    @Override
    public void validate() throws InvalidIdentityException {
        if (certificate == null) {
            throw new InvalidIdentityException(identityId, "Certificate cannot be null");
        }
        
        try {
            certificate.checkValidity();
        } catch (Exception e) {
            throw new InvalidIdentityException(identityId, "Certificate is not valid", e);
        }
        
        if (isExpired()) {
            throw new InvalidIdentityException(identityId, "Identity has expired");
        }
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String identityId;
        private X509Certificate certificate;
        private Instant expiresAt;
        private Map<String, String> metadata = Map.of();
        
        public Builder identityId(String identityId) {
            this.identityId = identityId;
            return this;
        }
        
        public Builder certificate(X509Certificate certificate) {
            this.certificate = certificate;
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
        
        public CertificateIdentity build() {
            return new CertificateIdentity(this);
        }
    }
}