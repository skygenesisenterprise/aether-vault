/**
 * Database driver implementations.
 * Provides abstraction layer for different database engines.
 */

import {
  DatabaseDriver,
  DatabaseConfig,
  DatabaseCredentials,
  DatabaseEngine,
} from "../types.js";
import { DatabaseDriverError } from "../errors.js";

/**
 * Base implementation for SQL-like database drivers.
 * Provides common functionality for PostgreSQL, MySQL, etc.
 */
export abstract class BaseSqlDriver<T> implements DatabaseDriver<T> {
  abstract readonly name: string;
  abstract readonly supportedEngines: DatabaseEngine[];

  /**
   * Validates that the database engine is supported.
   *
   * @param config - Database configuration
   * @throws DatabaseDriverError if engine not supported
   */
  protected validateEngine(config: DatabaseConfig): void {
    if (!this.supportedEngines.includes(config.engine)) {
      throw new DatabaseDriverError(
        `Engine ${config.engine} is not supported by ${this.name} driver`,
        {
          supportedEngines: this.supportedEngines,
          requestedEngine: config.engine,
        },
      );
    }
  }

  /**
   * Builds connection string from configuration and credentials.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns Connection string
   */
  protected abstract buildConnectionString(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): string;

  /**
   * Validates SQL connection by executing a simple query.
   *
   * @param connection - Database connection
   * @returns Promise resolving to true if valid
   */
  protected async validateSqlConnection(connection: T): Promise<boolean> {
    try {
      // Implementation will be driver-specific
      return await this.performHealthCheck(connection);
    } catch {
      return false;
    }
  }

  /**
   * Performs database-specific health check.
   *
   * @param connection - Database connection
   * @returns Promise resolving to true if healthy
   */
  protected abstract performHealthCheck(connection: T): Promise<boolean>;

  abstract createConnection(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): Promise<T>;
  abstract validateConnection(connection: T): Promise<boolean>;
  abstract closeConnection(connection: T): Promise<void>;
}

/**
 * PostgreSQL driver implementation.
 * Provides secure connection handling for PostgreSQL databases.
 */
export class PostgresDriver extends BaseSqlDriver<any> {
  readonly name = "postgres";
  readonly supportedEngines: DatabaseEngine[] = ["postgres"];

