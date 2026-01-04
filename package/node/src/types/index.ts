/**
 * Service type enumeration for registered services.
 * Determines the protocol and connection type for service communication.
 */
export type ServiceType =
  | "http"
  | "https"
  | "tcp"
  | "udp"
  | "grpc"
  | "websocket";

/**
 * Health state enumeration for service health monitoring.
 * Represents the current health status of a registered service.
 */
export type HealthState = "healthy" | "unhealthy" | "unknown";

/**
 * Load balancing algorithm enumeration.
 * Available algorithms for distributing traffic across service instances.
 */
export type LoadBalancerAlgorithm =
  | "round_robin"
  | "weighted_round_robin"
  | "least_connections"
  | "ip_hash"
  | "random";

/**
 * Authentication type enumeration.
 * Supported authentication methods for API access.
 */
export type AuthType = "none" | "jwt" | "oauth" | "basic";

/**
 * Session information interface.
 * Details about current session.
 */
export interface SessionInfo extends Record<string, unknown> {
  /** Session identifier */
  sessionId: string;

  /** User ID associated with session */
  userId: string;

  /** Session creation timestamp */
  createdAt: string;

  /** Session last access timestamp */
  lastAccessAt: string;

  /** Session expiration timestamp */
  expiresAt: string;

  /** Whether session is active */
  active: boolean;

  /** Session metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Health status interface.
 * Detailed health information for a registered service.
 */
export interface HealthStatus {
  /** Current health state of the service */
  status: HealthState;

  /** Human-readable health message */
  message: string;

  /** Timestamp of the last health check */
  checkedAt: string;

  /** Duration of the health check in milliseconds */
  duration: number;

  /** Additional health check details */
  details?: Record<string, unknown>;
}

/**
 * Service interface.
 * Complete service definition for registration and management.
 */
export interface Service {
  /** Unique service identifier */
  id: string;

  /** Human-readable service name */
  name: string;

  /** Service type/protocol */
  type: ServiceType;

  /** Service network address */
  address: string;

  /** Service port number */
  port: number;

  /** Network protocol */
  protocol: string;

  /** Load balancing weight (1-100) */
  weight: number;

  /** Current health status */
  health?: HealthStatus;

  /** Service metadata */
  metadata?: Record<string, unknown>;

  /** Service tags for categorization */
  tags?: string[];

  /** Service creation timestamp */
  createdAt: string;

  /** Service last update timestamp */
  updatedAt: string;

  /** Last seen timestamp */
  lastSeen: string;
}

/**
 * Service registration request interface.
 * Data required to register a new service.
 */
export interface ServiceRegistrationRequest {
  /** Human-readable service name */
  name: string;

  /** Service type/protocol */
  type: ServiceType;

  /** Service network address */
  address: string;

  /** Service port number */
  port: number;

  /** Network protocol */
  protocol?: string;

  /** Load balancing weight (default: 1) */
  weight?: number;

  /** Service metadata */
  metadata?: Record<string, unknown>;

  /** Service tags */
  tags?: string[];
}

/**
 * Service registration response interface.
 * Response data after successful service registration.
 */
export interface ServiceRegistrationResponse {
  /** Registered service ID */
  id: string;

  /** Registration timestamp */
  registeredAt: string;

  /** Registration status */
  status: "registered" | "pending" | "failed";
}

/**
 * Service list response interface.
 * Paginated list of registered services.
 */
export interface ServiceListResponse {
  /** Array of registered services */
  services: Service[];

  /** Total number of services */
  total: number;

  /** Current page number */
  page: number;

  /** Number of services per page */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Router status interface.
 * Current operational status of the router.
 */
export interface RouterStatus {
  /** Router operational status */
  status: "running" | "stopped" | "error";

  /** Router version */
  version: string;

  /** Uptime in seconds */
  uptime: number;

  /** Number of registered services */
  serviceCount: number;

  /** Current load balancer algorithm */
  algorithm: LoadBalancerAlgorithm;

  /** Router configuration */
  config?: RouterConfig;
}

/**
 * Router configuration interface.
 * Sanitized router configuration (secrets redacted).
 */
export interface RouterConfig {
  /** Server configuration */
  server?: {
    port: number;
    host: string;
  };

  /** Service discovery configuration */
  services?: {
    healthCheckInterval: number;
    deregistrationDelay: number;
  };

  /** Load balancer configuration */
  loadBalancer?: {
    algorithm: LoadBalancerAlgorithm;
    healthCheck: boolean;
  };

  /** Security configuration */
  security?: {
    authEnabled: boolean;
    authType: AuthType;
    rateLimiting: boolean;
  };
}

/**
 * Load balancer metrics interface.
 * Performance and usage metrics for the load balancer.
 */
export interface LoadBalancerMetrics {
  /** Total number of requests handled */
  totalRequests: number;

  /** Number of active connections */
  activeConnections: number;

  /** Requests per second */
  requestsPerSecond: number;

  /** Average response time in milliseconds */
  averageResponseTime: number;

  /** Current algorithm */
  algorithm: LoadBalancerAlgorithm;

  /** Service-specific metrics */
  serviceMetrics?: Array<{
    serviceId: string;
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

/**
 * API response wrapper interface.
 * Standard response format for all API endpoints.
 */
export interface ApiResponse<T = unknown> {
  /** Request success status */
  success: boolean;

  /** Response data (null for errors) */
  data?: T;

  /** Error information (null for success) */
  error?: {
    /** Error code */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Additional error details */
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated request parameters interface.
 * Common pagination parameters for list requests.
 */
export interface PaginationParams {
  /** Page number (default: 1) */
  page?: number;

  /** Number of items per page (default: 20) */
  pageSize?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Service filter parameters interface.
 * Filtering options for service list requests.
 */
export interface ServiceFilterParams
  extends PaginationParams, Record<string, unknown> {
  /** Filter by service type */
  type?: ServiceType;

  /** Filter by health status */
  health?: HealthState;

  /** Filter by tags */
  tags?: string[];

  /** Search in name or metadata */
  search?: string;
}

/**
 * Health check request interface.
 * Parameters for triggering a health check.
 */
export interface HealthCheckRequest {
  /** Service ID to check */
  serviceId: string;

  /** Force check (skip caching) */
  force?: boolean;

  /** Check timeout in milliseconds */
  timeout?: number;
}

/**
 * Algorithm update request interface.
 * Parameters for updating the load balancing algorithm.
 */
export interface AlgorithmUpdateRequest {
  /** New algorithm */
  algorithm: LoadBalancerAlgorithm;

  /** Optional service-specific weights */
  weights?: Array<{
    serviceId: string;
    weight: number;
  }>;
}
