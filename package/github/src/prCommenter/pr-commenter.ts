import { GitHubAuth } from "../auth/github-auth.js";
import { logger } from "../utils/logger.js";
import { AppConfig } from "../config/schema.js";
import { SecretMatch } from "../types/index.js";

interface CorrelationResult {
  matched: Array<{
    secretMatch: SecretMatch;
    vaultSecret: any;
  }>;
  newSecrets: SecretMatch[];
}

interface CommentData {
  title: string;
  body: string;
  severity: "critical" | "high" | "medium" | "low";
  recommendations: string[];
}

export class PRCommenter {
  private githubAuth: GitHubAuth;
  constructor(_config: AppConfig["github"], githubAuth: GitHubAuth) {
    this.githubAuth = githubAuth;
  }

  /**
   * Commente une Pull Request avec les résultats du scan
   */
  async commentOnPR(
    owner: string,
    repo: string,
    prNumber: number,
    scanResults: { secrets: SecretMatch[] },
    correlationResults: CorrelationResult,
    riskLevel: "critical" | "high" | "medium" | "low",
    installationId?: number,
  ): Promise<void> {
    try {
      logger.info(
        `Commentaire PR #${prNumber} - Niveau de risque: ${riskLevel}`,
      );

      const octokit =
        await this.githubAuth.getInstallationClient(installationId);

      // Vérifier si un commentaire existe déjà
      const existingComment = await this.findExistingComment(
        octokit,
        owner,
        repo,
        prNumber,
      );

      const commentData = this.generateComment(
        scanResults,
        correlationResults,
        riskLevel,
      );

      if (existingComment) {
        // Mettre à jour le commentaire existant
        await octokit.rest.issues.updateComment({
          owner,
          repo,
          comment_id: existingComment.id,
          body: commentData.body,
        });
        logger.info(`Commentaire existant mis à jour pour PR #${prNumber}`);
      } else {
        // Créer un nouveau commentaire
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: commentData.body,
        });
        logger.info(`Nouveau commentaire créé pour PR #${prNumber}`);
      }
    } catch (error) {
      logger.error(`Erreur lors du commentaire PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Bloque une Pull Request en ajoutant un status check
   */
  async blockPR(
    owner: string,
    repo: string,
    prNumber: number,
    installationId?: number,
  ): Promise<void> {
    try {
      logger.info(`Blocage PR #${prNumber} - Secrets critiques détectés`);

      const octokit =
        await this.githubAuth.getInstallationClient(installationId);

      // Créer un status check échouant
      await octokit.rest.repos.createCommitStatus({
        owner,
        repo,
        sha: await this.getPRHeadCommit(octokit, owner, repo, prNumber),
        state: "failure",
        target_url: "https://github.com/aether-vault/security",
        description: "Secrets critiques détectés - PR bloquée",
        context: "Aether Vault Security Scan",
      });

      // Ajouter un commentaire explicatif
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: this.generateBlockComment(),
      });

      logger.info(`PR #${prNumber} bloquée avec succès`);
    } catch (error) {
      logger.error(`Erreur lors du blocage PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Approuve une Pull Request après correction
   */
  async approvePR(
    owner: string,
    repo: string,
    prNumber: number,
    installationId?: number,
  ): Promise<void> {
    try {
      logger.info(`Approbation PR #${prNumber} - Secrets corrigés`);

      const octokit =
        await this.githubAuth.getInstallationClient(installationId);

      // Créer un status check réussi
      await octokit.rest.repos.createCommitStatus({
        owner,
        repo,
        sha: await this.getPRHeadCommit(octokit, owner, repo, prNumber),
        state: "success",
        target_url: "https://github.com/aether-vault/security",
        description: "Aucun secret détecté - PR approuvée",
        context: "Aether Vault Security Scan",
      });

      logger.info(`PR #${prNumber} approuvée avec succès`);
    } catch (error) {
      logger.error(`Erreur lors de l'approbation PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Recherche un commentaire existant de l'app
   */
  private async findExistingComment(
    octokit: any,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<any | null> {
    try {
      const { data: comments } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
      });

      // Chercher un commentaire de notre bot
      return (
        comments.find(
          (comment: any) =>
            comment.user.type === "Bot" &&
            comment.body.includes("🔐 Aether Vault Security Scan"),
        ) || null
      );
    } catch (error) {
      logger.warn(
        "Erreur lors de la recherche des commentaires existants:",
        error,
      );
      return null;
    }
  }

  /**
   * Génère le contenu du commentaire
   */
  private generateComment(
    scanResults: { secrets: SecretMatch[] },
    correlationResults: CorrelationResult,
    riskLevel: "critical" | "high" | "medium" | "low",
  ): CommentData {
    const { secrets } = scanResults;
    const { matched, newSecrets } = correlationResults;

    const title = `🔐 Aether Vault Security Scan - ${riskLevel.toUpperCase()} Risk`;

    let body = `## ${title}\n\n`;

    // Résumé
    body += `### 📊 Résumé\n`;
    body += `- **Secrets détectés**: ${secrets.length}\n`;
    body += `- **Secrets connus**: ${matched.length}\n`;
    body += `- **Nouveaux secrets**: ${newSecrets.length}\n`;
    body += `- **Niveau de risque**: ${riskLevel.toUpperCase()}\n\n`;

    // Alertes selon le niveau de risque
    if (riskLevel === "critical") {
      body += `### 🚨 **ALERTE CRITIQUE**\n`;
      body += `Des secrets connus ont été détectés! Ces secrets existent déjà dans Vault et ont été exposés.\n\n`;
      body += `**Actions immédiates requises:**\n`;
      body += `1. 🔄 Révoquez immédiatement les secrets exposés\n`;
      body += `2. 🔄 Effectuez une rotation de tous les secrets concernés\n`;
      body += `3. 📞 Contactez votre équipe de sécurité\n\n`;
    } else if (riskLevel === "high") {
      body += `### ⚠️ **ALERTE ÉLEVÉE**\n`;
      body += `Nouveaux secrets haute confiance détectés. Vérification immédiate requise.\n\n`;
    }

    // Détails des secrets
    if (secrets.length > 0) {
      body += `### 🔍 Détails des secrets\n\n`;

      // Secrets connus
      if (matched.length > 0) {
        body += `#### 🔓 Secrets connus (exposés)\n`;
        body += `| Type | Fichier | Ligne | Confiance |\n`;
        body += `|------|---------|-------|-----------|\n`;

        for (const match of matched) {
          body += `| ${match.secretMatch.type} | \`${match.secretMatch.file}\` | ${match.secretMatch.line} | ${match.secretMatch.confidence} |\n`;
        }
        body += `\n`;
      }

      // Nouveaux secrets
      if (newSecrets.length > 0) {
        body += `#### 🆕 Nouveaux secrets\n`;
        body += `| Type | Fichier | Ligne | Confiance |\n`;
        body += `|------|---------|-------|-----------|\n`;

        for (const secret of newSecrets) {
          body += `| ${secret.type} | \`${secret.file}\` | ${secret.line} | ${secret.confidence} |\n`;
        }
        body += `\n`;
      }
    }

    // Recommandations
    const recommendations = this.generateRecommendations(
      riskLevel,
      correlationResults,
    );
    if (recommendations.length > 0) {
      body += `### 💡 Recommandations\n\n`;
      recommendations.forEach((rec) => {
        body += `- ${rec}\n`;
      });
      body += `\n`;
    }

    // Instructions
    body += `### 🛠️ Actions suggérées\n\n`;
    if (matched.length > 0) {
      body += `1. **Révoquer** les secrets exposés immédiatement\n`;
      body += `2. **Rotation** des secrets dans Vault\n`;
      body += `3. **Nettoyer** l'historique Git si nécessaire\n`;
    }
    if (newSecrets.length > 0) {
      body += `1. **Vérifier** si les nouveaux secrets sont légitimes\n`;
      body += `2. **Déplacer** les secrets valides vers Vault\n`;
      body += `3. **Remplacer** les secrets en dur par des variables d'environnement\n`;
    }
    body += `4. **Scanner** à nouveau votre branche après correction\n\n`;

    // Footer
    body += `---\n`;
    body += `*Scan effectué par [Aether Vault](https://github.com/aether-vault) | `;
    body += `Pour toute question, contactez votre équipe de sécurité.*\n`;

    return {
      title,
      body,
      severity: riskLevel,
      recommendations,
    };
  }

  /**
   * Génère un commentaire de blocage
   */
  private generateBlockComment(): string {
    return (
      `## 🚫 PULL REQUEST BLOQUÉE\n\n` +
      `### **Secrets critiques détectés**\n\n` +
      `Cette Pull Request a été bloquée car des secrets critiques ont été détectés.\n\n` +
      `### ⚠️ **Actions requises avant fusion**\n\n` +
      `1. **Révoquer immédiatement** tous les secrets exposés\n` +
      `2. **Effectuer une rotation** des secrets concernés\n` +
      `3. **Nettoyer** l'historique Git pour supprimer les secrets\n` +
      `4. **Scanner à nouveau** après correction\n\n` +
      `### 📞 **Contactez votre équipe de sécurité**\n\n` +
      `Cette détection a été automatiquement rapportée à l'équipe de sécurité.\n` +
      `Ne fusionnez PAS cette PR sans validation explicite.\n\n` +
      `---\n` +
      `*Blocage automatique par Aether Vault Security*`
    );
  }

  /**
   * Génère les recommandations basées sur le niveau de risque
   */
  private generateRecommendations(
    riskLevel: string,
    correlationResults: CorrelationResult,
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case "critical":
        recommendations.push(
          "🚨 **URGENT**: Secrets connus exposés - Révocation immédiate requise",
        );
        recommendations.push(
          "🔄 Effectuez une rotation immédiate de tous les secrets concernés",
        );
        recommendations.push(
          "📞 Contactez immédiatement votre équipe de sécurité",
        );
        recommendations.push(
          "🧹 Nettoyez l'historique Git pour supprimer les traces",
        );
        break;
      case "high":
        recommendations.push(
          "⚠️ **ATTENTION**: Nouveaux secrets haute confiance détectés",
        );
        recommendations.push(
          "🔍 Vérifiez si ces secrets sont légitimes et nécessaires",
        );
        recommendations.push(
          "🏪 Envisagez de les déplacer dans Vault pour gestion centralisée",
        );
        recommendations.push("🔄 Mettez en place une rotation régulière");
        break;
      case "medium":
        recommendations.push(
          "📋 **VÉRIFICATION**: Secrets potentiellement détectés",
        );
        recommendations.push("👁️ Examinez manuellement les correspondances");
        recommendations.push(
          "✅ Confirmez qu'il ne s'agit pas de faux positifs",
        );
        recommendations.push("📝 Documentez les secrets légitimes");
        break;
      case "low":
        recommendations.push(
          "ℹ️ **INFORMATION**: Quelques correspondances basse confiance",
        );
        recommendations.push("🔎 Vérifiez si ces sont de vrais secrets");
        recommendations.push(
          "📚 Envisagez d'améliorer vos pratiques de gestion des secrets",
        );
        break;
    }

    if (correlationResults.matched.length > 0) {
      recommendations.push(
        `🔐 **Corrélation Vault**: ${correlationResults.matched.length} secret(s) trouvé(s) dans Vault`,
      );
    }

    return recommendations;
  }

  /**
   * Récupère le hash du commit HEAD de la PR
   */
  private async getPRHeadCommit(
    octokit: any,
    owner: string,
    repo: string,
    prNumber: number,
  ): Promise<string> {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return pr.head.sha;
  }
}
