import { VaultClient } from "../core/client.js";

/**
 * TOTP configuration interface.
 */
export interface TotpConfig {
  /** Name/identifier for the TOTP (usually service name) */
  name: string;

  /** Account identifier (usually email or username) */
  account: string;

  /** Secret key (base32 encoded) */
  secret?: string;

  /** Number of digits for the TOTP code */
  digits?: number;

  /** Time step in seconds */
  period?: number;

  /** Algorithm used for HMAC */
  algorithm?: "sha1" | "sha256" | "sha512";

  /** Issuer name */
  issuer?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Tags for categorization */
  tags?: string[];
}

/**
 * TOTP entry interface.
 */
export interface Totp {
  /** Unique TOTP identifier */
  id: string;

  /** TOTP name/identifier */
  name: string;

  /** Account identifier */
  account: string;

  /** Secret key (base32 encoded) - redacted in responses */
  secret?: string;

  /** Number of digits */
  digits: number;

  /** Time step in seconds */
  period: number;

  /** HMAC algorithm */
  algorithm: "sha1" | "sha256" | "sha512";

  /** Issuer name */
  issuer?: string;

  /** TOTP creation timestamp */
  createdAt: string;

  /** TOTP last update timestamp */
  updatedAt: string;

  /** Last used timestamp */
  lastUsedAt?: string;

  /** Whether TOTP is active */
  active: boolean;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Tags for categorization */
  tags?: string[];
}

/**
 * TOTP generation response interface.
 */
export interface TotpGenerateResponse {
  /** Generated TOTP entry */
  totp: Totp;

  /** QR code data URI for setup */
  qrCode?: string;

  /** Provisioning URI */
  provisioningUri?: string;

  /** Backup codes (if generated) */
  backupCodes?: string[];
}

/**
 * TOTP verification response interface.
 */
export interface TotpVerifyResponse {
  /** Whether verification was successful */
  valid: boolean;

  /** Remaining attempts (if applicable) */
  remainingAttempts?: number;

  /** Time remaining until next code */
  timeRemaining?: number;

  /** Current valid code (for development/testing) */
  currentCode?: string;
}

/**
 * TOTP list response interface.
 */
export interface TotpListResponse {
  /** Array of TOTP entries */
  totps: Totp[];

  /** Total number of TOTP entries */
  total: number;

  /** Current page number */
  page: number;

  /** Number of entries per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * TOTP filter parameters interface.
 */
export interface TotpFilterParams extends Record<string, unknown> {
  /** Page number (default: 1) */
  page?: number;

  /** Number of items per page (default: 20) */
  pageSize?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: "asc" | "desc";

  /** Filter by active status */
  active?: boolean;

  /** Search in name, account, or issuer */
  search?: string;

  /** Filter by tags */
  tags?: string[];
}

/**
 * TOTP verification request interface.
 */
export interface TotpVerifyRequest {
  /** TOTP code to verify */
  code: string;

  /** Optional timestamp for verification */
  timestamp?: number;

  /** Whether to allow time drift */
  allowDrift?: boolean;

  /** Maximum allowed time drift in seconds */
  maxDrift?: number;
}

/**
 * Client for managing TOTP (Time-based One-Time Password) operations.
 */
export class TotpClient {
  /**
   * Creates a new TotpClient instance.
   *
   * @param httpClient - HTTP client for API communication
   */
  constructor(private readonly httpClient: VaultClient) {}

  /**
   * Lists all TOTP entries with optional filtering and pagination.
   *
   * @param params - Optional filter parameters
   * @returns Promise resolving to paginated TOTP list
   *
   * @example
   * ```typescript
   * const totps = await vault.totp.list({
   *   page: 1,
   *   pageSize: 20,
   *   active: true,
   *   search: "github"
   * });
   * ```
   */
  public async list(params?: TotpFilterParams): Promise<TotpListResponse> {
    return this.httpClient.get<TotpListResponse>("/totp", params);
  }

  /**
   * Gets a TOTP entry by its ID or name.
   *
   * @param id - TOTP ID or name
   * @param includeSecret - Whether to include the secret in response
   * @returns Promise resolving to the TOTP entry
   *
   * @example
   * ```typescript
   * const totp = await vault.totp.get("github-totp", true);
   * console.log(totp.secret); // The secret key
   * ```
   */
  public async get(id: string, includeSecret: boolean = false): Promise<Totp> {
    return this.httpClient.get<Totp>(`/totp/${id}`, {
      includeSecret: includeSecret.toString(),
    });
  }

  /**
   * Generates a new TOTP entry.
   *
   * @param config - TOTP configuration
   * @param generateBackupCodes - Whether to generate backup codes
   * @param includeQrCode - Whether to include QR code in response
   * @returns Promise resolving to generation response
   *
   * @example
   * ```typescript
   * const response = await vault.totp.generate({
   *   name: "GitHub",
   *   account: "user@example.com",
   *   issuer: "GitHub"
   * }, true, true);
   *
   * console.log(response.qrCode); // QR code data URI
   * console.log(response.backupCodes); // Backup codes
   * ```
   */
  public async generate(
    config: TotpConfig,
    generateBackupCodes: boolean = false,
    includeQrCode: boolean = true,
  ): Promise<TotpGenerateResponse> {
    return this.httpClient.post<TotpGenerateResponse>("/totp/generate", {
      ...config,
      generateBackupCodes,
      includeQrCode,
    });
  }

