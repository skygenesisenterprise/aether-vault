package com.aether.vault.context;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Represents the execution context for vault operations.
 * Immutable and thread-safe.
 */
public final class Context {
    
    private final String service;
    private final String environment;
    private final String namespace;
    private final String pipeline;
    private final Map<String, String> metadata;
    private final String requestId;
    
    private Context(Builder builder) {
        this.service = Objects.requireNonNull(builder.service, "Service cannot be null");
        this.environment = Objects.requireNonNull(builder.environment, "Environment cannot be null");
        this.namespace = builder.namespace;
        this.pipeline = builder.pipeline;
        this.metadata = Map.copyOf(builder.metadata);
        this.requestId = builder.requestId;
    }
    
    public String getService() {
        return service;
    }
    
    public String getEnvironment() {
        return environment;
    }
    
    public String getNamespace() {
        return namespace;
    }
    
    public String getPipeline() {
        return pipeline;
    }
    
    public Map<String, String> getMetadata() {
        return metadata;
    }
    
    public String getRequestId() {
        return requestId;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Context context = (Context) o;
        return Objects.equals(service, context.service) &&
               Objects.equals(environment, context.environment) &&
               Objects.equals(namespace, context.namespace) &&
               Objects.equals(pipeline, context.pipeline) &&
               Objects.equals(metadata, context.metadata) &&
               Objects.equals(requestId, context.requestId);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(service, environment, namespace, pipeline, metadata, requestId);
    }
    
    @Override
    public String toString() {
        return String.format("Context{service='%s', environment='%s', namespace='%s', pipeline='%s', requestId='%s'}",
                service, environment, namespace, pipeline, requestId);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String service;
        private String environment;
        private String namespace;
        private String pipeline;
        private Map<String, String> metadata = new HashMap<>();
        private String requestId;
        
        public Builder service(String service) {
            this.service = service;
            return this;
        }
        
        public Builder environment(String environment) {
            this.environment = environment;
            return this;
        }
        
        public Builder namespace(String namespace) {
            this.namespace = namespace;
            return this;
        }
        
        public Builder pipeline(String pipeline) {
            this.pipeline = pipeline;
            return this;
        }
        
        public Builder metadata(Map<String, String> metadata) {
            this.metadata = new HashMap<>(metadata);
            return this;
        }
        
        public Builder addMetadata(String key, String value) {
            this.metadata.put(key, value);
            return this;
        }
        
        public Builder requestId(String requestId) {
            this.requestId = requestId;
            return this;
        }
        
        public Context build() {
            return new Context(this);
        }
    }
}