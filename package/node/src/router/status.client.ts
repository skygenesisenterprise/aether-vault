import { VaultClient } from "../core/client.js";
import { RouterStatus, RouterConfig, ApiResponse } from "../types/index.js";

/**
 * Router Status API client.
 * Handles router monitoring, status checking, and configuration operations.
 */
export class StatusClient {
  private readonly client: VaultClient;

  /**
   * Creates a new StatusClient instance.
   *
   * @param client - Configured VaultClient instance
   */
  constructor(client: VaultClient) {
    this.client = client;
  }

  /**
   * Gets current router status.
   *
   * @returns Promise resolving to router status information
   */
  async getStatus(): Promise<RouterStatus> {
    const response =
      await this.client.get<ApiResponse<RouterStatus>>("/router/status");
    return response.data!;
  }

  /**
   * Gets detailed router configuration.
   *
   * @param includeSecrets - Whether to include sensitive configuration (default: false)
   * @returns Promise resolving to router configuration
   */
  async getConfig(includeSecrets: boolean = false): Promise<RouterConfig> {
    const params = includeSecrets ? { includeSecrets: true } : undefined;
    const response = await this.client.get<ApiResponse<RouterConfig>>(
      "/router/config",
      params,
    );
    return response.data!;
  }

  /**
   * Triggers router configuration reload.
   *
   * @param force - Force reload even if no changes detected
   * @returns Promise resolving to reload result
   */
  async reloadConfig(force: boolean = false): Promise<{
    success: boolean;
    reloadedAt: string;
    changesDetected: boolean;
  }> {
    const response = await this.client.post<ApiResponse<any>>(
      "/router/reload",
      { force },
    );
    return response.data!;
  }

  /**
   * Gets router health status.
   *
   * @returns Promise resolving to health check results
   */
  async getHealth(): Promise<{
    status: "healthy" | "unhealthy" | "degraded";
    checks: Array<{
      name: string;
      status: "pass" | "fail" | "warn";
      message: string;
      duration: number;
      timestamp: string;
    }>;
    uptime: number;
    version: string;
    timestamp: string;
  }> {
    const response = await this.client.get<ApiResponse<any>>("/router/health");
    return response.data!;
  }

  /**
   * Gets router performance metrics.
   *
   * @param timeRange - Time range for metrics (e.g., '1h', '24h', '7d')
   * @returns Promise resolving to performance metrics
   */
  async getPerformanceMetrics(timeRange: string = "1h"): Promise<{
    timeRange: string;
    uptime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: {
      percentage: number;
      average: number;
      peak: number;
    };
    requests: {
      total: number;
      perSecond: number;
      averageResponseTime: number;
    };
    connections: {
      active: number;
      total: number;
      errorRate: number;
    };
  }> {
    const params = { timeRange };
    const response = await this.client.get<ApiResponse<any>>(
      "/router/metrics/performance",
      params,
    );
    return response.data!;
  }

  /**
   * Gets router system information.
   *
   * @returns Promise resolving to system information
   */
  async getSystemInfo(): Promise<{
    version: string;
    buildTime: string;
    gitCommit: string;
    goVersion: string;
    os: string;
    architecture: string;
    hostname: string;
    startTime: string;
    pid: number;
  }> {
    const response = await this.client.get<ApiResponse<any>>("/router/info");
    return response.data!;
  }

  /**
   * Gets router logs.
   *
   * @param params - Log retrieval parameters
   * @returns Promise resolving to log entries
   */
  async getLogs(params?: {
    level?: "debug" | "info" | "warn" | "error";
    limit?: number;
    since?: string;
    until?: string;
    service?: string;
  }): Promise<{
    logs: Array<{
      timestamp: string;
      level: string;
      service: string;
      message: string;
      metadata?: Record<string, unknown>;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    const response = await this.client.get<ApiResponse<any>>(
      "/router/logs",
      params,
    );
    return response.data!;
  }

  /**
   * Gets router statistics summary.
   *
   * @returns Promise resolving to statistics summary
   */
  async getStatistics(): Promise<{
    uptime: number;
    totalRequests: number;
    activeConnections: number;
    registeredServices: number;
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    startTime: string;
    version: string;
  }> {
    const response =
      await this.client.get<ApiResponse<any>>("/router/statistics");
    return response.data!;
  }

  /**
   * Gracefully shuts down the router.
   *
   * @param timeout - Shutdown timeout in seconds
   * @param reason - Optional shutdown reason
   * @returns Promise resolving to shutdown confirmation
   */
  async shutdown(
    timeout: number = 30,
    reason?: string,
  ): Promise<{
    success: boolean;
    shutdownAt: string;
    reason?: string;
  }> {
    const response = await this.client.post<ApiResponse<any>>(
      "/router/shutdown",
      { timeout, reason },
    );
    return response.data!;
  }

  /**
   * Restarts the router.
   *
   * @param graceful - Whether to perform graceful restart
   * @returns Promise resolving to restart confirmation
   */
  async restart(graceful: boolean = true): Promise<{
    success: boolean;
    restartedAt: string;
    graceful: boolean;
  }> {
    const response = await this.client.post<ApiResponse<any>>(
      "/router/restart",
      { graceful },
    );
    return response.data!;
  }

  /**
   * Validates router configuration.
   *
   * @param config - Optional configuration to validate (uses current if not provided)
   * @returns Promise resolving to validation results
   */
  async validateConfig(config?: RouterConfig): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: "error" | "warning";
    }>;
    warnings: Array<{
      field: string;
      message: string;
      severity: "warning";
    }>;
  }> {
    const response = await this.client.post<ApiResponse<any>>(
      "/router/config/validate",
      config ? { config } : undefined,
    );
    return response.data!;
  }

  /**
   * Gets router runtime configuration.
   *
   * @returns Promise resolving to runtime settings
   */
  async getRuntimeConfig(): Promise<{
    maxConnections: number;
    readTimeout: number;
    writeTimeout: number;
    idleTimeout: number;
    keepAlive: boolean;
    compression: boolean;
    tlsEnabled: boolean;
    corsEnabled: boolean;
    rateLimitEnabled: boolean;
  }> {
    const response = await this.client.get<ApiResponse<any>>("/router/runtime");
    return response.data!;
  }

  /**
   * Updates router runtime configuration.
   *
   * @param config - Runtime configuration updates
   * @returns Promise resolving to update confirmation
   */
  async updateRuntimeConfig(config: {
    maxConnections?: number;
    readTimeout?: number;
    writeTimeout?: number;
    idleTimeout?: number;
    keepAlive?: boolean;
    compression?: boolean;
    rateLimitEnabled?: boolean;
  }): Promise<{ success: boolean }> {
    const response = await this.client.put<ApiResponse<{ success: boolean }>>(
      "/router/runtime",
      config,
    );
    return response.data!;
  }
}
