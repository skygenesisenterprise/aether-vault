import { logger } from "../utils/logger.js";
import { AppConfig } from "../config/schema.js";
import { SecretMatch, VaultSecret } from "../types/index.js";
import { createHash } from "crypto";

interface CorrelationResult {
  matched: Array<{
    secretMatch: SecretMatch;
    vaultSecret: VaultSecret;
  }>;
  newSecrets: SecretMatch[];
}

export class VaultClient {
  private config: AppConfig["vault"];

  constructor(config: AppConfig["vault"]) {
    this.config = config;
  }

  /**
   * Corrèle les secrets détectés avec ceux existants dans Vault
   */
  async correlateSecrets(
    secretMatches: SecretMatch[],
  ): Promise<CorrelationResult> {
    try {
      logger.info(`Corrélation de ${secretMatches.length} secrets avec Vault`);

      // Récupérer tous les secrets actifs de Vault
      const vaultSecrets = await this.getActiveVaultSecrets();

      const matched: Array<{
        secretMatch: SecretMatch;
        vaultSecret: VaultSecret;
      }> = [];
      const newSecrets: SecretMatch[] = [];

      // Pour chaque secret détecté, calculer son hash et chercher une correspondance
      for (const secretMatch of secretMatches) {
        const secretHash = this.hashSecret(secretMatch.content);
        const vaultSecret = vaultSecrets.find((vs) => vs.hash === secretHash);

        if (vaultSecret) {
          matched.push({
            secretMatch,
            vaultSecret,
          });

          // Mettre à jour le statut du secret dans Vault si nécessaire
          await this.updateSecretStatus(vaultSecret.id, "exposed");
        } else {
          newSecrets.push(secretMatch);

          // Ajouter le nouveau secret à Vault
          await this.addSecretToVault(secretMatch);
        }
      }

      logger.info(
        `Corrélation terminée: ${matched.length} secrets connus, ${newSecrets.length} nouveaux`,
      );

      return {
        matched,
        newSecrets,
      };
    } catch (error) {
      logger.error("Erreur lors de la corrélation des secrets:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les secrets actifs de Vault
   */
  private async getActiveVaultSecrets(): Promise<VaultSecret[]> {
    try {
      const response = await this.makeVaultRequest(
        "/api/v1/secrets?status=active",
        {
          method: "GET",
        },
      );

      return response.data || [];
    } catch (error) {
      logger.error("Erreur lors de la récupération des secrets Vault:", error);
      return [];
    }
  }

  /**
   * Ajoute un nouveau secret à Vault
   */
  private async addSecretToVault(
    secretMatch: SecretMatch,
  ): Promise<VaultSecret> {
    try {
      const secretData = {
        name: this.generateSecretName(secretMatch),
        type: secretMatch.type,
        hash: this.hashSecret(secretMatch.content),
        metadata: {
          source: "github-scan",
          file: secretMatch.file,
          line: secretMatch.line,
          commit: secretMatch.commit,
          confidence: secretMatch.confidence,
          detectedAt: secretMatch.timestamp,
        },
        status: "exposed" as const,
      };

      const response = await this.makeVaultRequest("/api/v1/secrets", {
        method: "POST",
        body: JSON.stringify(secretData),
      });

      logger.info(`Nouveau secret ajouté à Vault: ${secretData.name}`);
      return response.data;
    } catch (error) {
      logger.error("Erreur lors de l'ajout du secret à Vault:", error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un secret dans Vault
   */
  private async updateSecretStatus(
    secretId: string,
    status: "active" | "exposed" | "rotated" | "revoked",
  ): Promise<void> {
    try {
      await this.makeVaultRequest(`/api/v1/secrets/${secretId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      logger.info(`Statut du secret ${secretId} mis à jour: ${status}`);
    } catch (error) {
      logger.error(
        `Erreur lors de la mise à jour du statut du secret ${secretId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Déclenche une rotation de secret
   */
  async rotateSecret(secretId: string, reason: string): Promise<void> {
    try {
      await this.makeVaultRequest(`/api/v1/secrets/${secretId}/rotate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });

      logger.info(`Rotation déclenchée pour le secret ${secretId}: ${reason}`);
    } catch (error) {
      logger.error(`Erreur lors de la rotation du secret ${secretId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère l'historique d'audit pour un secret
   */
  async getSecretAuditHistory(secretId: string): Promise<any[]> {
    try {
      const response = await this.makeVaultRequest(
        `/api/v1/secrets/${secretId}/audit`,
        {
          method: "GET",
        },
      );

      return response.data || [];
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération de l'historique d'audit pour ${secretId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Génère un nom de secret basé sur le contexte
   */
  private generateSecretName(secretMatch: SecretMatch): string {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, "");
    const fileName = secretMatch.file.split("/").pop() || "unknown";
    return `github-${secretMatch.type}-${fileName}-${timestamp}`;
  }

  /**
   * Crée un hash SHA-256 pour le contenu d'un secret
   */
  private hashSecret(content: string): string {
    return createHash("sha256").update(content.trim()).digest("hex");
  }

  /**
   * Effectue une requête HTTP vers l'API Vault
   */
  private async makeVaultRequest(
    endpoint: string,
    options: RequestInit,
  ): Promise<any> {
    const url = `${this.config.endpoint}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      "User-Agent": "aether-vault-github-app/1.0.0",
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(
          `Vault API error: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      const err = error as Error;
      if (err.name === "AbortError") {
        throw new Error(`Timeout de la requête Vault vers ${endpoint}`);
      }

      throw new Error(`Erreur de communication avec Vault: ${err.message}`);
    }
  }

  /**
   * Vérifie la connectivité avec Vault
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeVaultRequest("/api/v1/health", {
        method: "GET",
      });

      return response.status === "ok";
    } catch (error) {
      logger.error("Erreur lors du health check Vault:", error);
      return false;
    }
  }

  /**
   * Récupère des statistiques sur les secrets
   */
  async getSecretStats(): Promise<{
    total: number;
    active: number;
    exposed: number;
    rotated: number;
    revoked: number;
  }> {
    try {
      const response = await this.makeVaultRequest("/api/v1/secrets/stats", {
        method: "GET",
      });

      return (
        response.data || {
          total: 0,
          active: 0,
          exposed: 0,
          rotated: 0,
          revoked: 0,
        }
      );
    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques:", error);
      return {
        total: 0,
        active: 0,
        exposed: 0,
        rotated: 0,
        revoked: 0,
      };
    }
  }

  /**
   * Crée un incident de sécurité pour les secrets exposés
   */
  async createSecurityIncident(
    secrets: SecretMatch[],
    repository: string,
    pullRequest?: number,
  ): Promise<string> {
    try {
      const incidentData = {
        title: `Secrets exposés détectés dans ${repository}`,
        severity: secrets.some((s) => s.confidence === "high")
          ? "high"
          : "medium",
        description: `Détection de ${secrets.length} secret(s) potentiellement exposé(s)`,
        details: {
          repository,
          pullRequest,
          secrets: secrets.map((s) => ({
            type: s.type,
            confidence: s.confidence,
            file: s.file,
            line: s.line,
            timestamp: s.timestamp,
          })),
        },
        source: "github-app",
      };

      const response = await this.makeVaultRequest("/api/v1/incidents", {
        method: "POST",
        body: JSON.stringify(incidentData),
      });

      logger.info(`Incident de sécurité créé: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      logger.error("Erreur lors de la création de l'incident:", error);
      throw error;
    }
  }
}
