package com.aether.vault.capability;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents a Time-To-Live (TTL) for capabilities.
 * Immutable and thread-safe.
 */
public final class TTL {
    
    private final Duration duration;
    private final Instant expiresAt;
    
    private TTL(Duration duration) {
        this.duration = Objects.requireNonNull(duration, "Duration cannot be null");
        this.expiresAt = Instant.now().plus(duration);
    }
    
    public Duration getDuration() {
        return duration;
    }
    
    public Instant getExpiresAt() {
        return expiresAt;
    }
    
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
    
    public long getRemainingSeconds() {
        return Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());
    }
    
    public static TTL of(Duration duration) {
        return new TTL(duration);
    }
    
    public static TTL seconds(long seconds) {
        return new TTL(Duration.ofSeconds(seconds));
    }
    
    public static TTL minutes(long minutes) {
        return new TTL(Duration.ofMinutes(minutes));
    }
    
    public static TTL hours(long hours) {
        return new TTL(Duration.ofHours(hours));
    }
    
    public static TTL days(long days) {
        return new TTL(Duration.ofDays(days));
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TTL ttl = (TTL) o;
        return Objects.equals(duration, ttl.duration) && Objects.equals(expiresAt, ttl.expiresAt);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(duration, expiresAt);
    }
    
    @Override
    public String toString() {
        return String.format("TTL{duration=%s, expiresAt=%s, remainingSeconds=%d}",
                duration, expiresAt, getRemainingSeconds());
    }
}