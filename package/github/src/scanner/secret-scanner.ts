import { GitHubAuth } from "../auth/github-auth.js";
import { logger } from "../utils/logger.js";
import { AppConfig } from "../config/schema.js";
import { SecretMatch } from "../types/index.js";
import { createHash } from "crypto";

interface ScanResult {
  secrets: SecretMatch[];
  summary: {
    totalFiles: number;
    scannedFiles: number;
    totalSecrets: number;
    riskScore: number;
  };
}

interface FileContent {
  path: string;
  content: string;
  sha?: string;
}

export class SecretScanner {
  private config: AppConfig["scanner"];

  constructor(config: AppConfig["scanner"]) {
    this.config = config;
  }

  /**
   * Scanne une Pull Request complète
   */
  async scanPullRequest(
    owner: string,
    repo: string,
    prNumber: number,
    installationId?: number,
  ): Promise<ScanResult> {
    try {
      logger.info(`Scan de PR #${prNumber} dans ${owner}/${repo}`);

      const githubAuth = new GitHubAuth({} as any); // Config temporaire
      const octokit = await githubAuth.getInstallationClient(installationId);

      // Récupérer les fichiers modifiés dans la PR
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
      });

      // Récupérer le contenu des fichiers pertinents
      const relevantFiles = await this.getRelevantFiles(
        files,
        octokit,
        owner,
        repo,
      );

      // Scanner chaque fichier
      const allSecrets: SecretMatch[] = [];
      for (const file of relevantFiles) {
        const secrets = await this.scanFile(file.content, file.path, "unknown");
        allSecrets.push(...secrets);
      }

