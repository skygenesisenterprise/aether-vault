/**
 * Database-specific error classes for the Aether Vault SDK.
 * Provides structured error handling for database operations with security focus.
 */

import { VaultError } from "../core/errors.js";

/**
 * Base error class for all database module errors.
 */
export class VaultDatabaseError extends VaultError {
  /**
   * Creates a new VaultDatabaseError instance.
   *
   * @param code - Machine-readable error code
   * @param message - Human-readable error message
   * @param details - Optional error context
   */
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(`DATABASE_${code}`, message, details);
    this.name = "VaultDatabaseError";
  }
}

/**
 * Database connection-related errors.
 * Thrown when establishing or maintaining database connections fails.
 */
export class DatabaseConnectionError extends VaultDatabaseError {
  /**
   * Creates a new DatabaseConnectionError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional connection error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONNECTION_ERROR", message, details);
    this.name = "DatabaseConnectionError";
  }
}

/**
 * Database credentials-related errors.
 * Thrown when credential management operations fail.
 */
export class DatabaseCredentialsError extends VaultDatabaseError {
  /**
   * Creates a new DatabaseCredentialsError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional credential error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("CREDENTIALS_ERROR", message, details);
    this.name = "DatabaseCredentialsError";
  }
}

/**
 * Database credential rotation errors.
 * Thrown when automatic credential rotation fails.
 */
export class DatabaseRotationError extends VaultDatabaseError {
  /**
   * Creates a new DatabaseRotationError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional rotation error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("ROTATION_ERROR", message, details);
    this.name = "DatabaseRotationError";
  }
}

/**
 * Database policy/permission errors.
 * Thrown when Vault policies deny database access.
 */
export class DatabasePolicyError extends VaultDatabaseError {
  /**
   * Creates a new DatabasePolicyError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional policy error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("POLICY_ERROR", message, details);
    this.name = "DatabasePolicyError";
  }
}

/**
 * Database timeout errors.
 * Thrown when database operations exceed timeout limits.
 */
export class DatabaseTimeoutError extends VaultDatabaseError {
  /**
   * Creates a new DatabaseTimeoutError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional timeout error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("TIMEOUT", message, details);
    this.name = "DatabaseTimeoutError";
  }
}

/**
 * Database driver-specific errors.
 * Thrown when underlying database drivers encounter errors.
 */
export class DatabaseDriverError extends VaultDatabaseError {
  /**
   * Creates a new DatabaseDriverError instance.
   *
   * @param message - Human-readable error message
   * @param details - Optional driver error context
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super("DRIVER_ERROR", message, details);
    this.name = "DatabaseDriverError";
  }
}
