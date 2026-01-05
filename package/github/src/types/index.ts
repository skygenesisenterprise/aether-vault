export interface SecretMatch {
  id: string;
  type: string;
  confidence: "high" | "medium" | "low";
  content: string;
  line: number;
  file: string;
  commit: string;
  timestamp: Date;
}

export interface VaultSecret {
  id: string;
  name: string;
  type: string;
  hash: string;
  createdAt: Date;
  lastRotated?: Date;
  status: "active" | "rotated" | "revoked";
}

export interface PRAnalysis {
  pullRequest: {
    number: number;
    title: string;
    author: string;
    baseBranch: string;
    headBranch: string;
    repository: string;
    owner: string;
  };
  secrets: SecretMatch[];
  correlationResults: {
    matched: Array<{
      secretMatch: SecretMatch;
      vaultSecret: VaultSecret;
    }>;
    newSecrets: SecretMatch[];
  };
  riskLevel: "critical" | "high" | "medium" | "low";
  recommendations: string[];
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType:
    | "secret_detected"
    | "pr_analyzed"
    | "comment_posted"
    | "vault_correlation";
  repository: string;
  pullRequest?: number;
  commit?: string;
  user?: string;
  details: Record<string, any>;
  severity: "info" | "warning" | "error" | "critical";
}

export interface GitHubAppConfig {
  appId: number;
  privateKey: string;
  webhookSecret: string;
  installationId?: number;
}

export interface VaultConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
}

export interface ScannerConfig {
  enabledFileTypes: string[];
  excludedPaths: string[];
  secretPatterns: Record<string, RegExp>;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface PolicyConfig {
  autoComment: boolean;
  blockOnCritical: boolean;
  requireApprovalOnHigh: boolean;
  notificationChannels: string[];
}
