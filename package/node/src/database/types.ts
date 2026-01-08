/**
 * Database module types for the Aether Vault SDK.
 * Defines interfaces for database configuration, credentials, and connections.
 */

/**
 * Supported database engines.
 */
export type DatabaseEngine =
  | "postgres"
  | "mysql"
  | "mssql"
  | "oracle"
  | "mongodb"
  | "sqlite";

/**
 * Database configuration interface.
 * Defines connection parameters without credentials.
 */
export interface DatabaseConfig {
  /** Database engine type */
  engine: DatabaseEngine;

  /** Database server hostname or IP */
  host: string;

  /** Database server port */
  port: number;

  /** Database name */
  database: string;

  /** SSL/TLS configuration */
  ssl?:
    | boolean
    | {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
      };

  /** Connection timeout in milliseconds */
  connectionTimeout?: number;

  /** Idle timeout in milliseconds before credential refresh */
  idleTimeout?: number;

  /** Maximum retry attempts for failed connections */
  maxRetries?: number;

  /** Additional connection options (engine-specific) */
  options?: Record<string, unknown>;

  /** Custom connection metadata for audit/tracking */
  metadata?: Record<string, unknown>;
}

/**
 * Secure database credentials interface.
 * Represents credentials managed by Vault.
 */
export interface DatabaseCredentials {
  /** Database username */
  username: string;

  /** Database password (never stored, only in memory) */
  password: string;

  /** Credential expiration timestamp */
  expiresAt: Date;

  /** Optional scheduled rotation timestamp */
  rotationScheduled?: Date;

  /** Number of times these credentials have been used */
  usageCount?: number;

  /** Maximum allowed uses before rotation */
  maxUses?: number;
}

/**
 * Database connection entry in registry.
 * Tracks active connections and their state.
 */
export interface DatabaseConnectionEntry {
  /** Unique connection identifier */
  id: string;

  /** Database configuration */
  config: DatabaseConfig;

  /** Current credentials (redacted in logs) */
  credentials?: DatabaseCredentials;

  /** Connection creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  lastActivityAt: Date;

  /** Connection state */
  state: "active" | "idle" | "expired" | "error";

  /** Number of operations performed */
  operationCount: number;

  /** Error information if connection failed */
  lastError?: {
    message: string;
    timestamp: Date;
    code?: string;
  };
}

/**
 * Database driver interface.
 * Abstract interface for database-specific connection handling.
 */
export interface DatabaseDriver<T = unknown> {
  /** Driver name (e.g., 'postgres', 'mysql') */
  readonly name: string;

  /** Supported database engines */
  readonly supportedEngines: DatabaseEngine[];

  /**
   * Creates a new database connection using provided credentials.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials from Vault
   * @returns Promise resolving to native database connection
   */
  createConnection(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): Promise<T>;

  /**
   * Validates that a connection is still active and functional.
   *
   * @param connection - Database connection to validate
   * @returns Promise resolving to true if connection is valid
   */
  validateConnection(connection: T): Promise<boolean>;

  /**
   * Closes a database connection securely.
   *
   * @param connection - Database connection to close
   * @returns Promise resolving when connection is closed
   */
  closeConnection(connection: T): Promise<void>;
}

/**
 * Secure database connection wrapper.
 * Provides safe access to database connections without exposing credentials.
 */
export interface SecureConnection<T = unknown> {
  /** Unique connection identifier */
  readonly id: string;

  /** Database configuration (without credentials) */
  readonly config: DatabaseConfig;

  /** Current connection state */
  readonly state: DatabaseConnectionEntry["state"];

  /** Connection creation timestamp */
  readonly createdAt: Date;

  /** Last activity timestamp */
  readonly lastActivityAt: Date;

  /**
   * Executes a database operation using the secure connection.
   * The operation receives the native database connection but cannot access credentials.
   *
   * @param operation - Function that receives the database connection
   * @returns Promise resolving to the operation result
   */
  execute<R = unknown>(operation: (connection: T) => Promise<R>): Promise<R>;

  /**
   * Closes the connection and invalidates credentials.
   *
   * @returns Promise resolving when connection is closed
   */
  close(): Promise<void>;

  /**
   * Forces credential refresh from Vault.
   *
   * @returns Promise resolving when credentials are refreshed
   */
  refreshCredentials(): Promise<void>;

  /**
   * Checks if the connection is still valid and usable.
   *
   * @returns True if connection is valid
   */
  isValid(): Promise<boolean>;

  /**
   * Gets connection metadata without exposing sensitive information.
   *
   * @returns Connection metadata
   */
  getMetadata(): Omit<DatabaseConnectionEntry, "credentials">;
}

/**
 * Database connection request interface.
 * Used for creating new connections via Vault API.
 */
export interface DatabaseConnectionRequest {
  /** Database configuration */
  config: DatabaseConfig;

  /** Optional requested credential TTL in seconds */
  requestedTtl?: number;

  /** Optional requested max uses */
  requestedMaxUses?: number;

  /** Connection purpose/context for audit */
  purpose?: string;

  /** Requester identifier */
  requester?: string;
}

/**
 * Database connection response interface.
 * Response from Vault API when requesting credentials.
 */
export interface DatabaseConnectionResponse {
  /** Connection identifier */
  connectionId: string;

  /** Database credentials */
  credentials: DatabaseCredentials;

  /** Granted TTL in seconds */
  grantedTtl: number;

  /** Granted max uses */
  grantedMaxUses: number;

  /** Next allowed rotation time */
  nextRotation?: Date;

  /** Connection creation timestamp */
  createdAt: Date;
}

/**
 * Database filter parameters for listing connections.
 */
export interface DatabaseConnectionFilterParams {
  /** Filter by database engine */
  engine?: DatabaseEngine;

  /** Filter by connection state */
  state?: DatabaseConnectionEntry["state"];

  /** Filter by creation date range */
  createdAfter?: Date;
  createdBefore?: Date;

  /** Filter by host */
  host?: string;

  /** Pagination parameters */
  page?: number;
  pageSize?: number;
}

/**
 * Database connection list response.
 */
export interface DatabaseConnectionListResponse {
  /** Array of database connections */
  connections: DatabaseConnectionEntry[];

  /** Total number of connections */
  total: number;

  /** Current page number */
  page: number;

  /** Number of connections per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}
