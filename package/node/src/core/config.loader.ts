/**
 * Configuration loader for Aether Vault SDK.
 * Provides automatic configuration loading from files and environment variables.
 */

import { resolve } from "path";
import { VaultConfig, AuthConfig } from "./config.js";
import {
  CompleteVaultConfig,
  VaultConfigFile,
  ConfigLoaderOptions,
  LoadedConfig,
  Environment,
  EnvironmentVariables,
  ExtendedAuthConfig,
} from "./config.types.js";

/**
 * Default configuration loader options.
 */
const DEFAULT_LOADER_OPTIONS: ConfigLoaderOptions = {
  configPath: "vault.config.ts",
  environment: getCurrentEnvironment(),
  enableEnvOverrides: true,
  strict: false,
};

/**
 * Get current environment from process.env.
 */
function getCurrentEnvironment(): Environment {
  const env = process.env.VAULT_ENV || process.env.NODE_ENV || "development";
  switch (env) {
    case "production":
    case "prod":
      return "production";
    case "staging":
    case "stage":
      return "staging";
    case "test":
      return "test";
    default:
      return "development";
  }
}

/**
 * Load configuration from vault.config.ts file.
 */
async function loadConfigFromFile(
  configPath: string,
): Promise<VaultConfigFile | null> {
  try {
    const fullPath = resolve(process.cwd(), configPath);

    // Try to import the config file
    const configModule = await import(fullPath);

    // Support both default export and named export
    const config = configModule.default || configModule.vaultConfig;

    if (!config) {
      throw new Error("No configuration found in vault.config.ts");
    }

    return config as VaultConfigFile;
  } catch {
    // Config file not found or invalid - return null to fallback to env vars
    return null;
  }
}

/**
 * Load configuration from environment variables.
 */
function loadConfigFromEnv(): CompleteVaultConfig {
  const env = process.env as EnvironmentVariables;

  // Build auth config from environment variables
  const authMethod = env.VAULT_AUTH_METHOD || "token";
  let auth: ExtendedAuthConfig;

  switch (authMethod) {
    case "token":
      auth = {
        method: "token",
        token: env.VAULT_TOKEN || "",
      };
      break;

    case "app-role":
      auth = {
        method: "app-role",
        roleId: env.VAULT_ROLE_ID || "",
        secretId: env.VAULT_SECRET_ID || "",
      };
      break;

    case "oidc":
      auth = {
        method: "oidc",
        token: env.VAULT_OIDC_TOKEN || "",
        ...(env.VAULT_OIDC_ROLE && { role: env.VAULT_OIDC_ROLE }),
      };
      break;

    case "jwt":
      auth = {
        method: "jwt",
        token: env.VAULT_TOKEN || "",
      };
      break;

    case "bearer":
      auth = {
        method: "bearer",
        token: env.VAULT_TOKEN || "",
      };
      break;

    case "session":
      auth = {
        method: "session",
      };
      break;

    case "none":
      auth = {
        method: "none",
      };
      break;

    default:
      throw new Error(`Unsupported auth method: ${authMethod}`);
  }

  return {
    endpoint: env.VAULT_ENDPOINT || "",
    ...(env.VAULT_NAMESPACE && { namespace: env.VAULT_NAMESPACE }),
    auth,
    retry: {
      retries: parseInt(env.VAULT_RETRY_RETRIES || "3"),
      delay: parseInt(env.VAULT_RETRY_DELAY || "1000"),
      backoff: true,
      maxDelay: 10000,
    },
    logging: {
      level: (env.VAULT_LOG_LEVEL as any) || "info",
      console: true,
      http: env.VAULT_DEBUG === "true",
    },
    features: {
      autoRenewToken: env.VAULT_AUTO_RENEW_TOKEN === "true",
      auditEnabled: env.VAULT_AUDIT_ENABLED === "true",
      metricsEnabled: false,
      cachingEnabled: true,
      tracingEnabled: false,
    },
    timeout: parseInt(env.VAULT_TIMEOUT || "30000"),
    apiVersion: env.VAULT_API_VERSION || "v1",
  };
}

/**
 * Apply environment variable overrides to a configuration.
 */
function applyEnvOverrides(config: CompleteVaultConfig): CompleteVaultConfig {
  const env = process.env as EnvironmentVariables;

  // Create a deep copy of the config
  const result = JSON.parse(JSON.stringify(config));

  // Apply overrides
  if (env.VAULT_ENDPOINT) result.endpoint = env.VAULT_ENDPOINT;
  if (env.VAULT_NAMESPACE) result.namespace = env.VAULT_NAMESPACE;
  if (env.VAULT_TIMEOUT) result.timeout = parseInt(env.VAULT_TIMEOUT);
  if (env.VAULT_API_VERSION) result.apiVersion = env.VAULT_API_VERSION;

  // Auth overrides
  if (env.VAULT_AUTH_METHOD) {
    const authMethod = env.VAULT_AUTH_METHOD;
    switch (authMethod) {
      case "token":
        if (env.VAULT_TOKEN)
          result.auth = { method: "token", token: env.VAULT_TOKEN };
        break;
      case "app-role":
        result.auth = {
          method: "app-role",
          roleId: env.VAULT_ROLE_ID || result.auth.roleId,
          secretId: env.VAULT_SECRET_ID || result.auth.secretId,
        };
        break;
      case "oidc":
        result.auth = {
          method: "oidc",
          token: env.VAULT_OIDC_TOKEN || result.auth.token,
          ...(env.VAULT_OIDC_ROLE && { role: env.VAULT_OIDC_ROLE }),
        };
        break;
    }
  }

  // Retry overrides
  if (env.VAULT_RETRY_RETRIES)
    result.retry.retries = parseInt(env.VAULT_RETRY_RETRIES);
  if (env.VAULT_RETRY_DELAY)
    result.retry.delay = parseInt(env.VAULT_RETRY_DELAY);

  // Logging overrides
  if (env.VAULT_LOG_LEVEL) result.logging.level = env.VAULT_LOG_LEVEL as any;
  if (env.VAULT_DEBUG) result.logging.http = env.VAULT_DEBUG === "true";

  // Feature overrides
  if (env.VAULT_AUTO_RENEW_TOKEN)
    result.features.autoRenewToken = env.VAULT_AUTO_RENEW_TOKEN === "true";
  if (env.VAULT_AUDIT_ENABLED)
    result.features.auditEnabled = env.VAULT_AUDIT_ENABLED === "true";

  return result;
}

