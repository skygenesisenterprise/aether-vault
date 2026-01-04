import { VaultClient } from "../core/client.js";

/**
 * Secret interface for vault operations.
 */
export interface Secret {
  /** Unique secret identifier */
  id: string;

  /** Secret name/key */
  name: string;

  /** Secret value (will be redacted in most responses) */
  value?: string;

  /** Secret description */
  description?: string;

  /** Secret metadata */
  metadata?: Record<string, unknown>;

  /** Secret tags for categorization */
  tags?: string[];

  /** Secret creation timestamp */
  createdAt: string;

  /** Secret last update timestamp */
  updatedAt: string;

  /** Secret expiration timestamp (optional) */
  expiresAt?: string;

  /** Whether the secret is expired */
  expired: boolean;

  /** Whether the secret is archived */
  archived: boolean;
}

/**
 * Secret creation request interface.
 */
export interface CreateSecretRequest {
  /** Secret name/key */
  name: string;

  /** Secret value */
  value: string;

  /** Secret description */
  description?: string;

  /** Secret metadata */
  metadata?: Record<string, unknown>;

  /** Secret tags */
  tags?: string[];

  /** Secret expiration timestamp (optional) */
  expiresAt?: string;
}

/**
 * Secret update request interface.
 */
export interface UpdateSecretRequest {
  /** New secret value (optional) */
  value?: string;

  /** New secret description */
  description?: string;

  /** Updated secret metadata */
  metadata?: Record<string, unknown>;

  /** Updated secret tags */
  tags?: string[];

  /** New expiration timestamp */
  expiresAt?: string;
}

/**
 * Secret list response interface.
 */
export interface SecretListResponse {
  /** Array of secrets */
  secrets: Secret[];

  /** Total number of secrets */
  total: number;

  /** Current page number */
  page: number;

  /** Number of secrets per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Secret filter parameters interface.
 */
export interface SecretFilterParams extends Record<string, unknown> {
  /** Page number (default: 1) */
  page?: number;

  /** Number of items per page (default: 20) */
  pageSize?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: "asc" | "desc";

  /** Filter by tags */
  tags?: string[];

  /** Search in name or description */
  search?: string;

  /** Filter by archived status */
  archived?: boolean;

  /** Filter by expired status */
  expired?: boolean;
}

/**
 * Client for managing secrets in Aether Vault.
 */
export class SecretsClient {
  /**
   * Creates a new SecretsClient instance.
   *
   * @param httpClient - HTTP client for API communication
   */
  constructor(private readonly httpClient: VaultClient) {}

  /**
   * Lists all secrets with optional filtering and pagination.
   *
   * @param params - Optional filter parameters
   * @returns Promise resolving to paginated secret list
   *
   * @example
   * ```typescript
   * const secrets = await vault.secrets.list({
   *   page: 1,
   *   pageSize: 20,
   *   search: "database",
   *   tags: ["production"]
   * });
   * ```
   */
  public async list(params?: SecretFilterParams): Promise<SecretListResponse> {
    return this.httpClient.get<SecretListResponse>("/secrets", params);
  }

  /**
   * Gets a secret by its ID or name.
   *
   * @param id - Secret ID or name
   * @param includeValue - Whether to include the secret value in response
   * @returns Promise resolving to the secret details
   *
   * @example
   * ```typescript
   * const secret = await vault.secrets.get("DATABASE_URL", true);
   * console.log(secret.value); // The actual secret value
   * ```
   */
  public async get(id: string, includeValue: boolean = false): Promise<Secret> {
    return this.httpClient.get<Secret>(`/secrets/${id}`, {
      includeValue: includeValue.toString(),
    });
  }

  /**
   * Creates a new secret.
   *
   * @param secret - Secret creation data
   * @returns Promise resolving to the created secret
   *
   * @example
   * ```typescript
   * const secret = await vault.secrets.create({
   *   name: "DATABASE_URL",
   *   value: "postgresql://user:pass@localhost:5432/db",
   *   description: "Production database connection",
   *   tags: ["database", "production"]
   * });
   * ```
   */
  public async create(secret: CreateSecretRequest): Promise<Secret> {
    return this.httpClient.post<Secret>("/secrets", secret);
  }

  /**
   * Updates an existing secret.
   *
   * @param id - Secret ID or name
   * @param updates - Secret update data
   * @returns Promise resolving to the updated secret
   *
   * @example
   * ```typescript
   * const updated = await vault.secrets.update("DATABASE_URL", {
   *   description: "Updated description",
   *   tags: ["database", "production", "updated"]
   * });
   * ```
   */
  public async update(
    id: string,
    updates: UpdateSecretRequest,
  ): Promise<Secret> {
    return this.httpClient.put<Secret>(`/secrets/${id}`, updates);
  }

  /**
   * Deletes a secret.
   *
   * @param id - Secret ID or name
   * @returns Promise resolving when the secret is deleted
   *
   * @example
   * ```typescript
   * await vault.secrets.delete("DATABASE_URL");
   * ```
   */
  public async delete(id: string): Promise<void> {
    return this.httpClient.delete<void>(`/secrets/${id}`);
  }

  /**
   * Archives a secret (soft delete).
   *
   * @param id - Secret ID or name
   * @returns Promise resolving to the archived secret
   *
   * @example
   * ```typescript
   * const archived = await vault.secrets.archive("OLD_SECRET");
   * ```
   */
  public async archive(id: string): Promise<Secret> {
    return this.httpClient.post<Secret>(`/secrets/${id}/archive`);
  }

  /**
   * Restores an archived secret.
   *
   * @param id - Secret ID or name
   * @returns Promise resolving to the restored secret
   *
   * @example
   * ```typescript
   * const restored = await vault.secrets.restore("OLD_SECRET");
   * ```
   */
  public async restore(id: string): Promise<Secret> {
    return this.httpClient.post<Secret>(`/secrets/${id}/restore`);
  }

  /**
   * Rotates a secret value.
   *
   * @param id - Secret ID or name
   * @param newValue - New secret value (optional, server may generate)
   * @returns Promise resolving to the updated secret with new value
   *
   * @example
   * ```typescript
   * const rotated = await vault.secrets.rotate("API_KEY", "new-secret-value");
   * console.log(rotated.value); // New secret value
   * ```
   */
  public async rotate(id: string, newValue?: string): Promise<Secret> {
    const payload = newValue ? { value: newValue } : {};
    return this.httpClient.post<Secret>(`/secrets/${id}/rotate`, payload);
  }

  /**
   * Gets the secret value directly.
   *
   * @param id - Secret ID or name
   * @returns Promise resolving to the secret value only
   *
   * @example
   * ```typescript
   * const value = await vault.secrets.getValue("DATABASE_URL");
   * console.log(value); // Just the value string
   * ```
   */
  public async getValue(id: string): Promise<string> {
    const response = await this.httpClient.get<{ value: string }>(
      `/secrets/${id}/value`,
    );
    return response.value;
  }

  /**
   * Checks if a secret exists.
   *
   * @param id - Secret ID or name
   * @returns Promise resolving to true if the secret exists
   *
   * @example
   * ```typescript
   * const exists = await vault.secrets.exists("DATABASE_URL");
   * if (exists) {
   *   console.log("Secret exists");
   * }
   * ```
   */
  public async exists(id: string): Promise<boolean> {
    try {
      await this.httpClient.get<void>(`/secrets/${id}/exists`);
      return true;
    } catch (error) {
      // If we get a 404, the secret doesn't exist
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NOT_FOUND"
      ) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }
}
