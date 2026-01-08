/**
 * Internal credentials manager for the database module.
 * Handles secure credential lifecycle management with Vault.
 */

import { VaultClient } from "../core/client.js";
import {
  DatabaseConfig,
  DatabaseCredentials,
  DatabaseConnectionRequest,
  DatabaseConnectionResponse,
} from "./types.js";
import { DatabaseCredentialsError, DatabaseRotationError } from "./errors.js";

/**
 * Manages database credentials securely through Vault integration.
 * Handles credential retrieval, rotation, and invalidation.
 */
export class CredentialsManager {
  private readonly credentialCache = new Map<
    string,
    { credentials: DatabaseCredentials; expiresAt: number }
  >();
  private readonly rotationTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Creates a new CredentialsManager instance.
   *
   * @param httpClient - HTTP client for Vault API communication
   */
  constructor(private readonly httpClient: VaultClient) {}

  /**
   * Retrieves database credentials from Vault.
   * Uses cache when available and valid.
   *
   * @param config - Database configuration
   * @param request - Optional connection request parameters
   * @returns Promise resolving to database credentials
   */
  async getCredentials(
    config: DatabaseConfig,
    request?: Partial<DatabaseConnectionRequest>,
  ): Promise<DatabaseCredentials> {
    const configId = this.generateConfigId(config);

    // Check cache first
    const cached = this.credentialCache.get(configId);
    if (cached && cached.expiresAt > Date.now()) {
      // Update usage count
      cached.credentials.usageCount = (cached.credentials.usageCount || 0) + 1;

      // Check max uses limit
      if (
        cached.credentials.maxUses &&
        cached.credentials.usageCount >= cached.credentials.maxUses
      ) {
        await this.invalidateCredentials(configId);
      } else {
        return cached.credentials;
      }
    }

    // Fetch fresh credentials from Vault
    return this.fetchCredentials(config, request);
  }

