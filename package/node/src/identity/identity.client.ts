import { VaultClient } from "../core/client.js";

/**
 * User identity interface.
 */
export interface Identity {
  /** Unique user identifier */
  id: string;

  /** Username */
  username: string;

  /** Email address */
  email: string;

  /** Display name */
  displayName?: string;

  /** Avatar URL */
  avatar?: string;

  /** User status */
  status: "active" | "inactive" | "suspended" | "pending";

  /** User roles */
  roles: string[];

  /** User permissions */
  permissions: string[];

  /** Account creation timestamp */
  createdAt: string;

  /** Last login timestamp */
  lastLoginAt?: string;

  /** Password last changed timestamp */
  passwordChangedAt?: string;

  /** Email verification status */
  emailVerified: boolean;

  /** Two-factor authentication enabled */
  twoFactorEnabled: boolean;

  /** Account metadata */
  metadata?: Record<string, unknown>;

  /** Tags for categorization */
  tags?: string[];
}

/**
 * Identity creation request interface.
 */
export interface CreateIdentityRequest {
  /** Username */
  username: string;

  /** Email address */
  email: string;

  /** Password */
  password: string;

  /** Display name */
  displayName?: string;

  /** Initial roles */
  roles?: string[];

  /** Account metadata */
  metadata?: Record<string, unknown>;

  /** Tags for categorization */
  tags?: string[];

  /** Send welcome email */
  sendWelcomeEmail?: boolean;
}

/**
 * Identity update request interface.
 */
export interface UpdateIdentityRequest {
  /** New username */
  username?: string;

  /** New email address */
  email?: string;

  /** New password */
  password?: string;

  /** Current password (required for password change) */
  currentPassword?: string;

  /** New display name */
  displayName?: string;

  /** New avatar */
  avatar?: string;

  /** Roles to add/remove */
  roles?: {
    add?: string[];
    remove?: string[];
  };

  /** Metadata updates */
  metadata?: {
    add?: Record<string, unknown>;
    remove?: string[];
  };

  /** Tags to add/remove */
  tags?: {
    add?: string[];
    remove?: string[];
  };
}

/**
 * Identity list response interface.
 */
export interface IdentityListResponse {
  /** Array of identities */
  identities: Identity[];

  /** Total number of identities */
  total: number;

  /** Current page number */
  page: number;

  /** Number of identities per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Identity filter parameters interface.
 */
export interface IdentityFilterParams extends Record<string, unknown> {
  /** Page number (default: 1) */
  page?: number;

  /** Number of items per page (default: 20) */
  pageSize?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: "asc" | "desc";

  /** Filter by status */
  status?: "active" | "inactive" | "suspended" | "pending";

  /** Filter by roles */
  roles?: string[];

  /** Search in username, email, or display name */
  search?: string;

  /** Filter by email verification status */
  emailVerified?: boolean;

  /** Filter by 2FA enabled status */
  twoFactorEnabled?: boolean;

  /** Filter by tags */
  tags?: string[];
}

/**
 * Authentication session interface.
 */
export interface AuthSession {
  /** Session identifier */
  sessionId: string;

  /** User ID */
  userId: string;

  /** Session type */
  type: "password" | "sso" | "api_key" | "oauth";

  /** Session creation timestamp */
  createdAt: string;

  /** Session expiration timestamp */
  expiresAt: string;

  /** Last access timestamp */
  lastAccessAt: string;

  /** IP address */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;

  /** Whether session is active */
  active: boolean;

  /** Device information */
  device?: {
    type: string;
    os: string;
    browser?: string;
  };
}

/**
 * Password change request interface.
 */
export interface PasswordChangeRequest {
  /** Current password */
  currentPassword: string;

  /** New password */
  newPassword: string;

  /** Confirm new password */
  confirmPassword: string;
}

/**
 * Password reset request interface.
 */
export interface PasswordResetRequest {
  /** Email address for password reset */
  email: string;

  /** Reset redirect URL */
  redirectUrl?: string;
}

/**
 * Password reset confirmation interface.
 */
export interface PasswordResetConfirmation {
  /** Reset token */
  token: string;

  /** New password */
  newPassword: string;

  /** Confirm new password */
  confirmPassword: string;
}

/**
 * Email verification request interface.
 */
export interface EmailVerificationRequest {
  /** Email address to verify */
  email: string;

  /** Verification redirect URL */
  redirectUrl?: string;
}

/**
 * Two-factor setup response interface.
 */
export interface TwoFactorSetupResponse {
  /** QR code for 2FA setup */
  qrCode?: string;

  /** Backup codes */
  backupCodes?: string[];

  /** TOTP secret */
  secret?: string;

  /** Setup instructions */
  instructions?: string;
}

/**
 * Client for managing user identity operations.
 */
export class IdentityClient {
  /**
   * Creates a new IdentityClient instance.
   *
   * @param httpClient - HTTP client for API communication
   */
  constructor(private readonly httpClient: VaultClient) {}

