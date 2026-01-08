/**
 * React hooks for Aether Vault SDK integration with Next.js.
 * Provides convenient hooks for common SDK operations.
 */

import * as React from "react";
import { useContext, useEffect, useState, useCallback } from "react";
import { createVaultClient, AetherVaultClient, VaultConfig } from "../index.js";

// Import types from the appropriate modules
import type {
  Secret as VaultSecret,
  CreateSecretRequest,
  SecretListResponse,
} from "../secrets/secrets.client.js";

import type { Identity } from "../identity/identity.client.js";
import type {
  TotpConfig,
  Totp,
  TotpListResponse,
} from "../totp/totp.client.js";

/**
 * Default vault configuration for Next.js applications.
 */
export const DEFAULT_VAULT_CONFIG: Partial<VaultConfig> = {
  baseURL: "/api/v1", // Uses Next.js API proxy
  timeout: 30000,
  retry: true,
  maxRetries: 3,
  retryDelay: 1000,
  debug: process.env.NODE_ENV === "development",
};

/**
 * Creates a vault client with Next.js optimal defaults.
 *
 * @param config - Optional configuration overrides
 * @returns Configured AetherVaultClient instance
 */
export async function createNextVaultClient(
  config?: Partial<VaultConfig>,
): Promise<AetherVaultClient> {
  const finalConfig: VaultConfig = {
    baseURL: config?.baseURL || "/api/v1",
    auth: config?.auth || { type: "session" },
    timeout: config?.timeout || 30000,
    retry: config?.retry ?? true,
    maxRetries: config?.maxRetries || 3,
    retryDelay: config?.retryDelay || 1000,
    debug: config?.debug ?? false,
    ...(config?.headers && { headers: config.headers }),
  };

  return await createVaultClient(finalConfig);
}

/**
 * Context for sharing vault client across the application.
 */
interface VaultContextValue {
  vault: AetherVaultClient;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const VaultContext = React.createContext<VaultContextValue | undefined>(
  undefined,
);

/**
 * Provider component for vault client and authentication state.
 */
export function VaultProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: Partial<VaultConfig>;
}): React.ReactElement {
  const [vault, setVault] = useState<AetherVaultClient | null>(null);

  useEffect(() => {
    const initVault = async () => {
      const vaultClient = await createNextVaultClient(config);
      setVault(vaultClient);
    };
    initVault();
  }, [config]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAuth = useCallback(async () => {
    if (!vault) return;

    try {
      setIsLoading(true);
      setError(null);
      const isValid = await vault.auth.validate();
      setIsAuthenticated(isValid);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [vault]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: VaultContextValue = {
    vault: vault!,
    isAuthenticated,
    isLoading,
    error,
    refetch: checkAuth,
  };

  return React.createElement(VaultContext.Provider, { value }, children);
}

/**
 * Hook to access vault client and authentication state.
 */
export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}

/**
 * Hook for secrets operations with loading states.
 */
export function useSecrets() {
  const { vault } = useVault();
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const list = useCallback(
    async (params?: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const response: SecretListResponse = await vault.secrets.list(params);
        setSecrets(response.secrets);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const create = useCallback(
    async (data: CreateSecretRequest) => {
      try {
        setIsLoading(true);
        setError(null);
        const secret: VaultSecret = await vault.secrets.create(data);
        setSecrets((prev) => [...prev, secret]);
        return secret;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const update = useCallback(
    async (id: string, data: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const updated: VaultSecret = await vault.secrets.update(id, data);
        setSecrets((prev) =>
          prev.map((secret) =>
            secret.id === id || secret.name === id ? updated : secret,
          ),
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await vault.secrets.delete(id);
        setSecrets((prev) =>
          prev.filter((secret) => secret.id !== id && secret.name !== id),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  return {
    secrets,
    isLoading,
    error,
    operations: {
      list,
      create,
      update,
      remove,
    },
  };
}

/**
 * Hook for TOTP operations with loading states.
 */
export function useTotp() {
  const { vault } = useVault();
  const [totps, setTotps] = useState<Totp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const list = useCallback(
    async (params?: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const response: TotpListResponse = await vault.totp.list(params);
        setTotps(response.totps);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const generate = useCallback(
    async (
      config: TotpConfig,
      generateBackupCodes = false,
      includeQrCode = true,
    ) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await vault.totp.generate(
          config,
          generateBackupCodes,
          includeQrCode,
        );
        setTotps((prev) => [...prev, response.totp]);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const verify = useCallback(
    async (id: string, code: string, options?: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await vault.totp.verify(id, code, options);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  return {
    totps,
    isLoading,
    error,
    operations: {
      list,
      generate,
      verify,
    },
  };
}

/**
 * Hook for identity operations with loading states.
 */
export function useIdentity() {
  const { vault } = useVault();
  const [user, setUser] = useState<Identity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCurrent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData: Identity = await vault.identity.getCurrent();
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [vault]);

  const update = useCallback(
    async (id: string, data: any) => {
      try {
        setIsLoading(true);
        setError(null);
        const updated: Identity = await vault.identity.update(id, data);
        setUser((prev: Identity | null) =>
          prev && (prev.id === id || prev.email === id) ? updated : prev,
        );
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      try {
        setIsLoading(true);
        setError(null);
        await vault.identity.changePassword(undefined, {
          currentPassword,
          newPassword,
          confirmPassword: newPassword,
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [vault],
  );

  return {
    user,
    isLoading,
    error,
    operations: {
      getCurrent,
      update,
      changePassword,
    },
  };
}

/**
 * Hook for authentication operations.
 */
export function useAuth() {
  const { vault, isAuthenticated, isLoading, error, refetch } = useVault();

  const logout = useCallback(async () => {
    try {
      await vault.auth.logout();
      await refetch();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [vault, refetch]);

  return {
    isAuthenticated,
    isLoading,
    error,
    logout,
  };
}
