import { VaultConfig, mergeWithDefaults } from "./config.js";
import {
  VaultError,
  VaultAuthError,
  VaultPermissionError,
  VaultNetworkError,
  createErrorFromResponse,
  isVaultError,
} from "./errors.js";

/**
 * HTTP request interface for internal SDK use.
 */
export interface VaultRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  data?: unknown;
  params?: Record<string, unknown>;
  timeout?: number;
}

/**
 * HTTP response interface for internal SDK use.
 */
export interface VaultResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Core HTTP client for the Aether Vault SDK.
 * Handles all HTTP communication, authentication, retries, and error handling.
 * Uses native fetch for isomorphic compatibility (works in both browser and Node.js).
 */
export class VaultClient {
  private readonly config: Required<VaultConfig>;

  /**
   * Creates a new VaultClient instance.
   *
   * @param config - SDK configuration object
   */
  constructor(config: VaultConfig) {
    this.config = mergeWithDefaults(config);
  }

  /**
   * Builds query string from parameters object.
   *
   * @param params - Parameters object
   * @returns Query string
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return "";
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * Builds the complete URL for a request.
   *
   * @param path - Request path
   * @param params - Query parameters
   * @returns Complete URL
   */
  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const baseURL = this.config.baseURL.replace(/\/$/, ""); // Remove trailing slash
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const queryString = this.buildQueryString(params);
    return `${baseURL}${cleanPath}${queryString}`;
  }

  /**
   * Adds authentication headers to the request.
   *
   * @param headers - Existing headers
   * @returns Headers with authentication
   */
  private addAuthHeaders(
    headers: Record<string, string> = {},
  ): Record<string, string> {
    const { auth } = this.config;

    switch (auth.type) {
      case "jwt":
      case "bearer":
        if (auth.token) {
          return {
            ...headers,
            Authorization: `Bearer ${auth.token}`,
          };
        }
        break;

      case "session":
        // Session authentication uses cookies automatically
        // No additional headers needed
        break;

      case "none":
        // No authentication headers needed
        break;
    }

    return headers;
  }

  /**
   * Handles request-level errors (network issues, timeouts, etc.).
   *
   * @param error - Original error from fetch
   * @param url - Request URL
   * @returns VaultError instance
   */
  private handleRequestError(error: unknown, url?: string): VaultError {
    if (this.config.debug) {
      console.error("[VaultClient] Request error:", error);
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new VaultNetworkError("Request timeout", {
          timeout: this.config.timeout,
          url,
        });
      }

      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        return new VaultNetworkError("Network connection failed", {
          originalError: error.message,
          url,
        });
      }
    }

    return new VaultNetworkError("Request failed", {
      originalError: error instanceof Error ? error.message : String(error),
      url,
    });
  }

  /**
   * Handles response-level errors (HTTP errors, API errors, etc.).
   *
   * @param response - Fetch response object
   * @param url - Request URL
   * @param method - Request method
   * @returns Promise that rejects with appropriate VaultError
   */
  private async handleResponseError(
    response: Response,
    url: string,
    method?: string,
  ): Promise<never> {
    let message = `HTTP ${response.status}`;
    let details: Record<string, unknown> = { url, method };

    try {
      const responseText = await response.text();
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          message =
            typeof responseData === "object" &&
            responseData &&
            "message" in responseData
              ? (responseData as { message: string }).message
              : responseText;
          details.response = responseData;
        } catch {
          message = responseText;
          details.response = responseText;
        }
      }
    } catch {
      // Use default message if response parsing fails
    }

    if (this.config.debug) {
      console.error("[VaultClient] Response error:", {
        status: response.status,
        message,
        details,
      });
    }

    throw createErrorFromResponse(response.status, message, details);
  }

  /**
   * Performs an HTTP request with retry logic.
   *
   * @param request - Request configuration
   * @param attempt - Current retry attempt (internal use)
   * @returns Promise resolving to the response data
   */
  private async executeRequest<T = unknown>(
    request: VaultRequest,
    attempt: number = 1,
  ): Promise<T> {
    try {
      const url = this.buildUrl(request.url, request.params);
      const headers = this.addAuthHeaders({
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.config.headers,
        ...request.headers,
      });

      const options: RequestInit = {
        method: request.method,
        headers,
      };

      // Add body for methods that support it
      if (request.data && ["POST", "PUT", "PATCH"].includes(request.method)) {
        options.body = JSON.stringify(request.data);
      }

      // Add timeout using AbortController
      if (request.timeout || this.config.timeout) {
        const controller = new AbortController();
        const timeoutDuration = request.timeout ?? this.config.timeout;

        setTimeout(() => controller.abort(), timeoutDuration);
        options.signal = controller.signal;
      }

      if (this.config.debug) {
        console.log(`[VaultClient] Request: ${request.method} ${url}`, {
          headers,
          data: request.data,
          params: request.params,
        });
      }

      const response = await fetch(url, options);

      if (this.config.debug) {
        console.log(
          `[VaultClient] Response: ${response.status} ${request.method} ${url}`,
          {
            status: response.status,
            statusText: response.statusText,
          },
        );
      }

      // Handle non-2xx responses
      if (!response.ok) {
        await this.handleResponseError(response, url, request.method);
      }

      // Parse response body
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (this.config.debug) {
          console.log(`[VaultClient] Response data:`, data);
        }

        return data;
      } else {
        const text = await response.text();
        if (this.config.debug) {
          console.log(`[VaultClient] Response text:`, text);
        }
        return text as unknown as T;
      }
    } catch (error) {
      // Don't retry on authentication or permission errors
      if (
        isVaultError(error) &&
        (error instanceof VaultAuthError ||
          error instanceof VaultPermissionError)
      ) {
        throw error;
      }

      // Retry logic
      if (this.config.retry && attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * attempt;

        if (this.config.debug) {
          console.log(
            `[VaultClient] Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`,
          );
        }

        await this.sleep(delay);
        return this.executeRequest<T>(request, attempt + 1);
      }

      // Handle network/request errors
      if (error instanceof VaultError) {
        throw error;
      }

      throw this.handleRequestError(error, request.url);
    }
  }

  /**
   * Utility function for async delays.
   *
   * @param ms - Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Performs a GET request.
   *
   * @param url - Request URL path
   * @param params - Optional query parameters
   * @param headers - Optional additional headers
   * @returns Promise resolving to the response data
   */
  public async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const request: VaultRequest = {
      url,
      method: "GET",
    };

    if (params) {
      request.params = params;
    }

    if (headers) {
      request.headers = headers;
    }

    return this.executeRequest<T>(request);
  }

  /**
   * Performs a POST request.
   *
   * @param url - Request URL path
   * @param data - Request body data
   * @param headers - Optional additional headers
   * @returns Promise resolving to the response data
   */
  public async post<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const request: VaultRequest = {
      url,
      method: "POST",
      data,
    };

    if (headers) {
      request.headers = headers;
    }

    return this.executeRequest<T>(request);
  }

  /**
   * Performs a PUT request.
   *
   * @param url - Request URL path
   * @param data - Request body data
   * @param headers - Optional additional headers
   * @returns Promise resolving to the response data
   */
  public async put<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const request: VaultRequest = {
      url,
      method: "PUT",
      data,
    };

    if (headers) {
      request.headers = headers;
    }

    return this.executeRequest<T>(request);
  }

  /**
   * Performs a DELETE request.
   *
   * @param url - Request URL path
   * @param params - Optional query parameters
   * @param headers - Optional additional headers
   * @returns Promise resolving to the response data
   */
  public async delete<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const request: VaultRequest = {
      url,
      method: "DELETE",
    };

    if (params) {
      request.params = params;
    }

    if (headers) {
      request.headers = headers;
    }

    return this.executeRequest<T>(request);
  }

  /**
   * Performs a PATCH request.
   *
   * @param url - Request URL path
   * @param data - Request body data
   * @param headers - Optional additional headers
   * @returns Promise resolving to the response data
   */
  public async patch<T = unknown>(
    url: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const request: VaultRequest = {
      url,
      method: "PATCH",
      data,
    };

    if (headers) {
      request.headers = headers;
    }

    return this.executeRequest<T>(request);
  }

  /**
   * Gets the current client configuration.
   *
   * @returns Current client configuration (read-only)
   */
  public getConfig(): Readonly<Required<VaultConfig>> {
    return this.config;
  }

  /**
   * Updates the authentication token.
   *
   * @param token - New authentication token
   */
  public updateToken(token: string): void {
    (this.config.auth as any).token = token;
  }

  /**
   * Clears the current authentication token.
   */
  public clearToken(): void {
    (this.config.auth as any).token = undefined;
  }
}