  /**
   * Verifies a TOTP code.
   *
   * @param id - TOTP ID or name
   * @param code - TOTP code to verify
   * @param options - Optional verification options
   * @returns Promise resolving to verification response
   *
   * @example
   * ```typescript
   * const result = await vault.totp.verify("github-totp", "123456", {
   *   allowDrift: true,
   *   maxDrift: 30
   * });
   *
   * if (result.valid) {
   *   console.log("Code is valid");
   * }
   * ```
   */
  public async verify(
    id: string,
    code: string,
    options?: Omit<TotpVerifyRequest, "code">,
  ): Promise<TotpVerifyResponse> {
    const payload: TotpVerifyRequest = {
      code,
      ...options,
    };

    return this.httpClient.post<TotpVerifyResponse>(
      `/totp/${id}/verify`,
      payload,
    );
  }

  /**
   * Updates a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @param updates - TOTP update data
   * @returns Promise resolving to the updated TOTP entry
   *
   * @example
   * ```typescript
   * const updated = await vault.totp.update("github-totp", {
   *   name: "GitHub 2FA",
   *   tags: ["github", "2fa", "updated"]
   * });
   * ```
   */
  public async update(id: string, updates: Partial<TotpConfig>): Promise<Totp> {
    return this.httpClient.put<Totp>(`/totp/${id}`, updates);
  }

  /**
   * Deletes a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @returns Promise resolving when the TOTP entry is deleted
   *
   * @example
   * ```typescript
   * await vault.totp.delete("github-totp");
   * ```
   */
  public async delete(id: string): Promise<void> {
    return this.httpClient.delete<void>(`/totp/${id}`);
  }

  /**
   * Activates a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @returns Promise resolving to the activated TOTP entry
   *
   * @example
   * ```typescript
   * const activated = await vault.totp.activate("github-totp");
   * ```
   */
  public async activate(id: string): Promise<Totp> {
    return this.httpClient.post<Totp>(`/totp/${id}/activate`);
  }

  /**
   * Deactivates a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @returns Promise resolving to the deactivated TOTP entry
   *
   * @example
   * ```typescript
   * const deactivated = await vault.totp.deactivate("github-totp");
   * ```
   */
  public async deactivate(id: string): Promise<Totp> {
    return this.httpClient.post<Totp>(`/totp/${id}/deactivate`);
  }

  /**
   * Generates backup codes for a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @param count - Number of backup codes to generate (default: 10)
   * @returns Promise resolving to the generated backup codes
   *
   * @example
   * ```typescript
   * const backupCodes = await vault.totp.generateBackupCodes("github-totp", 15);
   * console.log(backupCodes.codes); // Array of backup codes
   * ```
   */
  public async generateBackupCodes(
    id: string,
    count: number = 10,
  ): Promise<{ codes: string[] }> {
    return this.httpClient.post<{ codes: string[] }>(
      `/totp/${id}/backup-codes`,
      { count },
    );
  }

  /**
   * Gets the current valid TOTP code (for development/testing).
   *
   * @param id - TOTP ID or name
   * @returns Promise resolving to the current code
   *
   * @example
   * ```typescript
   * const currentCode = await vault.totp.getCurrentCode("github-totp");
   * console.log(currentCode.code); // Current valid 6-digit code
   * ```
   */
  public async getCurrentCode(
    id: string,
  ): Promise<{ code: string; timeRemaining: number }> {
    return this.httpClient.get<{ code: string; timeRemaining: number }>(
      `/totp/${id}/current-code`,
    );
  }

  /**
   * Gets TOTP statistics and usage information.
   *
   * @param id - TOTP ID or name
   * @returns Promise resolving to usage statistics
   *
   * @example
   * ```typescript
   * const stats = await vault.totp.getStats("github-totp");
   * console.log(stats.totalVerifications); // Total verification attempts
   * console.log(stats.successRate); // Success rate percentage
   * ```
   */
  public async getStats(id: string): Promise<{
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    successRate: number;
    lastUsedAt?: string;
    createdAt: string;
  }> {
    return this.httpClient.get<{
      totalVerifications: number;
      successfulVerifications: number;
      failedVerifications: number;
      successRate: number;
      lastUsedAt?: string;
      createdAt: string;
    }>(`/totp/${id}/stats`);
  }

  /**
   * Regenerates the secret for a TOTP entry.
   *
   * @param id - TOTP ID or name
   * @param options - Options for regeneration
   * @returns Promise resolving to regeneration response
   *
   * @example
   * ```typescript
   * const response = await vault.totp.regenerateSecret("github-totp", {
   *   generateBackupCodes: true,
   *   includeQrCode: true
   * });
   * ```
   */
  public async regenerateSecret(
    id: string,
    options: {
      generateBackupCodes?: boolean;
      includeQrCode?: boolean;
    } = {},
  ): Promise<TotpGenerateResponse> {
    return this.httpClient.post<TotpGenerateResponse>(
      `/totp/${id}/regenerate`,
      options,
    );
  }
}
