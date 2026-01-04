/**
 * Configuration interface for the Aether Vault SDK.
 * Defines all available configuration options for client initialization.
 */
export interface VaultConfig {
  /**
   * Base URL for the Aether Vault API.
   * Should include the API version, e.g., "https://vault.skygenesisenterprise.com/api/v1" or "/api/v1" for same-origin requests.
   */
  baseURL: string;

  /**
   * Authentication configuration.
   * Defines how the SDK should authenticate requests to the API.
   */
  auth: AuthConfig;

  /**
   * Request timeout in milliseconds.
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Custom headers to include with every request.
   * These will be merged with authentication headers.
   */
  headers?: Record<string, string>;

  /**
   * Enable/disable request retries for network failures.
   * @default true
   */
  retry?: boolean;

  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Retry delay in milliseconds between attempts.
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Enable debug logging for HTTP requests and responses.
   * @default false
   */
  debug?: boolean;
}

/**
 * Authentication configuration interface.
 * Supports multiple authentication methods used by Aether Vault.
 */
export interface AuthConfig {
  /**
   * Authentication type to use for requests.
   * - "jwt": JSON Web Token authentication
   * - "bearer": Generic bearer token authentication
   * - "session": Cookie-based session authentication (for web clients)
   * - "none": No authentication (for public endpoints)
   */
  type: "jwt" | "bearer" | "session" | "none";

  /**
   * Authentication token or credential.
   * For JWT and bearer types, this is the token string.
   * For session type, this is optional as cookies will be used.
   */
  token?: string;

  /**
   * JWT-specific configuration options.
   * Only used when auth.type is "jwt".
   */
  jwt?: JwtAuthConfig;

  /**
   * Session-specific configuration options.
   * Only used when auth.type is "session".
   */
  session?: SessionAuthConfig;
}

/**
 * JWT authentication configuration.
 * Provides additional options for JWT-based authentication.
 */
export interface JwtAuthConfig {
  /**
   * JWT issuer claim validation.
   * If provided, the token must have this issuer.
   */
  issuer?: string;

  /**
   * JWT audience claim validation.
   * If provided, the token must include this audience.
   */
  audience?: string;

  /**
   * Custom JWT claims to validate.
   * Key-value pairs of required claims and their expected values.
   */
  requiredClaims?: Record<string, string>;

  /**
   * Enable automatic token refresh.
   * When enabled, the SDK will attempt to refresh expired tokens.
   * @default false
   */
  autoRefresh?: boolean;

  /**
   * Token refresh endpoint.
   * Used when autoRefresh is enabled.
   */
  refreshEndpoint?: string;

  /**
   * Function to handle token refresh.
   * Custom token refresh logic when autoRefresh is enabled.
   */
  refreshFn?: (oldToken: string) => Promise<string>;
}

/**
 * Session authentication configuration.
 * Provides options for cookie-based session authentication.
 */
export interface SessionAuthConfig {
  /**
   * Session cookie name.
   * If not provided, the SDK will use the default session cookie name.
   */
  cookieName?: string;

  /**
   * Enable automatic session refresh.
   * @default false
   */
  autoRefresh?: boolean;

  /**
   * Session refresh endpoint.
   * Used when autoRefresh is enabled.
   */
  refreshEndpoint?: string;
}

/**
 * Default configuration values.
 * Internal constants used for default SDK configuration.
 */
export const DEFAULT_CONFIG = {
  timeout: 30000,
  retry: true,
  maxRetries: 3,
  retryDelay: 1000,
  debug: false,
} as const;

/**
 * Validates a VaultConfig object.
 *
 * @param config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config: VaultConfig): void {
  if (!config.baseURL) {
    throw new Error("baseURL is required");
  }

  if (!config.auth) {
    throw new Error("auth configuration is required");
  }

  if (!["jwt", "bearer", "session", "none"].includes(config.auth.type)) {
    throw new Error(
      `Invalid auth type: ${config.auth.type}. Must be one of: jwt, bearer, session, none`,
    );
  }

  if (
    config.auth.type !== "none" &&
    config.auth.type !== "session" &&
    !config.auth.token
  ) {
    throw new Error(`Token is required for auth type: ${config.auth.type}`);
  }

  if (config.timeout && config.timeout <= 0) {
    throw new Error("timeout must be greater than 0");
  }

  if (config.maxRetries && config.maxRetries < 0) {
    throw new Error("maxRetries must be non-negative");
  }

  if (config.retryDelay && config.retryDelay < 0) {
    throw new Error("retryDelay must be non-negative");
  }
}

/**
 * Merges user configuration with default values.
 *
 * @param userConfig - User-provided configuration
 * @returns Complete configuration with defaults applied
 */
export function mergeWithDefaults(
  userConfig: VaultConfig,
): Required<VaultConfig> {
  validateConfig(userConfig);

  return {
    baseURL: userConfig.baseURL,
    auth: userConfig.auth,
    timeout: userConfig.timeout ?? DEFAULT_CONFIG.timeout,
    headers: userConfig.headers ?? {},
    retry: userConfig.retry ?? DEFAULT_CONFIG.retry,
    maxRetries: userConfig.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    retryDelay: userConfig.retryDelay ?? DEFAULT_CONFIG.retryDelay,
    debug: userConfig.debug ?? DEFAULT_CONFIG.debug,
  };
}
