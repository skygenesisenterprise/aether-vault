import { VaultClient } from "../core/client.js";
import {
  Service,
  ServiceRegistrationRequest,
  ServiceRegistrationResponse,
  ServiceListResponse,
  ServiceFilterParams,
  HealthCheckRequest,
  HealthStatus,
  ApiResponse,
} from "../types/index.js";

/**
 * Service Registry API client.
 * Handles service registration, discovery, and health monitoring operations.
 */
export class RegistryClient {
  private readonly client: VaultClient;

  /**
   * Creates a new RegistryClient instance.
   *
   * @param client - Configured VaultClient instance
   */
  constructor(client: VaultClient) {
    this.client = client;
  }

  /**
   * Lists all registered services.
   *
   * @param params - Optional filtering and pagination parameters
   * @returns Promise resolving to paginated service list
   */
  async list(params?: ServiceFilterParams): Promise<ServiceListResponse> {
    return this.client.get<ServiceListResponse>("/registry/services", params);
  }

  /**
   * Gets a specific service by ID.
   *
   * @param id - Unique service identifier
   * @returns Promise resolving to service details
   */
  async get(id: string): Promise<Service> {
    const response = await this.client.get<ApiResponse<Service>>(
      `/registry/services/${id}`,
    );
    return response.data!;
  }

  /**
   * Registers a new service.
   *
   * @param service - Service registration data
   * @returns Promise resolving to registration response
   */
  async register(
    service: ServiceRegistrationRequest,
  ): Promise<ServiceRegistrationResponse> {
    const response = await this.client.post<
      ApiResponse<ServiceRegistrationResponse>
    >("/registry/services", service);
    return response.data!;
  }

  /**
   * Updates an existing service.
   *
   * @param id - Service ID to update
   * @param updates - Partial service updates
   * @returns Promise resolving to updated service
   */
  async update(
    id: string,
    updates: Partial<ServiceRegistrationRequest>,
  ): Promise<Service> {
    const response = await this.client.put<ApiResponse<Service>>(
      `/registry/services/${id}`,
      updates,
    );
    return response.data!;
  }

  /**
   * Unregisters (deletes) a service.
   *
   * @param id - Service ID to unregister
   * @returns Promise resolving when unregistration is complete
   */
  async unregister(id: string): Promise<void> {
    await this.client.delete(`/registry/services/${id}`);
  }

  /**
   * Gets the health status of a specific service.
   *
   * @param id - Service ID to check
   * @param force - Force new health check (skip cache)
   * @returns Promise resolving to health status
   */
  async getHealth(id: string, force: boolean = false): Promise<HealthStatus> {
    const params = force ? { force: true } : undefined;
    const response = await this.client.get<ApiResponse<HealthStatus>>(
      `/registry/services/${id}/health`,
      params,
    );
    return response.data!;
  }

  /**
   * Triggers a health check for a specific service.
   *
   * @param request - Health check request parameters
   * @returns Promise resolving to updated health status
   */
  async checkHealth(request: HealthCheckRequest): Promise<HealthStatus> {
    const response = await this.client.post<ApiResponse<HealthStatus>>(
      `/registry/services/${request.serviceId}/health`,
      { timeout: request.timeout, force: request.force },
    );
    return response.data!;
  }

  /**
   * Lists services by type.
   *
   * @param type - Service type to filter by
   * @param params - Optional pagination parameters
   * @returns Promise resolving to filtered service list
   */
  async listByType(
    type: string,
    params?: Omit<ServiceFilterParams, "type">,
  ): Promise<ServiceListResponse> {
    return this.list({ ...params, type: type as any });
  }

  /**
   * Lists services by health status.
   *
   * @param health - Health status to filter by
   * @param params - Optional pagination parameters
   * @returns Promise resolving to filtered service list
   */
  async listByHealth(
    health: string,
    params?: Omit<ServiceFilterParams, "health">,
  ): Promise<ServiceListResponse> {
    return this.list({ ...params, health: health as any });
  }

  /**
   * Lists services by tags.
   *
   * @param tags - Tags to filter by
   * @param params - Optional pagination parameters
   * @returns Promise resolving to filtered service list
   */
  async listByTags(
    tags: string[],
    params?: Omit<ServiceFilterParams, "tags">,
  ): Promise<ServiceListResponse> {
    return this.list({ ...params, tags });
  }

  /**
   * Searches services by name or metadata.
   *
   * @param query - Search query string
   * @param params - Optional pagination parameters
   * @returns Promise resolving to search results
   */
  async search(
    query: string,
    params?: Omit<ServiceFilterParams, "search">,
  ): Promise<ServiceListResponse> {
    return this.list({ ...params, search: query });
  }

  /**
   * Gets metrics for all services.
   *
   * @returns Promise resolving to aggregated service metrics
   */
  async getMetrics(): Promise<{
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    servicesByType: Record<string, number>;
    averageResponseTime: number;
  }> {
    const response = await this.client.get<ApiResponse<any>>(
      "/registry/services/metrics",
    );
    return response.data!;
  }

  /**
   * Bulk registers multiple services.
   *
   * @param services - Array of service registration requests
   * @returns Promise resolving to bulk registration results
   */
  async bulkRegister(services: ServiceRegistrationRequest[]): Promise<{
    successful: ServiceRegistrationResponse[];
    failed: Array<{ service: ServiceRegistrationRequest; error: string }>;
  }> {
    const response = await this.client.post<ApiResponse<any>>(
      "/registry/services/bulk",
      { services },
    );
    return response.data!;
  }

  /**
   * Bulk unregisters multiple services.
   *
   * @param ids - Array of service IDs to unregister
   * @returns Promise resolving to bulk unregistration results
   */
  async bulkUnregister(ids: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const response = await this.client.delete<ApiResponse<any>>(
      "/registry/services/bulk",
      { ids },
    );
    return response.data!;
  }
}