/**
 * Convert CompleteVaultConfig to VaultConfig for the SDK.
 */
function convertToVaultConfig(config: CompleteVaultConfig): VaultConfig {
  const vaultConfig: VaultConfig = {
    baseURL: config.endpoint,
    auth: convertAuthConfig(config.auth),
    ...(config.timeout && { timeout: config.timeout }),
    headers: {},
    retry: true,
    maxRetries: config.retry.retries,
    retryDelay: config.retry.delay,
    debug: config.logging.http || false,
  };

  return vaultConfig;
}

/**
 * Convert ExtendedAuthConfig to AuthConfig for the SDK.
 */
function convertAuthConfig(auth: ExtendedAuthConfig): AuthConfig {
  switch (auth.method) {
    case "token":
    case "jwt":
    case "bearer":
      return {
        type:
          auth.method === "jwt"
            ? "jwt"
            : auth.method === "bearer"
              ? "bearer"
              : "jwt",
        token: auth.token,
      };

    case "app-role":
      return {
        type: "jwt", // Will be handled specially by the client
        token: "", // Will be obtained via AppRole login
      };

    case "oidc":
      return {
        type: "jwt",
        token: auth.token,
      };

    case "session":
      return {
        type: "session",
        ...(auth.cookieName && {
          session: {
            cookieName: auth.cookieName,
          },
        }),
      };

    case "none":
      return {
        type: "none",
      };

    default:
      const _exhaustiveCheck: never = auth;
      throw new Error(`Unsupported auth method: ${_exhaustiveCheck}`);
  }
}

/**
 * Validate a CompleteVaultConfig.
 */
function validateConfig(config: CompleteVaultConfig): void {
  if (!config.endpoint) {
    throw new Error("Vault endpoint is required");
  }

  if (!config.auth) {
    throw new Error("Authentication configuration is required");
  }

  // Validate auth config based on method
  switch (config.auth.method) {
    case "token":
    case "jwt":
    case "bearer":
    case "oidc":
      if (!config.auth.token) {
        throw new Error(
          `Token is required for auth method: ${config.auth.method}`,
        );
      }
      break;

    case "app-role":
      if (!config.auth.roleId || !config.auth.secretId) {
        throw new Error(
          "Both roleId and secretId are required for app-role authentication",
        );
      }
      break;

    case "session":
      // Session auth is valid as-is
      break;

    case "none":
      // No auth is valid for public endpoints
      break;

    default:
      const _exhaustiveCheck: never = config.auth;
      return _exhaustiveCheck;
  }

  // Validate retry config
  if (config.retry.retries < 0) {
    throw new Error("Retry count must be non-negative");
  }

  if (config.retry.delay < 0) {
    throw new Error("Retry delay must be non-negative");
  }

  // Validate timeout
  if (config.timeout && config.timeout <= 0) {
    throw new Error("Timeout must be greater than 0");
  }
}

/**
 * Load complete configuration with automatic fallbacks.
 */
export async function loadConfiguration(
  options: ConfigLoaderOptions = {},
): Promise<LoadedConfig> {
  const opts = { ...DEFAULT_LOADER_OPTIONS, ...options };
  const sources: LoadedConfig["sources"] = {};

  let config: CompleteVaultConfig;

  // Try to load from file first
  if (opts.configPath) {
    const fileConfig = await loadConfigFromFile(opts.configPath);
    if (fileConfig) {
      sources.file = opts.configPath;

      // Get environment-specific config
      const envConfig = fileConfig.environments?.[opts.environment!];

      // Start with default config
      config = {
        ...fileConfig.default,
        ...envConfig,
        // Deep merge for nested objects
        auth: { ...fileConfig.default.auth, ...envConfig?.auth },
        retry: { ...fileConfig.default.retry, ...envConfig?.retry },
        logging: { ...fileConfig.default.logging, ...envConfig?.logging },
        features: { ...fileConfig.default.features, ...envConfig?.features },
      };
    } else {
      // Fallback to environment variables
      sources.environment = "process.env";
      config = loadConfigFromEnv();
    }
  } else {
    // No config path specified, use environment variables
    sources.environment = "process.env";
    config = loadConfigFromEnv();
  }

  // Apply environment variable overrides if enabled
  if (opts.enableEnvOverrides) {
    const envVarNames = Object.keys(process.env).filter((key) =>
      key.startsWith("VAULT_"),
    );
    if (envVarNames.length > 0) {
      sources.envVars = envVarNames;
      config = applyEnvOverrides(config);
    }
  }

  // Validate configuration
  if (opts.strict) {
    validateConfig(config);
  }

  return {
    config,
    sources,
  };
}

/**
 * Load VaultConfig for createVaultClient().
 * This is the main entry point used by the SDK.
 */
export async function loadVaultConfig(
  options?: ConfigLoaderOptions,
): Promise<VaultConfig> {
  const loaded = await loadConfiguration(options);
  return convertToVaultConfig(loaded.config);
}
