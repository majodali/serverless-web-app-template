// Deployment configuration, read from environment variables (see infra/.env.example).

export interface AppConfig {
  account?: string;
  region: string;
  /** Short app name used for stack + resource naming. */
  appName: string;
  /** Optional custom domain; blank -> CloudFront URL only. */
  domainName?: string;
  includeWww: boolean;
  adminUsername: string;
  adminPassword: string;
}

function sanitize(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "myapp";
}

export function loadConfig(): AppConfig {
  const domainName = process.env.DOMAIN_NAME?.trim() || undefined;
  return {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
    appName: sanitize(process.env.APP_NAME?.trim() || "myapp"),
    domainName,
    includeWww: process.env.INCLUDE_WWW === "true",
    adminUsername: process.env.ADMIN_USERNAME?.trim() || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "",
  };
}
