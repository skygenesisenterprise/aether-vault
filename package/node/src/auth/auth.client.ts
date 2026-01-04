import { VaultClient } from "../core/client.js";
import { AuthConfig } from "../core/config.js";
import { VaultAuthError } from "../core/errors.js";
import { ApiResponse } from "../types/index.js";

/**
 * Authentication client interface.
 * Provides methods for managing authentication tokens and sessions.
 */
export interface IAuthClient {
  /**
   * Checks if current authentication is valid.
   */
  validate(): Promise<boolean>;

  /**
   * Refreshes the current authentication token.
   */
  refresh(): Promise<void>;

  /**
   * Revokes the current authentication token.
   */
  revoke(): Promise<void>;

  /**
   * Gets current authentication information.
   */
  getCurrentAuth(): Promise<AuthInfo>;
}

/**
 * Authentication information interface.
 * Details about current authentication state.
 */
export interface AuthInfo {
  /** Authentication type being used */
  type: "jwt" | "bearer" | "session" | "none";

  /** Whether authentication is currently valid */
  valid: boolean;

  /** Token expiration timestamp (if applicable) */
  expiresAt?: string | undefined;

  /** Issued at timestamp (if applicable) */
  issuedAt?: string | undefined;

  /** Additional authentication metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * JWT token information.
 * Decoded JWT token details.
 */
export interface JwtTokenInfo {
  /** Token subject (user ID) */
  sub: string;

  /** Token issuer */
  iss: string;

  /** Token audience(s) */
  aud: string | string[];

  /** Token expiration timestamp */
  exp: number;

  /** Token issued at timestamp */
  iat: number;

  /** Token not valid before timestamp */
  nbf?: number;

  /** Token identifier */
  jti?: string;

  /** Additional token claims */
  [claim: string]: unknown;
}

/**
 * Session information interface.
 * Details about current session.
 */
export interface SessionInfo {
  /** Session identifier */
  sessionId: string;

  /** User ID associated with session */
  userId: string;

  /** Session creation timestamp */
  createdAt: string;

  /** Session last access timestamp */
  lastAccessAt: string;

  /** Session expiration timestamp */
  expiresAt: string;

  /** Whether session is active */
  active: boolean;

  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Authentication client implementation.
 * Handles JWT, bearer, and session-based authentication.
 */
export class AuthClient implements IAuthClient {
  private readonly client: VaultClient;
  private readonly config: AuthConfig;
  private tokenInfo?: JwtTokenInfo | undefined;
  private sessionInfo?: SessionInfo | undefined;

