package com.aether.vault.capability;

import java.time.Instant;
import java.util.Objects;
import java.util.Set;

/**
 * Represents a capability with specific domain, action, and target.
 * Immutable and thread-safe.
 */
public final class Capability {
    
    private final String domain;
    private final Action action;
    private final String target;
    private final Set<String> constraints;
    private final Instant createdAt;
    
    private Capability(Builder builder) {
        this.domain = Objects.requireNonNull(builder.domain, "Domain cannot be null");
        this.action = Objects.requireNonNull(builder.action, "Action cannot be null");
        this.target = Objects.requireNonNull(builder.target, "Target cannot be null");
        this.constraints = Set.copyOf(builder.constraints);
        this.createdAt = Instant.now();
    }
    
    public String getDomain() {
        return domain;
    }
    
    public Action getAction() {
        return action;
    }
    
    public String getTarget() {
        return target;
    }
    
    public Set<String> getConstraints() {
        return constraints;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Capability that = (Capability) o;
        return Objects.equals(domain, that.domain) &&
               action == that.action &&
               Objects.equals(target, that.target) &&
               Objects.equals(constraints, that.constraints);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(domain, action, target, constraints);
    }
    
    @Override
    public String toString() {
        return String.format("Capability{domain='%s', action=%s, target='%s', constraints=%s}",
                domain, action, target, constraints);
    }
    
    /**
     * Creates a new capability builder for the specified domain.
     */
    public static DomainBuilder domain(String domain) {
        return new DomainBuilder(domain);
    }
    
    /**
     * Available actions for capabilities.
     */
    public enum Action {
        READ("read"),
        WRITE("write"),
        DELETE("delete"),
        EXECUTE("execute"),
        LIST("list"),
        SIGN("sign"),
        VERIFY("verify");
        
        private final String value;
        
        Action(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        @Override
        public String toString() {
            return value;
        }
    }
    
    /**
     * Fluent builder for capabilities.
     */
    public static class Builder {
        private String domain;
        private Action action;
        private String target;
        private Set<String> constraints = Set.of();
        
        public Builder domain(String domain) {
            this.domain = domain;
            return this;
        }
        
        public Builder action(Action action) {
            this.action = action;
            return this;
        }
        
        public Builder target(String target) {
            this.target = target;
            return this;
        }
        
        public Builder constraints(Set<String> constraints) {
            this.constraints = constraints;
            return this;
        }
        
        public Capability build() {
            return new Capability(this);
        }
    }
    
    /**
     * Domain-specific builder for more fluent API.
     */
    public static class DomainBuilder {
        private final String domain;
        
        public DomainBuilder(String domain) {
            this.domain = domain;
        }
        
        public ActionBuilder action(Action action) {
            return new ActionBuilder(domain, action);
        }
    }
    
    /**
     * Action-specific builder.
     */
    public static class ActionBuilder {
        private final String domain;
        private final Action action;
        
        public ActionBuilder(String domain, Action action) {
            this.domain = domain;
            this.action = action;
        }
        
        public TargetBuilder target(String target) {
            return new TargetBuilder(domain, action, target);
        }
    }
    
    /**
     * Final builder with target specified.
     */
    public static class TargetBuilder {
        private final String domain;
        private final Action action;
        private final String target;
        private Set<String> constraints = Set.of();
        
        public TargetBuilder(String domain, Action action, String target) {
            this.domain = domain;
            this.action = action;
            this.target = target;
        }
        
        public TargetBuilder constraints(Set<String> constraints) {
            this.constraints = constraints;
            return this;
        }
        
        public Capability build() {
            return new Capability() {
                {
                    // Use anonymous class to set final fields
                    try {
                        var field = Capability.class.getDeclaredField("domain");
                        field.setAccessible(true);
                        field.set(this, domain);
                        
                        field = Capability.class.getDeclaredField("action");
                        field.setAccessible(true);
                        field.set(this, action);
                        
                        field = Capability.class.getDeclaredField("target");
                        field.setAccessible(true);
                        field.set(this, target);
                        
                        field = Capability.class.getDeclaredField("constraints");
                        field.setAccessible(true);
                        field.set(this, Set.copyOf(constraints));
                        
                        field = Capability.class.getDeclaredField("createdAt");
                        field.setAccessible(true);
                        field.set(this, Instant.now());
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to create capability", e);
                    }
                }
            };
        }
    }
}