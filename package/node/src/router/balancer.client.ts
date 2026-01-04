import { VaultClient } from "../core/client.js";
import {
  LoadBalancerAlgorithm,
  LoadBalancerMetrics,
  AlgorithmUpdateRequest,
  ApiResponse,
} from "../types/index.js";

/**
 * Load Balancer API client.
 * Handles load balancing algorithm configuration and metrics operations.
 */
export class BalancerClient {
  private readonly client: VaultClient;

  /**
   * Creates a new BalancerClient instance.
   *
   * @param client - Configured VaultClient instance
   */
  constructor(client: VaultClient) {
    this.client = client;
  }

  /**
   * Gets the current load balancing algorithm.
   *
   * @returns Promise resolving to current algorithm
   */
  async getAlgorithm(): Promise<LoadBalancerAlgorithm> {
    const response = await this.client.get<ApiResponse<LoadBalancerAlgorithm>>(
      "/balancer/algorithm",
    );
    return response.data!;
  }

  /**
   * Updates the load balancing algorithm.
   *
   * @param algorithm - New algorithm to set
   * @returns Promise resolving to update confirmation
   */
  async setAlgorithm(
    algorithm: LoadBalancerAlgorithm,
  ): Promise<{ success: boolean }> {
    const response = await this.client.put<ApiResponse<{ success: boolean }>>(
      "/balancer/algorithm",
      { algorithm },
    );
    return response.data!;
  }

  /**
   * Updates the load balancing algorithm with optional weights.
   *
   * @param request - Algorithm update request with weights
   * @returns Promise resolving to update confirmation
   */
  async updateAlgorithm(
    request: AlgorithmUpdateRequest,
  ): Promise<{ success: boolean }> {
    const response = await this.client.put<ApiResponse<{ success: boolean }>>(
      "/balancer/algorithm",
      request,
    );
    return response.data!;
  }

  /**
   * Gets load balancer performance metrics.
   *
   * @returns Promise resolving to detailed metrics
   */
  async getMetrics(): Promise<LoadBalancerMetrics> {
    const response =
      await this.client.get<ApiResponse<LoadBalancerMetrics>>(
        "/balancer/metrics",
      );
    return response.data!;
  }

  /**
   * Gets historical load balancer metrics.
   *
   * @param timeRange - Time range for historical data (e.g., '1h', '24h', '7d')
   * @param granularity - Data granularity (e.g., '1m', '5m', '1h')
   * @returns Promise resolving to time-series metrics
   */
  async getHistoricalMetrics(
    timeRange: string = "24h",
    granularity: string = "5m",
  ): Promise<{
    timeRange: string;
    granularity: string;
    dataPoints: Array<{
      timestamp: string;
      totalRequests: number;
      activeConnections: number;
      requestsPerSecond: number;
      averageResponseTime: number;
    }>;
  }> {
    const params = { timeRange, granularity };
    const response = await this.client.get<ApiResponse<any>>(
      "/balancer/metrics/historical",
      params,
    );
    return response.data!;
  }

  /**
   * Gets service-specific metrics from the load balancer.
   *
   * @param serviceId - Optional service ID to filter metrics
   * @returns Promise resolving to service metrics
   */
  async getServiceMetrics(serviceId?: string): Promise<
    Array<{
      serviceId: string;
      requestCount: number;
      averageResponseTime: number;
      errorRate: number;
      activeConnections: number;
      lastRequest: string;
    }>
  > {
    const params = serviceId ? { serviceId } : undefined;
    const response = await this.client.get<ApiResponse<any>>(
      "/balancer/metrics/services",
      params,
    );
    return response.data!;
  }

  /**
   * Gets available load balancing algorithms.
   *
   * @returns Promise resolving to list of supported algorithms
   */
  async getAvailableAlgorithms(): Promise<
    Array<{
      algorithm: LoadBalancerAlgorithm;
      name: string;
      description: string;
      supportsWeights: boolean;
      supported: boolean;
    }>
  > {
    const response = await this.client.get<ApiResponse<any>>(
      "/balancer/algorithms",
    );
    return response.data!;
  }

  /**
   * Resets load balancer metrics.
   *
   * @param serviceId - Optional service ID to reset specific metrics
   * @returns Promise resolving to reset confirmation
   */
  async resetMetrics(serviceId?: string): Promise<{ success: boolean }> {
    const params = serviceId ? { serviceId } : undefined;
    const response = await this.client.post<ApiResponse<{ success: boolean }>>(
      "/balancer/metrics/reset",
      params,
    );
    return response.data!;
  }

  /**
   * Gets current connection distribution.
   *
   * @returns Promise resolving to connection distribution data
   */
  async getConnectionDistribution(): Promise<{
    totalConnections: number;
    activeConnections: number;
    connectionsByService: Array<{
      serviceId: string;
      serviceName: string;
      connections: number;
      percentage: number;
    }>;
    connectionsByAlgorithm: string;
  }> {
    const response = await this.client.get<ApiResponse<any>>(
      "/balancer/connections",
    );
    return response.data!;
  }

  /**
   * Gets error rates and statistics.
   *
   * @param timeRange - Optional time range for error stats
   * @returns Promise resolving to error statistics
   */
  async getErrorStatistics(timeRange: string = "24h"): Promise<{
    timeRange: string;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    errorsByType: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
    errorsByService: Array<{
      serviceId: string;
      errors: number;
      errorRate: number;
    }>;
  }> {
    const params = { timeRange };
    const response = await this.client.get<ApiResponse<any>>(
      "/balancer/errors",
      params,
    );
    return response.data!;
  }

  /**
   * Gets load balancer configuration.
   *
   * @returns Promise resolving to current configuration
   */
  async getConfiguration(): Promise<{
    algorithm: LoadBalancerAlgorithm;
    healthCheckEnabled: boolean;
    healthCheckInterval: number;
    weightsEnabled: boolean;
    customSettings: Record<string, unknown>;
  }> {
    const response =
      await this.client.get<ApiResponse<any>>("/balancer/config");
    return response.data!;
  }

  /**
   * Updates load balancer configuration.
   *
   * @param config - Configuration updates
   * @returns Promise resolving to update confirmation
   */
  async updateConfiguration(config: {
    healthCheckEnabled?: boolean;
    healthCheckInterval?: number;
    customSettings?: Record<string, unknown>;
  }): Promise<{ success: boolean }> {
    const response = await this.client.put<ApiResponse<{ success: boolean }>>(
      "/balancer/config",
      config,
    );
    return response.data!;
  }
}