  /**
   * Creates a new AuthClient instance.
   *
   * @param client - Configured VaultClient instance
   * @param config - Authentication configuration
   */
  constructor(client: VaultClient, config: AuthConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Validates current authentication.
   *
   * @returns Promise resolving to validation result
   */
  async validate(): Promise<boolean> {
    try {
      switch (this.config.type) {
        case "jwt":
          return await this.validateJwt();

        case "bearer":
          return await this.validateBearer();

        case "session":
          return await this.validateSession();

        case "none":
          return true;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Refreshes current authentication token.
   *
   * @returns Promise resolving when refresh is complete
   */
  async refresh(): Promise<void> {
    try {
      switch (this.config.type) {
        case "jwt":
          await this.refreshJwt();
          break;

        case "session":
          await this.refreshSession();
          break;

        case "bearer":
          // Bearer tokens typically cannot be refreshed
          throw new VaultAuthError("Bearer tokens cannot be refreshed");

        case "none":
          // No authentication to refresh
          break;

        default:
          throw new VaultAuthError(
            `Cannot refresh authentication type: ${this.config.type}`,
          );
      }
    } catch (error) {
      if (error instanceof VaultAuthError) {
        throw error;
      }
      throw new VaultAuthError(`Failed to refresh authentication: ${error}`);
    }
  }

  /**
   * Revokes current authentication token.
   *
   * @returns Promise resolving when revocation is complete
   */
  async revoke(): Promise<void> {
    try {
      const response =
        await this.client.post<ApiResponse<{ success: boolean }>>(
          "/auth/revoke",
        );

      if (!response.data?.success) {
        throw new VaultAuthError("Failed to revoke authentication");
      }

      // Clear local authentication data
      this.clearAuthData();
    } catch (error) {
      if (error instanceof VaultAuthError) {
        throw error;
      }
      throw new VaultAuthError(`Failed to revoke authentication: ${error}`);
    }
  }

  /**
   * Gets current authentication information.
   *
   * @returns Promise resolving to authentication info
   */
  async getCurrentAuth(): Promise<AuthInfo> {
    const isValid = await this.validate();

    switch (this.config.type) {
      case "jwt":
        return {
          type: "jwt",
          valid: isValid,
          expiresAt: this.tokenInfo
            ? new Date(this.tokenInfo.exp * 1000).toISOString()
            : undefined,
          issuedAt: this.tokenInfo
            ? new Date(this.tokenInfo.iat * 1000).toISOString()
            : undefined,
          metadata: this.tokenInfo,
        };

      case "bearer":
        return {
          type: "bearer",
          valid: isValid,
          metadata: {
            tokenPreview: this.config.token?.substring(0, 10) + "...",
          },
        };

      case "session":
        return {
          type: "session",
          valid: isValid,
          expiresAt: this.sessionInfo?.expiresAt,
          issuedAt: this.sessionInfo?.createdAt,
          metadata:
            (this.sessionInfo as unknown as Record<string, unknown>) ||
            undefined,
        };

      case "none":
        return {
          type: "none",
          valid: true,
        };

      default:
        throw new VaultAuthError(
          `Unknown authentication type: ${this.config.type}`,
        );
    }
  }

  /**
   * Validates JWT token.
   *
   * @returns Promise resolving to validation result
   */
  private async validateJwt(): Promise<boolean> {
    if (!this.config.token) {
      return false;
    }

    try {
      // Check if we have cached token info
      if (this.tokenInfo) {
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (this.tokenInfo.exp && now >= this.tokenInfo.exp) {
          return false;
        }
        return true;
      }

      // Validate with server
      const response = await this.client.post<
        ApiResponse<{ valid: boolean; info?: JwtTokenInfo }>
      >("/auth/validate", { token: this.config.token });

      if (response.data?.valid && response.data.info) {
        this.tokenInfo = response.data.info;
        return true;
      }

      return false;
    } catch (error) {
      throw new VaultAuthError(`JWT validation failed: ${error}`);
    }
  }

  /**
   * Validates bearer token.
   *
   * @returns Promise resolving to validation result
   */
  private async validateBearer(): Promise<boolean> {
    if (!this.config.token) {
      return false;
    }

    try {
      const response = await this.client.post<ApiResponse<{ valid: boolean }>>(
        "/auth/validate",
        { token: this.config.token },
      );

      return response.data?.valid || false;
    } catch (error) {
      throw new VaultAuthError(`Bearer token validation failed: ${error}`);
    }
  }

  /**
   * Validates session.
   *
   * @returns Promise resolving to validation result
   */
  private async validateSession(): Promise<boolean> {
    try {
      const response =
        await this.client.get<
          ApiResponse<{ valid: boolean; info?: SessionInfo }>
        >("/auth/session");

      if (response.data?.valid && response.data.info) {
        this.sessionInfo = response.data.info;
        return true;
      }

      return false;
    } catch (error) {
      throw new VaultAuthError(`Session validation failed: ${error}`);
    }
  }

  /**
   * Refreshes JWT token.
   *
   * @returns Promise resolving when refresh is complete
   */
  private async refreshJwt(): Promise<void> {
    if (!this.config.jwt?.autoRefresh || !this.config.token) {
      throw new VaultAuthError(
        "JWT auto-refresh is not enabled or no token available",
      );
    }

    try {
      let newToken: string;

      if (this.config.jwt.refreshFn) {
        // Use custom refresh function
        newToken = await this.config.jwt.refreshFn(this.config.token);
      } else if (this.config.jwt.refreshEndpoint) {
        // Use refresh endpoint
        const response = await this.client.post<ApiResponse<{ token: string }>>(
          this.config.jwt.refreshEndpoint,
          { token: this.config.token },
        );
        newToken = response.data?.token!;
      } else {
        throw new VaultAuthError("No JWT refresh method configured");
      }

      // Update client token
      this.client.updateToken(newToken);
      this.config.token = newToken;

      // Clear cached token info to force revalidation
      this.tokenInfo = undefined;
    } catch (error) {
      throw new VaultAuthError(`JWT refresh failed: ${error}`);
    }
  }

  /**
   * Refreshes session.
   *
   * @returns Promise resolving when refresh is complete
   */
  private async refreshSession(): Promise<void> {
    if (!this.config.session?.autoRefresh) {
      throw new VaultAuthError("Session auto-refresh is not enabled");
    }

    try {
      const response = await this.client.post<
        ApiResponse<{ success: boolean }>
      >(this.config.session.refreshEndpoint || "/auth/session/refresh");

      if (!response.data?.success) {
        throw new VaultAuthError("Session refresh failed");
      }

      // Clear cached session info to force revalidation
      this.sessionInfo = undefined;
    } catch (error) {
      throw new VaultAuthError(`Session refresh failed: ${error}`);
    }
  }

  /**
   * Clears local authentication data.
   */
  private clearAuthData(): void {
    this.tokenInfo = undefined;
    this.sessionInfo = undefined;
    this.client.clearToken();
    (this.config as any).token = undefined;
  }
}
