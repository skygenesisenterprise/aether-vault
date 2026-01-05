import { logger } from "../utils/logger.js";
import { AppConfig } from "../config/schema.js";
import { AuditLog, PRAnalysis } from "../types/index.js";
import { randomUUID } from "crypto";

export class AuditLogger {
  private config: AppConfig["vault"];
  private localLogs: AuditLog[] = [];

  constructor(config: AppConfig["vault"]) {
    this.config = config;
  }

  /**
   * Map risk level to severity
   */
  private mapRiskLevelToSeverity(
    riskLevel: string,
  ): "info" | "warning" | "error" | "critical" {
    switch (riskLevel) {
      case "critical":
        return "critical";
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "info";
    }
  }

  /**
   * Create a critical incident
   */
  private async createCriticalIncident(
    analysis: any,
    auditLog: AuditLog,
  ): Promise<void> {
    try {
      const incidentPayload = {
        id: `incident_${auditLog.id}`,
        timestamp: new Date().toISOString(),
        severity: "critical",
        title: `Critical secrets detected in PR #${analysis.pullRequest.number}`,
        description: `Found ${analysis.secrets.length} secrets with critical risk level`,
        repository: analysis.pullRequest.repository,
        pullRequest: analysis.pullRequest.number,
        user: analysis.pullRequest.author,
        auditLogId: auditLog.id,
        source: "github-app",
      };

      const response = await fetch(`${this.config.endpoint}/api/v1/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "User-Agent": "aether-vault-github-app/1.0.0",
        },
        body: JSON.stringify(incidentPayload),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create incident: ${response.status} ${response.statusText}`,
        );
      }

      logger.info("Critical incident created successfully");
    } catch (error) {
      logger.error("Error creating critical incident:", error);
      throw error;
    }
  }

  /**
   * Get recent logs
   */
  private async getRecentLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.localLogs.slice(-limit);
  }

  /**
   * Enregistre une analyse de Pull Request complète
   */
  async logPRAnalysis(analysis: PRAnalysis): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: randomUUID(),
        timestamp: new Date(),
        eventType: "pr_analyzed",
        repository: analysis.pullRequest.repository,
        pullRequest: analysis.pullRequest.number,
        user: analysis.pullRequest.author,
        details: {
          pullRequest: analysis.pullRequest,
          secretsFound: analysis.secrets.length,
          correlationResults: analysis.correlationResults,
          riskLevel: analysis.riskLevel,
          recommendations: analysis.recommendations,
        },
        severity: this.mapRiskLevelToSeverity(analysis.riskLevel),
      };

      await this.logEvent(auditLog);

      // Si le niveau de risque est critique, créer un incident
      if (analysis.riskLevel === "critical") {
        await this.createCriticalIncident(analysis, auditLog);
      }
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de l'analyse PR:", error);
      throw error;
    }
  }

  /**
   * Enregistre la détection d'un secret
   */
  async logSecretDetection(
    event: Omit<AuditLog, "id" | "timestamp">,
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: randomUUID(),
        timestamp: new Date(),
        ...event,
      };

      await this.logEvent(auditLog);
    } catch (error) {
      logger.error(
        "Erreur lors de l'enregistrement de la détection de secret:",
        error,
      );
      throw error;
    }
  }

  /**
   * Enregistre un commentaire posté sur une PR
   */
  async logPRComment(
    repository: string,
    pullRequest: number,
    user: string,
    commentId: number,
    severity: string,
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: randomUUID(),
        timestamp: new Date(),
        eventType: "comment_posted",
        repository,
        pullRequest,
        user,
        details: {
          commentId,
          severity,
          action: "security_comment_posted",
        },
        severity: severity as any,
      };

      await this.logEvent(auditLog);
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement du commentaire PR:", error);
      throw error;
    }
  }

  /**
   * Enregistre une corrélation avec Vault
   */
  async logVaultCorrelation(
    repository: string,
    secretsFound: number,
    secretsMatched: number,
    user?: string,
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: randomUUID(),
        timestamp: new Date(),
        eventType: "vault_correlation",
        repository,
        user: user || "system",
        details: {
          secretsFound,
          secretsMatched,
          newSecrets: secretsFound - secretsMatched,
        },
        severity: secretsMatched > 0 ? "critical" : "warning",
      };

      await this.logEvent(auditLog);
    } catch (error) {
      logger.error(
        "Erreur lors de l'enregistrement de la corrélation Vault:",
        error,
      );
      throw error;
    }
  }

  /**
   * Enregistre un événement générique
   */
  private async logEvent(auditLog: AuditLog): Promise<void> {
    try {
      // Stockage local pour backup
      this.localLogs.push(auditLog);

      // Garder seulement les 1000 derniers logs en mémoire
      if (this.localLogs.length > 1000) {
        this.localLogs = this.localLogs.slice(-1000);
      }

      // Envoyer vers Vault
      await this.sendToVault(auditLog);

      // Logger localement
      logger.info("Audit log enregistré", {
        id: auditLog.id,
        type: auditLog.eventType,
        repository: auditLog.repository,
        severity: auditLog.severity,
      });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de l'audit log:", error);
      throw error;
    }
  }

  /**
   * Envoie l'audit log vers Vault
   */
  private async sendToVault(auditLog: AuditLog): Promise<void> {
    try {
      const payload = {
        id: auditLog.id,
        timestamp: auditLog.timestamp.toISOString(),
        eventType: auditLog.eventType,
        repository: auditLog.repository,
        pullRequest: auditLog.pullRequest,
        commit: auditLog.commit,
        user: auditLog.user,
        details: auditLog.details,
        severity: auditLog.severity,
        source: "github-app",
        service: "aether-vault-security",
      };

      const response = await fetch(
        `${this.config.endpoint}/api/v1/audit/logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            "User-Agent": "aether-vault-github-app/1.0.0",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout || 30000),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Vault audit API error: ${response.status} ${response.statusText}`,
        );
      }

      // Log successful submission
      logger.info("Audit log sent to Vault successfully");
    } catch (error) {
      logger.error("Erreur lors de l'envoi du log à Vault:", error);
      throw error;
    }
  }

  /**
   * Récupère les logs pour un repository spécifique
   */
  async getRepositoryLogs(
    repository: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    try {
      const response = await fetch(
        `${this.config.endpoint}/api/v1/audit/logs?repository=${encodeURIComponent(repository)}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "User-Agent": "aether-vault-github-app/1.0.0",
          },
          signal: AbortSignal.timeout(this.config.timeout || 30000),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Vault audit API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as AuditLog[];
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des logs du repository:",
        error,
      );
      // Filtrer les logs locaux
      return this.localLogs
        .filter((log) => log.repository === repository)
        .slice(-limit);
    }
  }

  /**
   * Récupère les statistiques d'audit
   */
  async getAuditStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byEventType: Record<string, number>;
    byRepository: Record<string, number>;
  }> {
    try {
      const response = await fetch(
        `${this.config.endpoint}/api/v1/audit/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "User-Agent": "aether-vault-github-app/1.0.0",
          },
          signal: AbortSignal.timeout(this.config.timeout || 30000),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Vault audit API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as {
        total: number;
        bySeverity: Record<string, number>;
        byEventType: Record<string, number>;
        byRepository: Record<string, number>;
      };
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des statistiques d'audit:",
        error,
      );
      // Calculer depuis les logs locaux
      return this.calculateLocalStats();
    }
  }

  /**
   * Calcule les statistiques depuis les logs locaux
   */
  private calculateLocalStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byEventType: Record<string, number>;
    byRepository: Record<string, number>;
  } {
    const stats = {
      total: this.localLogs.length,
      bySeverity: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
      byRepository: {} as Record<string, number>,
    };

    for (const log of this.localLogs) {
      // Par sévérité
      stats.bySeverity[log.severity] =
        (stats.bySeverity[log.severity] || 0) + 1;

      // Par type d'événement
      stats.byEventType[log.eventType] =
        (stats.byEventType[log.eventType] || 0) + 1;

      // Par repository
      stats.byRepository[log.repository] =
        (stats.byRepository[log.repository] || 0) + 1;
    }

    return stats;
  }

  /**
   * Exporte les logs au format CSV
   */
  async exportToCSV(
    repository?: string,
    limit: number = 1000,
  ): Promise<string> {
    try {
      const logs = repository
        ? await this.getRepositoryLogs(repository, limit)
        : await this.getRecentLogs(limit);

      const headers = [
        "id",
        "timestamp",
        "eventType",
        "repository",
        "pullRequest",
        "user",
        "severity",
      ];

      const csvRows = [headers.join(",")];

      for (const log of logs) {
        const row = [
          log.id,
          log.timestamp.toISOString(),
          log.eventType,
          log.repository,
          log.pullRequest?.toString() || "",
          log.user || "",
          log.severity,
        ];
        csvRows.push(row.join(","));
      }

      return csvRows.join("\n");
    } catch (error) {
      logger.error("Erreur lors de l'export CSV:", error);
      throw error;
    }
  }
}