  /**
   * Lists all identities with optional filtering and pagination.
   *
   * @param params - Optional filter parameters
   * @returns Promise resolving to paginated identity list
   *
   * @example
   * ```typescript
   * const identities = await vault.identity.list({
   *   page: 1,
   *   pageSize: 20,
   *   status: "active",
   *   roles: ["admin"]
   * });
   * ```
   */
  public async list(
    params?: IdentityFilterParams,
  ): Promise<IdentityListResponse> {
    return this.httpClient.get<IdentityListResponse>("/identity", params);
  }

  /**
   * Gets an identity by ID, username, or email.
   *
   * @param id - Identity ID, username, or email
   * @returns Promise resolving to the identity
   *
   * @example
   * ```typescript
   * const identity = await vault.identity.get("john.doe@example.com");
   * console.log(identity.username); // User's username
   * ```
   */
  public async get(id: string): Promise<Identity> {
    return this.httpClient.get<Identity>(`/identity/${id}`);
  }

  /**
   * Creates a new identity.
   *
   * @param identity - Identity creation data
   * @returns Promise resolving to the created identity
   *
   * @example
   * ```typescript
   * const identity = await vault.identity.create({
   *   username: "john.doe",
   *   email: "john.doe@example.com",
   *   password: "securePassword123",
   *   displayName: "John Doe",
   *   roles: ["user"]
   * });
   * ```
   */
  public async create(identity: CreateIdentityRequest): Promise<Identity> {
    return this.httpClient.post<Identity>("/identity", identity);
  }

  /**
   * Updates an existing identity.
   *
   * @param id - Identity ID, username, or email
   * @param updates - Identity update data
   * @returns Promise resolving to the updated identity
   *
   * @example
   * ```typescript
   * const updated = await vault.identity.update("john.doe@example.com", {
   *   displayName: "John Smith",
   *   roles: { add: ["admin"], remove: ["user"] }
   * });
   * ```
   */
  public async update(
    id: string,
    updates: UpdateIdentityRequest,
  ): Promise<Identity> {
    return this.httpClient.put<Identity>(`/identity/${id}`, updates);
  }

  /**
   * Deletes an identity.
   *
   * @param id - Identity ID, username, or email
   * @returns Promise resolving when the identity is deleted
   *
   * @example
   * ```typescript
   * await vault.identity.delete("john.doe@example.com");
   * ```
   */
  public async delete(id: string): Promise<void> {
    return this.httpClient.delete<void>(`/identity/${id}`);
  }

  /**
   * Gets the current authenticated identity.
   *
   * @returns Promise resolving to the current identity
   *
   * @example
   * ```typescript
   * const current = await vault.identity.getCurrent();
   * console.log(current.username);
   * ```
   */
  public async getCurrent(): Promise<Identity> {
    return this.httpClient.get<Identity>("/identity/me");
  }

  /**
   * Changes password for an identity.
   *
   * @param id - Identity ID, username, or email (omit for current user)
   * @param request - Password change request
   * @returns Promise resolving when password is changed
   *
   * @example
   * ```typescript
   * await vault.identity.changePassword("john.doe@example.com", {
   *   currentPassword: "oldPassword123",
   *   newPassword: "newPassword456",
   *   confirmPassword: "newPassword456"
   * });
   * ```
   */
  public async changePassword(
    id?: string,
    request?: PasswordChangeRequest,
  ): Promise<void> {
    const endpoint = id ? `/identity/${id}/password` : "/identity/me/password";
    return this.httpClient.put<void>(endpoint, request);
  }

  /**
   * Initiates password reset for an identity.
   *
   * @param request - Password reset request
   * @returns Promise resolving when reset email is sent
   *
   * @example
   * ```typescript
   * await vault.identity.initiatePasswordReset({
   *   email: "john.doe@example.com",
   *   redirectUrl: "https://app.example.com/reset-password"
   * });
   * ```
   */
  public async initiatePasswordReset(
    request: PasswordResetRequest,
  ): Promise<void> {
    return this.httpClient.post<void>("/identity/password/reset", request);
  }

  /**
   * Confirms password reset with token.
   *
   * @param confirmation - Password reset confirmation
   * @returns Promise resolving when password is reset
   *
   * @example
   * ```typescript
   * await vault.identity.confirmPasswordReset({
   *   token: "reset-token-123",
   *   newPassword: "newPassword456",
   *   confirmPassword: "newPassword456"
   * });
   * ```
   */
  public async confirmPasswordReset(
    confirmation: PasswordResetConfirmation,
  ): Promise<void> {
    return this.httpClient.post<void>(
      "/identity/password/reset/confirm",
      confirmation,
    );
  }

  /**
   * Initiates email verification for an identity.
   *
   * @param request - Email verification request
   * @returns Promise resolving when verification email is sent
   *
   * @example
   * ```typescript
   * await vault.identity.initiateEmailVerification({
   *   email: "john.doe@example.com",
   *   redirectUrl: "https://app.example.com/verify-email"
   * });
   * ```
   */
  public async initiateEmailVerification(
    request: EmailVerificationRequest,
  ): Promise<void> {
    return this.httpClient.post<void>("/identity/email/verify", request);
  }

