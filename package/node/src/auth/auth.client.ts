import { VaultClient } from "../core/client.js";
import { AuthConfig } from "../core/config.js";
import { AuthCredentials, AuthSession, UserIdentity } from "../types/index.js";

/**
 * Authentication client for Aether Vault API.
 * Provides login, logout, session management, and user authentication operations.
 */
export class AuthClient {
  private readonly client: VaultClient;

  /**
   * Creates a new AuthClient instance.
   *
   * @param client - VaultClient instance for HTTP requests
   * @param _config - Authentication configuration (kept for interface compatibility)
   */
  constructor(client: VaultClient, config: AuthConfig) {
    this.client = client;
    void config; // Mark as intentionally unused for interface compatibility
  }

  /**
   * Authenticates user with credentials.
   *
   * @param credentials - Login credentials (username/password)
   * @returns Promise resolving to authentication session with token and user info
   *
   * @example
   * ```typescript
   * const session = await vault.auth.login({
   *   username: "user@example.com",
   *   password: "securePassword123"
   * });
   *
   * console.log("User logged in:", session.user.email);
   * console.log("Token expires:", session.expiresAt);
   * ```
   */
  public async login(credentials: AuthCredentials): Promise<AuthSession> {
    const response = await this.client.post<{
      token: string;
      expires_at: string;
      user: UserIdentity;
    }>("/api/v1/auth/login", credentials);

    // Convert response to AuthSession format
    return {
      token: response.token,
      expiresAt: new Date(response.expires_at),
      user: response.user,
      tokenType: "Bearer",
    };
  }

  /**
   * Logs out current user and invalidates session.
   *
   * @returns Promise resolving when logout is complete
   *
   * @example
   * ```typescript
   * await vault.auth.logout();
   * console.log("User logged out successfully");
   * ```
   */
  public async logout(): Promise<void> {
    await this.client.post<void>("/api/v1/auth/logout");

    // Clear local token
    this.client.clearToken();
  }

  /**
   * Gets current authentication session information.
   *
   * @returns Promise resolving to session data
   *
   * @example
   * ```typescript
   * const session = await vault.auth.session();
   * if (session.valid) {
   *   console.log("User is authenticated:", session.user.email);
   * } else {
   *   console.log("User is not authenticated");
   * }
   * ```
   */
  public async session(): Promise<{
    user: UserIdentity;
    valid: boolean;
  }> {
    try {
      const response = await this.client.get<UserIdentity>(
        "/api/v1/auth/session",
      );

      return {
        user: response,
        valid: true,
      };
    } catch (error) {
      // If we get an auth error, user is not authenticated
      if (this.isAuthError(error)) {
        return {
          valid: false,
        } as any; // We'll handle this properly
      }

      throw error;
    }
  }

  /**
   * Registers a new user account.
   *
   * @param userData - User registration data
   * @returns Promise resolving to created user information
   *
   * @example
   * ```typescript
   * const user = await vault.auth.register({
   *   email: "newuser@example.com",
   *   password: "securePassword123",
   *   firstName: "John",
   *   lastName: "Doe"
   * });
   *
   * console.log("User registered:", user.email);
   * ```
   */
  public async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<UserIdentity> {
    const response = await this.client.post<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      created_at: string;
      updated_at: string;
      is_active: boolean;
      roles: string[];
    }>("/api/v1/auth/register", userData);

    // Convert response to UserIdentity format
    return {
      id: response.id,
      email: response.email,
      firstName: response.first_name,
      lastName: response.last_name,
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
      isActive: response.is_active,
      roles: response.roles,
    };
  }

  /**
   * Refreshes authentication token.
   *
   * @returns Promise resolving to new session with refreshed token
   *
   * @example
   * ```typescript
   * const refreshedSession = await vault.auth.refresh();
   * console.log("Token refreshed, expires at:", refreshedSession.expiresAt);
   * ```
   */
  public async refresh(): Promise<AuthSession> {
    const response = await this.client.post<{
      token: string;
      expires_at: string;
    }>("/api/v1/auth/refresh");

    return {
      token: response.token,
      expiresAt: new Date(response.expires_at),
      user: await this.getCurrentUser(), // Get current user info
      tokenType: "Bearer",
    };
  }

  /**
   * Changes user password.
   *
   * @param passwordData - Password change data
   * @returns Promise resolving when password is changed
   *
   * @example
   * ```typescript
   * await vault.auth.changePassword({
   *   currentPassword: "oldPassword123",
   *   newPassword: "newPassword456"
   * });
   *
   * console.log("Password changed successfully");
   * ```
   */
  public async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await this.client.post<void>("/api/v1/auth/change-password", {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
    });
  }

  /**
   * Requests password reset.
   *
   * @param email - Email address for password reset
   * @returns Promise resolving when reset request is sent
   *
   * @example
   * ```typescript
   * await vault.auth.forgotPassword("user@example.com");
   * console.log("Password reset email sent");
   * ```
   */
  public async forgotPassword(email: string): Promise<void> {
    await this.client.post<void>("/api/v1/auth/forgot-password", {
      email,
    });
  }

  /**
   * Resets password with reset token.
   *
   * @param resetData - Password reset data
   * @returns Promise resolving when password is reset
   *
   * @example
   * ```typescript
   * await vault.auth.resetPassword({
   *   token: "reset-token-123",
   *   newPassword: "newPassword123"
   * });
   *
   * console.log("Password reset successfully");
   * ```
   */
  public async resetPassword(resetData: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await this.client.post<void>("/api/v1/auth/reset-password", {
      token: resetData.token,
      new_password: resetData.newPassword,
    });
  }

  /**
   * Validates current authentication token.
   *
   * @returns Promise resolving to validation result
   *
   * @example
   * ```typescript
   * const isValid = await vault.auth.validate();
   * if (isValid) {
   *   console.log("Token is valid");
   * } else {
   *   console.log("Token is invalid or expired");
   * }
   * ```
   */
  public async validate(): Promise<boolean> {
    try {
      await this.client.get<UserIdentity>("/api/v1/auth/session");
      return true;
    } catch (error) {
      return this.isAuthError(error);
    }
  }

  /**
   * Gets current user information.
   *
   * @returns Promise resolving to user identity
   *
   * @example
   * ```typescript
   * const user = await vault.auth.getCurrentUser();
   * console.log("Current user:", user.firstName, user.lastName);
   * ```
   */
  public async getCurrentUser(): Promise<UserIdentity> {
    return this.client.get<UserIdentity>("/api/v1/auth/session");
  }

  /**
   * Checks if an error is an authentication error.
   *
   * @param error - Error to check
   * @returns True if error is authentication related
   */
  private isAuthError(error: unknown): boolean {
    if (error && typeof error === "object") {
      const errorObj = error as any;
      return (
        errorObj.code?.includes("UNAUTHORIZED") ||
        errorObj.code?.includes("AUTH") ||
        errorObj.code?.includes("TOKEN") ||
        errorObj.status === 401
      );
    }
    return false;
  }
}