      return {
        secrets: allSecrets,
        summary: {
          totalFiles: files.length,
          scannedFiles: relevantFiles.length,
          totalSecrets: allSecrets.length,
          riskScore: this.calculateRiskScore(allSecrets),
        },
      };
    } catch (error) {
      logger.error(`Erreur lors du scan PR #${prNumber}:`, error);
      throw error;
    }
  }

  /**
   * Scanne un commit spécifique
   */
  async scanCommit(
    owner: string,
    repo: string,
    commitSha: string,
    installationId?: number,
  ): Promise<ScanResult> {
    try {
      logger.info(`Scan du commit ${commitSha} dans ${owner}/${repo}`);

      const githubAuth = new GitHubAuth({} as any); // Config temporaire
      const octokit = await githubAuth.getInstallationClient(installationId);

      // Récupérer les fichiers modifiés dans le commit
      const { data: commit } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: commitSha,
      });

      const relevantFiles = await this.getRelevantFilesForCommit(
        commit.files || [],
        octokit,
        owner,
        repo,
      );

      // Scanner chaque fichier
      const allSecrets: SecretMatch[] = [];
      for (const file of relevantFiles) {
        const secrets = await this.scanFile(file.content, file.path, commitSha);
        allSecrets.push(...secrets);
      }

      return {
        secrets: allSecrets,
        summary: {
          totalFiles: commit.files?.length || 0,
          scannedFiles: relevantFiles.length,
          totalSecrets: allSecrets.length,
          riskScore: this.calculateRiskScore(allSecrets),
        },
      };
    } catch (error) {
      logger.error(`Erreur lors du scan du commit ${commitSha}:`, error);
      throw error;
    }
  }

  /**
   * Scanne le contenu d'un fichier unique
   */
  async scanFile(
    content: string,
    filePath: string,
    commitSha: string = "unknown",
  ): Promise<SecretMatch[]> {
    const secrets: SecretMatch[] = [];
    const lines = content.split("\n");

    // Vérifier si le type de fichier est supporté
    if (!this.shouldScanFile(filePath)) {
      return secrets;
    }

    // Scanner chaque ligne avec chaque pattern
    for (const [patternName, patternString] of Object.entries(
      this.config.secretPatterns,
    )) {
      try {
        const regex = new RegExp(patternString, "gi");

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          let match;

          while ((match = regex.exec(line!)) !== null) {
            if (!match[0]) continue;

            const secret = this.createSecretMatch(
              patternName,
              match[0]!,
              lineIndex + 1,
              filePath,
              commitSha,
            );

            if (this.isValidSecret(secret)) {
              secrets.push(secret);
            }
          }
        }
      } catch (error) {
        logger.warn(`Pattern invalide ${patternName}: ${patternString}`);
      }
    }

    return secrets;
  }

  /**
   * Détermine si un fichier doit être scanné
   */
  private shouldScanFile(filePath: string): boolean {
    // Vérifier l'extension
    const hasValidExtension = this.config.enabledFileTypes.some((ext) =>
      filePath.endsWith(ext),
    );

    if (!hasValidExtension) {
      return false;
    }

    // Vérifier les chemins exclus
    const isExcluded = this.config.excludedPaths.some((excludedPath) =>
      filePath.includes(excludedPath),
    );

    return !isExcluded;
  }

  /**
   * Récupère le contenu des fichiers pertinents pour un commit
   */
  private async getRelevantFilesForCommit(
    files: any[],
    octokit: any,
    owner: string,
    repo: string,
  ): Promise<FileContent[]> {
    return this.getRelevantFiles(files, octokit, owner, repo);
  }

  /**
   * Récupère le contenu des fichiers pertinents
   */
  private async getRelevantFiles(
    files: any[],
    octokit: any,
    owner: string,
    repo: string,
  ): Promise<FileContent[]> {
    const relevantFiles: FileContent[] = [];

    for (const file of files) {
      if (!this.shouldScanFile(file.filename)) {
        continue;
      }

      try {
        // Ignorer les fichiers supprimés
        if (file.status === "removed") {
          continue;
        }

        // Récupérer le contenu du fichier
        if (!file.sha) continue;

        const { data: pullFileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: file.sha,
        });

        if ("content" in pullFileData) {
          const content = Buffer.from(pullFileData.content, "base64").toString(
            "utf8",
          );
          relevantFiles.push({
            path: file.filename,
            content,
            sha: file.sha,
          });
        }

        // Récupérer le contenu du fichier
        if (!file.sha) continue;

        const { data: fileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: file.sha,
        });

        if ("content" in fileData) {
          const content = Buffer.from(fileData.content, "base64").toString(
            "utf8",
          );
          relevantFiles.push({
            path: file.filename,
            content,
            sha: file.sha || "",
          });
        }
      } catch (error) {
        logger.warn(
          `Impossible de récupérer le fichier ${file.filename}:`,
          error,
        );
      }
    }

    return relevantFiles;
  }

  /**
   * Crée un objet SecretMatch
   */
  private createSecretMatch(
    type: string,
    content: string,
    line: number,
    file: string,
    commit: string,
  ): SecretMatch {
    return {
      id: this.generateSecretId(content, file, line),
      type,
      confidence: this.calculateConfidence(type, content, line),
      content,
      line,
      file,
      commit,
      timestamp: new Date(),
    };
  }

  /**
   * Génère un ID unique pour un secret
   */
  private generateSecretId(
    content: string,
    file: string,
    line: number,
  ): string {
    const hash = createHash("sha256")
      .update(`${content}:${file}:${line}`)
      .digest("hex")
      .substring(0, 16);
    return `secret_${hash}`;
  }

  /**
   * Calcule le niveau de confiance pour un secret détecté
   */
  private calculateConfidence(
    type: string,
    content: string,
    _line: number,
  ): "high" | "medium" | "low" {
    // Haute confiance pour les patterns spécifiques
    const highConfidencePatterns = [
      "aws-access-key",
      "github-token",
      "google-api-key",
      "private-key",
    ];

    if (highConfidencePatterns.includes(type)) {
      return "high";
    }

    // Moyenne confiance pour les patterns génériques avec contenu spécifique
    if (type === "api-key" && content.length > 30) {
      return "medium";
    }

    // Basse confiance pour les patterns plus larges
    if (type === "database-url" || type === "password-in-url") {
      // Vérifier si ce n'est pas un exemple ou une documentation
      const lowerContent = content.toLowerCase();
      if (
        lowerContent.includes("example") ||
        lowerContent.includes("localhost") ||
        lowerContent.includes("test")
      ) {
        return "low";
      }
      return "medium";
    }

    return "medium";
  }

  /**
   * Valide si une correspondance est réellement un secret
   */
  private isValidSecret(secret: SecretMatch, lineContent?: string): boolean {
    const lowerLine = lineContent ? lineContent.toLowerCase() : "";
    const lowerContent = secret.content.toLowerCase();

    // Filtrer les faux positifs courants
    const falsePositives = [
      "example",
      "sample",
      "test",
      "demo",
      "placeholder",
      "your_api_key",
      "xxx",
      "yyy",
      "zzz",
      "abcdef",
      "123456",
      "local",
      "dev",
      "staging",
    ];

    // Si le contexte contient des mots-clés de faux positifs
    if (lowerLine && falsePositives.some((fp) => lowerLine.includes(fp))) {
      return false;
    }

    // Si le secret lui-même semble être un exemple
    if (falsePositives.some((fp) => lowerContent.includes(fp))) {
      return false;
    }

    // Pour les clés privées, vérifier qu'il y a vraiment du contenu après
    if (
      secret.type === "private-key" &&
      lineContent &&
      lineContent.length < 100
    ) {
      return false;
    }

    // Si le secret lui-même semble être un exemple
    if (falsePositives.some((fp) => lowerContent.includes(fp))) {
      return false;
    }

    // Pour les clés privées, vérifier qu'il y a vraiment du contenu après
    if (
      secret.type === "private-key" &&
      lineContent &&
      lineContent.length < 100
    ) {
      return false;
    }

    return true;
  }

  /**
   * Calcule un score de risque global
   */
  private calculateRiskScore(secrets: SecretMatch[]): number {
    if (secrets.length === 0) return 0;

    const highWeight = 10;
    const mediumWeight = 5;
    const lowWeight = 2;

    const score = secrets.reduce((total, secret) => {
      switch (secret.confidence) {
        case "high":
          return total + highWeight;
        case "medium":
          return total + mediumWeight;
        case "low":
          return total + lowWeight;
        default:
          return total;
      }
    }, 0);

    // Normaliser le score (max 100)
    return Math.min(
      100,
      Math.round((score / (secrets.length * highWeight)) * 100),
    );
  }
}
