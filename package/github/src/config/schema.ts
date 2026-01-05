import { z } from "zod";

export const GitHubAppConfigSchema = z.object({
  appId: z.number(),
  privateKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  installationId: z.number().optional(),
});

export const VaultConfigSchema = z.object({
  endpoint: z.string().url(),
  apiKey: z.string().min(1),
  timeout: z.number().default(30000),
});

export const ScannerConfigSchema = z.object({
  enabledFileTypes: z
    .array(z.string())
    .default([
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
    ]),
  excludedPaths: z
    .array(z.string())
    .default(["node_modules", ".git", "dist", "build", "vendor", ".next"]),
  secretPatterns: z.record(z.string(), z.string()).default({
    "aws-access-key": "AKIA[0-9A-Z]{16}",
    "aws-secret-key": "[A-Za-z0-9/+=]{40}",
    "google-api-key": "AIza[0-9A-Za-z_-]{35}",
    "github-token": "ghp_[a-zA-Z0-9]{36}",
    "api-key":
      "(api[_-]?key|apikey)[\\\\s=:]+[\"\\\\']?[a-zA-Z0-9_-]{16,}[\"\\\\']?",
    "database-url":
      "(mongodb|postgresql|mysql|redis):\\\\/\\\\/[^:]+:[^@]+@[^\\\\/]+",
    "jwt-token": "eyJ[a-zA-Z0-9_-]*\\\\.eyJ[a-zA-Z0-9_-]*\\\\.[a-zA-Z0-9_-]*",
    "private-key": "-----BEGIN (RSA )?PRIVATE KEY-----",
    "password-in-url": "\\\\/\\\\/[^:]+:[^@]+@",
  }),
  confidenceThresholds: z.object({
    high: z.number().default(0.9),
    medium: z.number().default(0.7),
    low: z.number().default(0.5),
  }),
});

export const PolicyConfigSchema = z.object({
  autoComment: z.boolean().default(true),
  blockOnCritical: z.boolean().default(false),
  requireApprovalOnHigh: z.boolean().default(true),
  notificationChannels: z.array(z.string()).default([]),
});

export const AppConfigSchema = z.object({
  github: GitHubAppConfigSchema,
  vault: VaultConfigSchema,
  scanner: ScannerConfigSchema,
  policy: PolicyConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
