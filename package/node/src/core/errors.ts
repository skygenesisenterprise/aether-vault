/**
 * Base error class for all Aether Vault SDK errors.
 * Provides structured error handling with error codes and optional details.
 */
export class VaultError extends Error {
  /**
   * Creates a new VaultError instance.
   *
   * @param code - Machine-readable error code for programmatic handling
   * @param message - Human-readable error message
   * @param details - Optional additional error context or metadata
   */
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "VaultError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, VaultError);
    }
  }

  /**
   * Converts the error to a JSON-serializable object.
   *
   * @returns Object representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Authentication-related errors.
 * Thrown when authentication fails or credentials are invalid.
 */
export class VaultAuthError extends VaultError {
  /**
   * Creates a new VaultAuthError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional authentication error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("AUTH_ERROR", message, details);
    this.name = "VaultAuthError";
  }
}

/**
 * Permission/authorization errors.
 * Thrown when the authenticated entity lacks required permissions.
 */
export class VaultPermissionError extends VaultError {
  /**
   * Creates a new VaultPermissionError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional permission error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("PERMISSION_ERROR", message, details);
    this.name = "VaultPermissionError";
  }
}

/**
 * Resource not found errors.
 * Thrown when requested resources don't exist.
 */
export class VaultNotFoundError extends VaultError {
  /**
   * Creates a new VaultNotFoundError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional not found error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("NOT_FOUND", message, details);
    this.name = "VaultNotFoundError";
  }
}

/**
 * Server-side errors.
 * Thrown when the server encounters an internal error.
 */
export class VaultServerError extends VaultError {
  /**
   * Creates a new VaultServerError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional server error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("SERVER_ERROR", message, details);
    this.name = "VaultServerError";
  }
}

/**
 * Network/communication errors.
 * Thrown when network requests fail or time out.
 */
export class VaultNetworkError extends VaultError {
  /**
   * Creates a new VaultNetworkError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional network error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("NETWORK_ERROR", message, details);
    this.name = "VaultNetworkError";
  }
}

/**
 * Configuration errors.
 * Thrown when SDK configuration is invalid or missing.
 */
export class VaultConfigError extends VaultError {
  /**
   * Creates a new VaultConfigError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional configuration error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFIG_ERROR", message, details);
    this.name = "VaultConfigError";
  }
}

/**
 * Type guard to check if an error is a VaultError.
 *
 * @param error - Error to check
 * @returns True if the error is a VaultError instance
 */
export function isVaultError(error: unknown): error is VaultError {
  return error instanceof VaultError;
}

/**
 * Creates an appropriate VaultError from an HTTP response.
 *
 * @param status - HTTP status code
 * @param message - Error message from response
 * @param details - Optional error details
 * @returns Appropriate VaultError instance
 */
export function createErrorFromResponse(
  status: number,
  message: string,
  details?: Record<string, unknown>,
): VaultError {
  switch (status) {
    case 401:
      return new VaultAuthError(message, details);
    case 403:
      return new VaultPermissionError(message, details);
    case 404:
      return new VaultNotFoundError(message, details);
    case 500:
    case 502:
    case 503:
    case 504:
      return new VaultServerError(message, details);
    default:
      return new VaultError(`HTTP_${status}`, message, details);
  }
}