  /**
   * Confirms email verification with token.
   *
   * @param token - Verification token
   * @returns Promise resolving when email is verified
   *
   * @example
   * ```typescript
   * await vault.identity.confirmEmailVerification("verification-token-123");
   * ```
   */
  public async confirmEmailVerification(token: string): Promise<void> {
    return this.httpClient.post<void>("/identity/email/verify/confirm", {
      token,
    });
  }

  /**
   * Sets up two-factor authentication for an identity.
   *
   * @param id - Identity ID, username, or email (omit for current user)
   * @param password - Current password for verification
   * @returns Promise resolving to 2FA setup response
   *
   * @example
   * ```typescript
   * const setup = await vault.identity.setupTwoFactor("john.doe@example.com", "currentPassword123");
   * console.log(setup.qrCode); // QR code for authenticator app
   * console.log(setup.backupCodes); // Backup codes
   * ```
   */
  public async setupTwoFactor(
    id?: string,
    password?: string,
  ): Promise<TwoFactorSetupResponse> {
    const endpoint = id
      ? `/identity/${id}/2fa/setup`
      : "/identity/me/2fa/setup";
    const payload = password ? { password } : {};
    return this.httpClient.post<TwoFactorSetupResponse>(endpoint, payload);
  }

  /**
   * Verifies and enables two-factor authentication.
   *
   * @param code - TOTP code from authenticator app
   * @param id - Identity ID, username, or email (omit for current user)
   * @returns Promise resolving when 2FA is enabled
   *
   * @example
   * ```typescript
   * await vault.identity.verifyTwoFactor("123456", "john.doe@example.com");
   * ```
   */
  public async verifyTwoFactor(code: string, id?: string): Promise<void> {
    const endpoint = id
      ? `/identity/${id}/2fa/verify`
      : "/identity/me/2fa/verify";
    return this.httpClient.post<void>(endpoint, { code });
  }

  /**
   * Disables two-factor authentication for an identity.
   *
   * @param code - TOTP code for verification
   * @param id - Identity ID, username, or email (omit for current user)
   * @returns Promise resolving when 2FA is disabled
   *
   * @example
   * ```typescript
   * await vault.identity.disableTwoFactor("123456", "john.doe@example.com");
   * ```
   */
  public async disableTwoFactor(code: string, id?: string): Promise<void> {
    const endpoint = id
      ? `/identity/${id}/2fa/disable`
      : "/identity/me/2fa/disable";
    return this.httpClient.post<void>(endpoint, { code });
  }

  /**
   * Lists active sessions for an identity.
   *
   * @param id - Identity ID, username, or email (omit for current user)
   * @returns Promise resolving to session list
   *
   * @example
   * ```typescript
   * const sessions = await vault.identity.listSessions("john.doe@example.com");
   * console.log(sessions); // Array of active sessions
   * ```
   */
  public async listSessions(id?: string): Promise<AuthSession[]> {
    const endpoint = id ? `/identity/${id}/sessions` : "/identity/me/sessions";
    return this.httpClient.get<AuthSession[]>(endpoint);
  }

  /**
   * Revokes a specific session.
   *
   * @param sessionId - Session ID to revoke
   * @param id - Identity ID, username, or email (omit for current user)
   * @returns Promise resolving when session is revoked
   *
   * @example
   * ```typescript
   * await vault.identity.revokeSession("session-123", "john.doe@example.com");
   * ```
   */
  public async revokeSession(sessionId: string, id?: string): Promise<void> {
    const endpoint = id
      ? `/identity/${id}/sessions/${sessionId}`
      : `/identity/me/sessions/${sessionId}`;
    return this.httpClient.delete<void>(endpoint);
  }

  /**
   * Revokes all sessions except the current one.
   *
   * @param id - Identity ID, username, or email (omit for current user)
   * @returns Promise resolving when all sessions are revoked
   *
   * @example
   * ```typescript
   * await vault.identity.revokeAllSessions("john.doe@example.com");
   * ```
   */
  public async revokeAllSessions(id?: string): Promise<void> {
    const endpoint = id ? `/identity/${id}/sessions` : "/identity/me/sessions";
    return this.httpClient.delete<void>(endpoint);
  }

  /**
   * Checks if an identity exists.
   *
   * @param id - Identity ID, username, or email
   * @returns Promise resolving to true if the identity exists
   *
   * @example
   * ```typescript
   * const exists = await vault.identity.exists("john.doe@example.com");
   * if (exists) {
   *   console.log("Identity exists");
   * }
   * ```
   */
  public async exists(id: string): Promise<boolean> {
    try {
      await this.httpClient.get<void>(`/identity/${id}/exists`);
      return true;
    } catch (error) {
      // If we get a 404, the identity doesn't exist
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "NOT_FOUND"
      ) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }
}
