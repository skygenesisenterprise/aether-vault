/**
 * Internal connection registry for the database module.
 * Tracks active database connections and their lifecycle.
 */

import { DatabaseConfig, DatabaseConnectionEntry } from "./types.js";

/**
 * Registry for managing active database connections.
 * Provides connection tracking, state management, and cleanup.
 */
export class ConnectionRegistry {
  private readonly connections = new Map<string, DatabaseConnectionEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  /**
   * Creates a new ConnectionRegistry instance.
   * Sets up periodic cleanup of expired connections.
   */
  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Registers a new database connection.
   *
   * @param config - Database configuration
   * @returns Connection identifier
   */
  register(config: DatabaseConfig): string {
    const connectionId = this.generateConnectionId(config);
    const now = new Date();

    const entry: DatabaseConnectionEntry = {
      id: connectionId,
      config,
      createdAt: now,
      lastActivityAt: now,
      state: "active",
      operationCount: 0,
    };

    this.connections.set(connectionId, entry);
    return connectionId;
  }

  /**
   * Retrieves a connection entry by identifier.
   *
   * @param connectionId - Connection identifier
   * @returns Connection entry or null if not found
   */
  get(connectionId: string): DatabaseConnectionEntry | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Updates connection state and activity.
   *
   * @param connectionId - Connection identifier
   * @param updates - Partial connection entry updates
   */
  update(
    connectionId: string,
    updates: Partial<DatabaseConnectionEntry>,
  ): void {
    const existing = this.connections.get(connectionId);
    if (existing) {
      const updated: DatabaseConnectionEntry = {
        ...existing,
        ...updates,
        lastActivityAt: new Date(),
        operationCount:
          updates.operationCount !== undefined
            ? updates.operationCount
            : existing.operationCount + 1,
      };

      this.connections.set(connectionId, updated);
    }
  }

  /**
   * Marks a connection as invalid and removes it from registry.
   *
   * @param connectionId - Connection identifier
   */
  invalidate(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Update state before removal for audit purposes
      connection.state = "expired";
      this.connections.set(connectionId, connection);

      // Remove from active registry
      setTimeout(() => {
        this.connections.delete(connectionId);
      }, 1000); // Keep for 1 second for audit trail
    }
  }

  /**
   * Lists all active connections matching filter criteria.
   *
   * @param filter - Optional filter criteria
   * @returns Array of connection entries
   */
  list(filter?: {
    state?: DatabaseConnectionEntry["state"];
    engine?: string;
    host?: string;
  }): DatabaseConnectionEntry[] {
    let connections = Array.from(this.connections.values());

    if (filter) {
      connections = connections.filter((conn) => {
        if (filter.state && conn.state !== filter.state) {
          return false;
        }
        if (filter.engine && conn.config.engine !== filter.engine) {
          return false;
        }
        if (filter.host && conn.config.host !== filter.host) {
          return false;
        }
        return true;
      });
    }

    return connections;
  }

  /**
   * Gets connection statistics for monitoring.
   *
   * @returns Connection statistics
   */
  getStats(): {
    total: number;
    byState: Record<DatabaseConnectionEntry["state"], number>;
    byEngine: Record<string, number>;
    totalOperations: number;
    averageOperationsPerConnection: number;
  } {
    const connections = Array.from(this.connections.values());

    const byState: Record<DatabaseConnectionEntry["state"], number> = {
      active: 0,
      idle: 0,
      expired: 0,
      error: 0,
    };

    const byEngine: Record<string, number> = {};
    let totalOperations = 0;

    connections.forEach((conn) => {
      byState[conn.state]++;
      byEngine[conn.config.engine] = (byEngine[conn.config.engine] || 0) + 1;
      totalOperations += conn.operationCount;
    });

    return {
      total: connections.length,
      byState,
      byEngine,
      totalOperations,
      averageOperationsPerConnection:
        connections.length > 0 ? totalOperations / connections.length : 0,
    };
  }

  /**
   * Finds connections that have been idle for longer than specified duration.
   *
   * @param idleMinutes - Maximum idle time in minutes (default: 30)
   * @returns Array of idle connection identifiers
   */
  findIdleConnections(idleMinutes: number = 30): string[] {
    const now = Date.now();
    const idleThreshold = idleMinutes * 60 * 1000;

    return Array.from(this.connections.entries())
      .filter(([_, conn]) => {
        const idleTime = now - conn.lastActivityAt.getTime();
        return idleTime > idleThreshold && conn.state === "idle";
      })
      .map(([id, _]) => id);
  }

  /**
   * Invalidates idle connections to prevent resource leaks.
   *
   * @param idleMinutes - Maximum idle time in minutes (default: 30)
   * @returns Number of connections invalidated
   */
  invalidateIdleConnections(idleMinutes: number = 30): number {
    const idleConnectionIds = this.findIdleConnections(idleMinutes);

    idleConnectionIds.forEach((id) => {
      this.invalidate(id);
    });

    return idleConnectionIds.length;
  }

  /**
   * Sets connection error information.
   *
   * @param connectionId - Connection identifier
   * @param error - Error information
   */
  setError(
    connectionId: string,
    error: { message: string; code?: string },
  ): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.update(connectionId, {
        state: "error",
        lastError: {
          ...error,
          timestamp: new Date(),
        },
      });
    }
  }

  /**
   * Clears connection error and sets state to active.
   *
   * @param connectionId - Connection identifier
   */
  clearError(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.update(connectionId, {
        state: "active",
      });
    }
  }

  /**
   * Cleans up expired and old connections.
   * Called automatically by the interval timer.
   */
  private cleanup(): void {
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [connectionId, connection] of this.connections.entries()) {
      const age = now - connection.createdAt.getTime();

      // Remove old connections
      if (age > cleanupThreshold) {
        this.connections.delete(connectionId);
        continue;
      }

      // Mark idle connections as idle
      const idleTime = now - connection.lastActivityAt.getTime();
      if (idleTime > 30 * 60 * 1000 && connection.state === "active") {
        // 30 minutes
        connection.state = "idle";
        this.connections.set(connectionId, connection);
      }
    }
  }

  /**
   * Generates a unique connection identifier.
   *
   * @param config - Database configuration
   * @returns Connection identifier string
   */
  private generateConnectionId(config: DatabaseConfig): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const base = `${config.engine}-${config.host}-${config.port}-${config.database}`;
    const encoded = Buffer.from(base)
      .toString("base64")
      .replace(/[+/=]/g, "")
      .substring(0, 16);

    return `conn_${encoded}_${timestamp}_${random}`;
  }

  /**
   * Destroys the connection registry and cleans up resources.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Invalidate all connections
    const connectionIds = Array.from(this.connections.keys());
    connectionIds.forEach((id) => this.invalidate(id));

    // Clear registry
    this.connections.clear();
  }
}
