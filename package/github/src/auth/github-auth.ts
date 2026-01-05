import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { createHmac } from "crypto";
import { AppConfig } from "../config/schema.js";
import { logger } from "../utils/logger.js";

export class GitHubAuth {
  private config: AppConfig["github"];

  constructor(config: AppConfig["github"]) {
    this.config = config;
  }

  /**
   * Vérifie la signature du webhook GitHub
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = createHmac("sha256", this.config.webhookSecret)
        .update(payload)
        .digest("hex");

      return signature === `sha256=${expectedSignature}`;
    } catch (error) {
      logger.error(
        "Erreur lors de la vérification de la signature webhook:",
        error,
      );
      return false;
    }
  }

  /**
   * Récupère un token d'accès pour une installation spécifique
   */
  async getInstallationToken(installationId?: number): Promise<string> {
    try {
      const id = installationId || this.config.installationId;
      if (!id) {
        throw new Error("Installation ID requis mais non fourni");
      }

      const auth = createAppAuth({
        appId: this.config.appId,
        privateKey: this.config.privateKey,
        installationId: id,
      });

      const authentication = await auth({ type: "installation" });
      return authentication.token;
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération du token d'installation:",
        error,
      );
      throw error;
    }
  }

  /**
   * Crée un client Octokit authentifié pour une installation
   */
  async getInstallationClient(installationId?: number): Promise<Octokit> {
    try {
      const id = installationId || this.config.installationId;
      if (!id) {
        throw new Error("Installation ID requis mais non fourni");
      }

      const token = await this.getInstallationToken(id);

      return new Octokit({
        auth: token,
        userAgent: "aether-vault-github-app/1.0.0",
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la création du client d'installation:",
        error,
      );
      throw error;
    }
  }

  /**
   * Récupère les informations de l'installation GitHub App
   */
  async getInstallation(installationId: number): Promise<any> {
    try {
      const octokit = await this.getInstallationClient(installationId);
      return await octokit.rest.apps.getInstallation({
        installation_id: installationId,
      });
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des informations d'installation:",
        error,
      );
      throw error;
    }
  }

  /**
   * Vérifie si l'application a les permissions nécessaires
   */
  async hasRequiredPermissions(
    installationId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    try {
      const installation = await this.getInstallation(installationId);
      const permissions = installation.data.permissions;

      return requiredPermissions.every((permission) => {
        const [resource, action] = permission.split(":");
        const perm = permissions[resource as keyof typeof permissions];
        return perm === action || perm === "write";
      });
    } catch (error) {
      logger.error("Erreur lors de la vérification des permissions:", error);
      return false;
    }
  }

  /**
   * Récupère le JWT token de l'application (pour les endpoints d'App)
   */
  async getAppJWT(): Promise<string> {
    try {
      const auth = createAppAuth({
        appId: this.config.appId,
        privateKey: this.config.privateKey,
      });

      const authentication = await auth({ type: "app" });
      return authentication.token;
    } catch (error) {
      logger.error("Erreur lors de la génération du JWT token:", error);
      throw error;
    }
  }

  /**
   * Crée un client Octokit pour les endpoints d'App (authentifié avec JWT)
   */
  async getAppClient(): Promise<Octokit> {
    const token = await this.getAppJWT();
    return new Octokit({
      auth: token,
      userAgent: "aether-vault-github-app/1.0.0",
    });
  }
}
