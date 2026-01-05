import { config } from "dotenv";
import fastify, { FastifyInstance } from "fastify";
import { WebhookHandler } from "./webhook/webhook-handler.js";
import { AppConfig, AppConfigSchema } from "./config/schema.js";
import { logger } from "./utils/logger.js";

// Charger les variables d'environnement
config();

class Server {
  private app: FastifyInstance;
  private webhookHandler: WebhookHandler;
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.app = this.createServer();
    this.webhookHandler = new WebhookHandler(this.config);
  }

  /**
   * Charge et valide la configuration
   */
  private loadConfiguration(): AppConfig {
    try {
      const rawConfig = {
        github: {
          appId: parseInt(process.env["GITHUB_APP_ID"] || "0"),
          privateKey: process.env["GITHUB_PRIVATE_KEY"] || "",
          webhookSecret: process.env["GITHUB_WEBHOOK_SECRET"] || "",
          installationId: process.env["GITHUB_INSTALLATION_ID"]
            ? parseInt(process.env["GITHUB_INSTALLATION_ID"])
            : undefined,
        },
        vault: {
          endpoint: process.env["VAULT_ENDPOINT"] || "http://localhost:3000",
          apiKey: process.env["VAULT_API_KEY"] || "",
          timeout: process.env["VAULT_TIMEOUT"]
            ? parseInt(process.env["VAULT_TIMEOUT"])
            : 30000,
        },
        scanner: {
          enabledFileTypes: process.env["SCANNER_ENABLED_FILE_TYPES"]?.split(
            ",",
          ) || [
            ".js",
            ".ts",
            ".jsx",
            ".tsx",
            ".py",
            ".go",
            ".rs",
            ".java",
            ".php",
            ".yml",
            ".yaml",
            ".json",
            ".env",
            ".config",
            ".sh",
            ".bash",
          ],
          excludedPaths: process.env["SCANNER_EXCLUDED_PATHS"]?.split(",") || [
            "node_modules",
            ".git",
            "dist",
            "build",
            "vendor",
            ".next",
          ],
          secretPatterns: JSON.parse(
            process.env["SCANNER_SECRET_PATTERNS"] || "{}",
          ),
          confidenceThresholds: {
            high: parseFloat(process.env["SCANNER_CONFIDENCE_HIGH"] || "0.9"),
            medium: parseFloat(
              process.env["SCANNER_CONFIDENCE_MEDIUM"] || "0.7",
            ),
            low: parseFloat(process.env["SCANNER_CONFIDENCE_LOW"] || "0.5"),
          },
        },
        policy: {
          autoComment: process.env["POLICY_AUTO_COMMENT"] !== "false",
          blockOnCritical: process.env["POLICY_BLOCK_ON_CRITICAL"] === "true",
          requireApprovalOnHigh:
            process.env["POLICY_REQUIRE_APPROVAL_ON_HIGH"] !== "false",
          notificationChannels:
            process.env["POLICY_NOTIFICATION_CHANNELS"]?.split(",") || [],
        },
      };

      return AppConfigSchema.parse(rawConfig);
    } catch (error) {
      logger.error("Erreur de configuration:", error);
      process.exit(1);
    }
  }

  /**
   * Crée le serveur Fastify
   */
  private createServer(): FastifyInstance {
    const app = fastify({
      logger: false, // On utilise notre propre logger
      trustProxy: true,
    });

    // Middleware pour le parsing JSON
    app.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      function (_req, body, done) {
        try {
          done(null, JSON.parse(body as string));
        } catch (error) {
          done(error as Error);
        }
      },
    );

    // Route principale pour les webhooks GitHub
    app.post("/webhook", async (request, reply) => {
      return this.webhookHandler.handleWebhook(request, reply);
    });

    // Route pour tester la configuration
    app.get("/config", async (_request, reply) => {
      return reply.send({
        github: {
          appId: this.config.github.appId,
          installationId: this.config.github.installationId,
          hasPrivateKey: !!this.config.github.privateKey,
          hasWebhookSecret: !!this.config.github.webhookSecret,
        },
        vault: {
          endpoint: this.config.vault.endpoint,
          hasApiKey: !!this.config.vault.apiKey,
          timeout: this.config.vault.timeout,
        },
        scanner: {
          enabledFileTypes: this.config.scanner.enabledFileTypes.length,
          excludedPaths: this.config.scanner.excludedPaths.length,
          secretPatterns: Object.keys(this.config.scanner.secretPatterns)
            .length,
        },
        policy: this.config.policy,
      });
    });

    // Middleware de gestion des erreurs
    app.setErrorHandler((error, _request, reply) => {
      const err = error as Error;
      logger.error("Erreur du serveur:", err);

      reply.code(500).send({
        error: "Erreur interne du serveur",
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Middleware de gestion des erreurs
    app.setErrorHandler((error, _request, reply) => {
      const err = error as Error;
      logger.error("Erreur du serveur:", err);

      reply.code(500).send({
        error: "Erreur interne du serveur",
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    });

    return app;
  }

  /**
   * Démarre le serveur
   */
  async start(): Promise<void> {
    try {
      const port = parseInt(process.env["PORT"] || "3000");
      const host = process.env["HOST"] || "0.0.0.0";

      await this.app.listen({ port, host });
      logger.info(`🚀 Aether Vault GitHub App démarrée sur ${host}:${port}`);
      logger.info(`📊 Webhook endpoint: http://${host}:${port}/webhook`);
      logger.info(`❤️  Health check: http://${host}:${port}/health`);
    } catch (error) {
      logger.error("Erreur lors du démarrage du serveur:", error);
      process.exit(1);
    }
  }

  /**
   * Arrête proprement le serveur
   */
  async stop(): Promise<void> {
    try {
      await this.app.close();
      logger.info("Serveur arrêté");
    } catch (error) {
      logger.error("Erreur lors de l'arrêt du serveur:", error);
    }
  }
}

// Gestion du cycle de vie
const server = new Server();

process.on("SIGTERM", async () => {
  logger.info("Signal SIGTERM reçu, arrêt en cours...");
  await server.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Signal SIGINT reçu, arrêt en cours...");
  await server.stop();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Rejet non géré:", { reason, promise });
});

process.on("uncaughtException", (error) => {
  logger.error("Exception non capturée:", error);
  process.exit(1);
});

// Démarrer le serveur
server.start().catch((error) => {
  logger.error("Erreur critique au démarrage:", error);
  process.exit(1);
});