  /**
   * Creates a PostgreSQL connection using provided credentials.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns Promise resolving to PostgreSQL connection
   */
  async createConnection(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): Promise<any> {
    this.validateEngine(config);

    try {
      // In a real implementation, this would use the 'pg' library
      // For now, we'll create a mock connection object
      this.buildConnectionString(config, credentials);

      // Mock implementation - replace with actual PostgreSQL client
      const connection = {
        query: async (_sql: string, _params?: any[]) => {
          // Mock query execution
          return { rows: [], rowCount: 0 };
        },
        end: async () => {
          // Mock connection close
        },
        config,
        credentials: { ...credentials, password: "[REDACTED]" }, // Never expose password
        connectedAt: new Date(),
      };

      return connection;
    } catch (error) {
      throw new DatabaseDriverError(
        `Failed to create PostgreSQL connection to ${config.host}:${config.port}/${config.database}`,
        {
          host: config.host,
          port: config.port,
          database: config.database,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Validates PostgreSQL connection.
   *
   * @param connection - PostgreSQL connection
   * @returns Promise resolving to true if connection is valid
   */
  async validateConnection(connection: any): Promise<boolean> {
    if (!connection || typeof connection.query !== "function") {
      return false;
    }

    try {
      // Execute simple health check query
      await connection.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes PostgreSQL connection securely.
   *
   * @param connection - PostgreSQL connection
   */
  async closeConnection(connection: any): Promise<void> {
    if (connection && typeof connection.end === "function") {
      try {
        await connection.end();
      } catch (error) {
        // Log but don't throw - connection cleanup is best effort
        console.warn("Error closing PostgreSQL connection:", error);
      }
    }
  }

  /**
   * Builds PostgreSQL connection string.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns PostgreSQL connection string
   */
  protected buildConnectionString(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): string {
    const ssl = config.ssl ? "?ssl=true" : "";
    return `postgresql://${credentials.username}:${credentials.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }

  /**
   * Performs PostgreSQL-specific health check.
   *
   * @param connection - PostgreSQL connection
   * @returns Promise resolving to true if healthy
   */
  protected async performHealthCheck(connection: any): Promise<boolean> {
    try {
      await connection.query("SELECT version()");
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * MySQL driver implementation.
 * Provides secure connection handling for MySQL databases.
 */
export class MySqlDriver extends BaseSqlDriver<any> {
  readonly name = "mysql";
  readonly supportedEngines: DatabaseEngine[] = ["mysql"];

  /**
   * Creates a MySQL connection using provided credentials.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns Promise resolving to MySQL connection
   */
  async createConnection(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): Promise<any> {
    this.validateEngine(config);

    try {
      // In a real implementation, this would use the 'mysql2' library
      // For now, we'll create a mock connection object
      const connectionConfig = {
        host: config.host,
        port: config.port,
        user: credentials.username,
        password: credentials.password,
        database: config.database,
        ssl: config.ssl || false,
      };

      // Mock implementation - replace with actual MySQL client
      const connection = {
        query: async (_sql: string, _params?: any[]) => {
          // Mock query execution
          return [[], null]; // [rows, fields] format for mysql2
        },
        end: async (callback?: Function) => {
          // Mock connection close
          if (callback) callback(null);
        },
        config: connectionConfig,
        credentials: { ...credentials, password: "[REDACTED]" }, // Never expose password
        connectedAt: new Date(),
      };

      return connection;
    } catch (error) {
      throw new DatabaseDriverError(
        `Failed to create MySQL connection to ${config.host}:${config.port}/${config.database}`,
        {
          host: config.host,
          port: config.port,
          database: config.database,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Validates MySQL connection.
   *
   * @param connection - MySQL connection
   * @returns Promise resolving to true if connection is valid
   */
  async validateConnection(connection: any): Promise<boolean> {
    if (!connection || typeof connection.query !== "function") {
      return false;
    }

    try {
      // Execute simple health check query
      await connection.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes MySQL connection securely.
   *
   * @param connection - MySQL connection
   */
  async closeConnection(connection: any): Promise<void> {
    if (connection && typeof connection.end === "function") {
      try {
        await new Promise<void>((resolve, reject) => {
          connection.end((error: any) => {
            if (error) reject(error);
            else resolve();
          });
        });
      } catch (error) {
        // Log but don't throw - connection cleanup is best effort
        console.warn("Error closing MySQL connection:", error);
      }
    }
  }

  /**
   * Builds MySQL connection string.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns MySQL connection string
   */
  protected buildConnectionString(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): string {
    const ssl = config.ssl ? "&ssl=true" : "";
    return `mysql://${credentials.username}:${credentials.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }

  /**
   * Performs MySQL-specific health check.
   *
   * @param connection - MySQL connection
   * @returns Promise resolving to true if healthy
   */
  protected async performHealthCheck(connection: any): Promise<boolean> {
    try {
      await connection.query("SELECT VERSION()");
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * MongoDB driver implementation.
 * Provides secure connection handling for MongoDB databases.
 */
export class MongoDriver implements DatabaseDriver<any> {
  readonly name = "mongodb";
  readonly supportedEngines: DatabaseEngine[] = ["mongodb"];

  /**
   * Creates a MongoDB connection using provided credentials.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns Promise resolving to MongoDB connection
   */
  async createConnection(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): Promise<any> {
    if (config.engine !== "mongodb") {
      throw new DatabaseDriverError(
        `Engine ${config.engine} is not supported by MongoDB driver`,
        {
          supportedEngines: this.supportedEngines,
          requestedEngine: config.engine,
        },
      );
    }

    try {
      // In a real implementation, this would use the 'mongodb' library
      // For now, we'll create a mock connection object
      const connectionUri = this.buildConnectionUri(config, credentials);

      // Mock implementation - replace with actual MongoDB client
      const connection = {
        db: (_name: string) => ({
          collection: (_collection: string) => ({
            find: () => ({ toArray: async () => [] }),
            insertOne: async (_doc: any) => ({ insertedId: "mock-id" }),
            updateOne: async () => ({ modifiedCount: 1 }),
            deleteOne: async () => ({ deletedCount: 1 }),
          }),
        }),
        close: async () => {
          // Mock connection close
        },
        config,
        credentials: { ...credentials, password: "[REDACTED]" }, // Never expose password
        connectedAt: new Date(),
        uri: connectionUri.replace(/:([^:@]+)@/, ":[REDACTED]@"), // Redact password in URI
      };

      return connection;
    } catch (error) {
      throw new DatabaseDriverError(
        `Failed to create MongoDB connection to ${config.host}:${config.port}/${config.database}`,
        {
          host: config.host,
          port: config.port,
          database: config.database,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Validates MongoDB connection.
   *
   * @param connection - MongoDB connection
   * @returns Promise resolving to true if connection is valid
   */
  async validateConnection(connection: any): Promise<boolean> {
    if (!connection || typeof connection.db !== "function") {
      return false;
    }

    try {
      // Execute simple health check operation
      await connection.db("test").collection("health_check").findOne();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes MongoDB connection securely.
   *
   * @param connection - MongoDB connection
   */
  async closeConnection(connection: any): Promise<void> {
    if (connection && typeof connection.close === "function") {
      try {
        await connection.close();
      } catch (error) {
        // Log but don't throw - connection cleanup is best effort
        console.warn("Error closing MongoDB connection:", error);
      }
    }
  }

  /**
   * Builds MongoDB connection URI.
   *
   * @param config - Database configuration
   * @param credentials - Database credentials
   * @returns MongoDB connection URI
   */
  private buildConnectionUri(
    config: DatabaseConfig,
    credentials: DatabaseCredentials,
  ): string {
    const ssl = config.ssl ? "?ssl=true" : "";
    return `mongodb://${credentials.username}:${credentials.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }
}

/**
 * Driver registry for managing available database drivers.
 */
export class DriverRegistry {
  private static drivers = new Map<string, DatabaseDriver<any>>();

  /**
   * Registers a database driver.
   *
   * @param driver - Database driver instance
   */
  static register(driver: DatabaseDriver<any>): void {
    this.drivers.set(driver.name, driver);
  }

  /**
   * Gets a driver by name.
   *
   * @param name - Driver name
   * @returns Driver instance or undefined if not found
   */
  static get(name: string): DatabaseDriver<any> | undefined {
    return this.drivers.get(name);
  }

  /**
   * Gets a driver for a specific database engine.
   *
   * @param engine - Database engine
   * @returns Driver instance or throws if not supported
   */
  static getByEngine(engine: DatabaseEngine): DatabaseDriver<any> {
    for (const driver of this.drivers.values()) {
      if (driver.supportedEngines.includes(engine)) {
        return driver;
      }
    }

    throw new DatabaseDriverError(
      `No driver available for database engine: ${engine}`,
      {
        supportedEngines: Array.from(this.drivers.values()).flatMap(
          (d) => d.supportedEngines,
        ),
      },
    );
  }

  /**
   * Lists all registered drivers.
   *
   * @returns Array of driver names
   */
  static list(): string[] {
    return Array.from(this.drivers.keys());
  }
}

// Register built-in drivers
DriverRegistry.register(new PostgresDriver());
DriverRegistry.register(new MySqlDriver());
DriverRegistry.register(new MongoDriver());
