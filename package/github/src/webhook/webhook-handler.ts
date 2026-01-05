import { FastifyRequest, FastifyReply } from "fastify";
import { GitHubAuth } from "../auth/github-auth.js";
import { SecretScanner } from "../scanner/secret-scanner.js";
import { VaultClient } from "../vaultClient/vault-client.js";
import { PRCommenter } from "../prCommenter/pr-commenter.js";
import { AuditLogger } from "../audit/audit-logger.js";
import { logger } from "../utils/logger.js";
import { AppConfig } from "../config/schema.js";

export interface WebhookEvent {
  zen?: string;
  hook_id: number;
  hook: any;
  repository: any;
  organization?: any;
  sender: any;
  installation?: {
    id: number;
    node_id: string;
  };
  action?: string;
  number?: number;
  pull_request?: any;
  commits?: any[];
  head_commit?: any;
}

export class WebhookHandler {
  private githubAuth: GitHubAuth;
  private secretScanner: SecretScanner;
  private vaultClient: VaultClient;
  private prCommenter: PRCommenter;
  private auditLogger: AuditLogger;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.githubAuth = new GitHubAuth(config.github);
    this.secretScanner = new SecretScanner(config.scanner);
    this.vaultClient = new VaultClient(config.vault);
    this.prCommenter = new PRCommenter(config.github, this.githubAuth);
    this.auditLogger = new AuditLogger(config.vault);
  }

  /**
   * Point d'entrée principal pour tous les webhooks
   */
  async handleWebhook(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const signature = request.headers["x-hub-signature-256"] as string;
      const payload = JSON.stringify(request.body);

      // Vérifier la signature
      if (!this.githubAuth.verifyWebhookSignature(payload, signature)) {
        reply.code(401).send({ error: "Signature invalide" });
        return;
      }

      const event = request.body as WebhookEvent;
      const eventType = request.headers["x-github-event"] as string;

      logger.info(
        `Webhook reçu: ${eventType} pour ${event.repository?.full_name}`,
      );

      // Router vers le bon gestionnaire d'événement
      switch (eventType) {
        case "pull_request":
          await this.handlePullRequest(event);
          break;
        case "push":
          await this.handlePush(event);
          break;
        case "installation":
          await this.handleInstallation(event);
          break;
        default:
          logger.debug(`Événement non géré: ${eventType}`);
      }

      reply.code(200).send({ status: "ok" });
    } catch (error) {
      logger.error("Erreur lors du traitement du webhook:", error);
      reply.code(500).send({ error: "Erreur interne du serveur" });
    }
  }

  /**
   * Gère les événements Pull Request
   */
  private async handlePullRequest(event: WebhookEvent): Promise<void> {
    if (!event.pull_request || !event.repository) {
      logger.warn("Événement PR incomplet");
      return;
    }

    const { action, pull_request, repository, sender, installation } = event;

    // Ne traiter que les PR ouvertes ou synchronisées
    if (!["opened", "synchronize", "reopened"].includes(action || "")) {
      logger.debug(`Action PR ignorée: ${action}`);
      return;
    }

    try {
      logger.info(
        `Analyse PR #${pull_request.number} dans ${repository.full_name}`,
      );

      // Scanner les secrets dans la PR
      const scanResults = await this.secretScanner.scanPullRequest(
        repository.owner.login,
        repository.name,
        pull_request.number,
        installation?.id,
      );

      // Corréler avec Vault
      const correlationResults = await this.vaultClient.correlateSecrets(
        scanResults.secrets,
      );

      // Calculer le niveau de risque
      const riskLevel = this.calculateRiskLevel(
        scanResults,
        correlationResults,
      );

      // Logger l'audit
      await this.auditLogger.logPRAnalysis({
        pullRequest: {
          number: pull_request.number,
          title: pull_request.title,
          author: sender.login,
          baseBranch: pull_request.base.ref,
          headBranch: pull_request.head.ref,
          repository: repository.full_name,
          owner: repository.owner.login,
        },
        secrets: scanResults.secrets,
        correlationResults,
        riskLevel,
        recommendations: this.generateRecommendations(
          riskLevel,
          correlationResults,
        ),
      });

      // Commenter la PR si nécessaire
      if (this.config.policy.autoComment && scanResults.secrets.length > 0) {
        await this.prCommenter.commentOnPR(
          repository.owner.login,
          repository.name,
          pull_request.number,
          scanResults,
          correlationResults,
          riskLevel,
          installation?.id,
        );
      }

      // Bloquer la PR si critique
      if (this.config.policy.blockOnCritical && riskLevel === "critical") {
        await this.prCommenter.blockPR(
          repository.owner.login,
          repository.name,
          pull_request.number,
          installation?.id,
        );
      }
    } catch (error) {
      logger.error(
        `Erreur lors du traitement PR #${pull_request.number}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Gère les événements Push
   */
  private async handlePush(event: WebhookEvent): Promise<void> {
    if (!event.commits || !event.repository) {
      logger.warn("Événement push incomplet");
      return;
    }

    try {
      logger.info(
        `Analyse push dans ${event.repository.full_name}, ${event.commits.length} commits`,
      );

      // Scanner chaque commit pour des secrets
      for (const commit of event.commits) {
        const scanResults = await this.secretScanner.scanCommit(
          event.repository.owner.login,
          event.repository.name,
          commit.id,
          event.installation?.id,
        );

        if (scanResults.secrets.length > 0) {
          // Corréler avec Vault
          const correlationResults = await this.vaultClient.correlateSecrets(
            scanResults.secrets,
          );

          // Logger l'audit
          await this.auditLogger.logSecretDetection({
            eventType: "secret_detected",
            repository: event.repository.full_name,
            commit: commit.id,
            user: commit.author?.username || event.sender.login,
            details: {
              secrets: scanResults.secrets,
              correlationResults,
              riskLevel: this.calculateRiskLevel(
                scanResults,
                correlationResults,
              ),
            },
            severity: "warning",
          });
        }
      }
    } catch (error) {
      logger.error("Erreur lors du traitement push:", error);
      throw error;
    }
  }

  /**
   * Gère les événements d'installation
   */
  private async handleInstallation(event: WebhookEvent): Promise<void> {
    const { action, installation } = event;

    logger.info(`Installation ${action}: ${installation?.id}`);

    if (action === "created" && installation) {
      try {
        // Vérifier les permissions requises
        const requiredPermissions = [
          "contents:read",
          "pull_requests:write",
          "issues:write",
        ];

        const hasPermissions = await this.githubAuth.hasRequiredPermissions(
          installation.id,
          requiredPermissions,
        );

        if (!hasPermissions) {
          logger.warn(
            `Permissions insuffisantes pour l'installation ${installation.id}`,
          );
        } else {
          logger.info(`Installation ${installation.id} configurée avec succès`);
        }
      } catch (error) {
        logger.error(
          "Erreur lors de la configuration de l'installation:",
          error,
        );
      }
    }
  }

  /**
   * Calcule le niveau de risque basé sur les secrets détectés
   */
  private calculateRiskLevel(
    _scanResults: { secrets: any[] },
    correlationResults: { matched: any[]; newSecrets: any[] },
  ): "critical" | "high" | "medium" | "low" {
    const { matched, newSecrets } = correlationResults;

    // Critique: secrets connus (déjà dans Vault)
    if (matched.length > 0) {
      return "critical";
    }

    // Haut: nouveaux secrets haute confiance
    const highConfidenceNew = newSecrets.filter((s) => s.confidence === "high");
    if (highConfidenceNew.length > 0) {
      return "high";
    }

    // Moyen: nouveaux secrets moyenne confiance ou nombreux
    if (
      newSecrets.filter((s) => s.confidence === "medium").length > 2 ||
      newSecrets.length > 3
    ) {
      return "medium";
    }

    // Bas: peu de secrets basse confiance
    if (newSecrets.length > 0) {
      return "low";
    }

    return "low";
  }

  /**
   * Génère des recommandations basées sur le niveau de risque
   */
  private generateRecommendations(
    riskLevel: string,
    correlationResults: { matched: any[]; newSecrets: any[] },
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case "critical":
        recommendations.push(
          "🚨 **URGENT**: Secrets détectés qui existent déjà dans Vault!",
        );
        recommendations.push("Révoquez immédiatement les secrets exposés");
        recommendations.push(
          "Effectuez une rotation immédiate de tous les secrets concernés",
        );
        break;
      case "high":
        recommendations.push(
          "⚠️ **ATTENTION**: Nouveaux secrets haute confiance détectés",
        );
        recommendations.push("Vérifiez si ces secrets sont légitimes");
        recommendations.push(
          "Envisagez de les déplacer dans Vault pour gestion centralisée",
        );
        break;
      case "medium":
        recommendations.push(
          "📋 **VÉRIFICATION**: Secrets potentiellement détectés",
        );
        recommendations.push("Examinez manuellement les correspondances");
        recommendations.push("Confirmez qu'il ne s'agit pas de faux positifs");
        break;
      case "low":
        recommendations.push(
          "ℹ️ **INFORMATION**: Quelques correspondances basse confiance",
        );
        recommendations.push("Vérifiez si ces sont de vrais secrets");
        break;
    }

    if (correlationResults.matched.length > 0) {
      recommendations.push(
        `🔐 **Corrélation Vault**: ${correlationResults.matched.length} secret(s) trouvé(s) dans Vault`,
      );
    }

    return recommendations;
  }
}