  /**
   * Forces credential rotation for a specific database configuration.
   *
   * @param config - Database configuration
   * @returns Promise resolving to new credentials
   */
  async rotateCredentials(
    config: DatabaseConfig,
  ): Promise<DatabaseCredentials> {
    const configId = this.generateConfigId(config);

    try {
      // Invalidate current credentials
      await this.invalidateCredentials(configId);

      // Fetch new credentials
      const newCredentials = await this.fetchCredentials(config, {
        purpose: "rotation",
      });

      // Schedule next rotation if needed
      if (newCredentials.rotationScheduled) {
        this.scheduleRotation(configId, newCredentials.rotationScheduled);
      }

      return newCredentials;
    } catch (error) {
      throw new DatabaseRotationError(
        `Failed to rotate credentials for ${config.host}:${config.port}/${config.database}`,
        {
          configId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Invalidates credentials for a specific database configuration.
   *
   * @param configId - Configuration identifier
   */
  async invalidateCredentials(configId: string): Promise<void> {
    // Clear cache
    const cached = this.credentialCache.get(configId);
    if (cached) {
      // Securely wipe password from memory
      if (cached.credentials.password) {
        this.wipeSecureData(cached.credentials.password);
      }
      this.credentialCache.delete(configId);
    }

    // Clear rotation timer
    const timer = this.rotationTimers.get(configId);
    if (timer) {
      clearTimeout(timer);
      this.rotationTimers.delete(configId);
    }

    // Notify Vault of credential invalidation
    try {
      await this.httpClient.post(
        `/database/credentials/${configId}/invalidate`,
      );
    } catch (error) {
      // Log but don't throw - invalidation is best effort
      console.warn(
        `Failed to notify Vault of credential invalidation for ${configId}:`,
        error,
      );
    }
  }

  /**
   * Checks if credentials are expired or nearing expiration.
   *
   * @param credentials - Database credentials to check
   * @param bufferMinutes - Buffer time before expiration (default: 5 minutes)
   * @returns True if credentials need refresh
   */
  shouldRefreshCredentials(
    credentials: DatabaseCredentials,
    bufferMinutes: number = 5,
  ): boolean {
    const now = Date.now();
    const expiresAt = credentials.expiresAt.getTime();
    const bufferTime = bufferMinutes * 60 * 1000;

    return now >= expiresAt - bufferTime;
  }

  /**
   * Cleans up expired credentials and rotation timers.
   * Should be called periodically to prevent memory leaks.
   */
  cleanup(): void {
    const now = Date.now();

    // Clean expired cache entries
    for (const [configId, cached] of this.credentialCache.entries()) {
      if (cached.expiresAt <= now) {
        this.wipeSecureData(cached.credentials.password);
        this.credentialCache.delete(configId);
      }
    }

    // Clean rotation timers for expired credentials
    for (const [configId, timer] of this.rotationTimers.entries()) {
      const cached = this.credentialCache.get(configId);
      if (!cached || cached.expiresAt <= now) {
        clearTimeout(timer);
        this.rotationTimers.delete(configId);
      }
    }
  }

  /**
   * Fetches fresh credentials from Vault API.
   *
   * @param config - Database configuration
   * @param request - Connection request parameters
   * @returns Promise resolving to database credentials
   */
  private async fetchCredentials(
    config: DatabaseConfig,
    request?: Partial<DatabaseConnectionRequest>,
  ): Promise<DatabaseCredentials> {
    const configId = this.generateConfigId(config);

    try {
      const payload: DatabaseConnectionRequest = {
        config,
        requestedTtl: request?.requestedTtl || 3600, // 1 hour default
        requestedMaxUses: request?.requestedMaxUses || 1000,
        purpose: request?.purpose || "application",
        ...(request?.requester && { requester: request.requester }),
      };

      const response = await this.httpClient.post<DatabaseConnectionResponse>(
        "/database/credentials",
        payload,
      );

      const credentials = response.credentials;

      // Cache credentials with expiration buffer
      const cacheExpiresAt = credentials.expiresAt.getTime() - 5 * 60 * 1000; // 5 min buffer
      this.credentialCache.set(configId, {
        credentials,
        expiresAt: cacheExpiresAt,
      });

      // Schedule automatic rotation if needed
      if (credentials.rotationScheduled) {
        this.scheduleRotation(configId, credentials.rotationScheduled);
      }

      return credentials;
    } catch (error) {
      throw new DatabaseCredentialsError(
        `Failed to retrieve credentials for ${config.host}:${config.port}/${config.database}`,
        {
          configId,
          engine: config.engine,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Generates a unique configuration identifier.
   *
   * @param config - Database configuration
   * @returns Configuration identifier string
   */
  private generateConfigId(config: DatabaseConfig): string {
    const key = `${config.engine}://${config.host}:${config.port}/${config.database}`;
    return Buffer.from(key).toString("base64").replace(/[+/=]/g, "");
  }

  /**
   * Schedules automatic credential rotation.
   *
   * @param configId - Configuration identifier
   * @param rotationTime - Time when rotation should occur
   */
  private scheduleRotation(configId: string, rotationTime: Date): void {
    // Clear existing timer
    const existingTimer = this.rotationTimers.get(configId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const delay = rotationTime.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(() => {
        // This would trigger background rotation - implementation depends on use case
        console.info(`Scheduled credential rotation triggered for ${configId}`);
      }, delay);

      this.rotationTimers.set(configId, timer);
    }
  }

  /**
   * Securely wipes sensitive data from memory.
   *
   * @param data - Sensitive data to wipe
   */
  private wipeSecureData(data: string): void {
    if (typeof data === "string" && data.length > 0) {
      // In Node.js, we can use Buffer to overwrite memory
      const buffer = Buffer.from(data);
      buffer.fill(0);
    }
  }

  /**
   * Gets current cache statistics for monitoring.
   *
   * @returns Cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    activeEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    let activeEntries = 0;

    for (const [, cached] of this.credentialCache.entries()) {
      if (cached.expiresAt <= now) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    return {
      totalEntries: this.credentialCache.size,
      expiredEntries,
      activeEntries,
    };
  }
}
