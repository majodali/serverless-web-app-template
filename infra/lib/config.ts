// Deployment configuration, read from environment variables (see infra/.env.example).

export type HostingMode = "cloudfront" | "existing-bucket";

export interface AppConfig {
  account?: string;
  region: string;
  /** Short app name used for stack + resource naming. */
  appName: string;

  // ---- Optional modules ----
  /** Provision the WebSocket API + connections table + handlers. */
  enableWebsocket: boolean;

  // ---- Hosting ----
  /** "cloudfront": own S3 + CloudFront (+ optional domain).
   *  "existing-bucket": deploy the SPA into an existing site bucket under a path. */
  hostingMode: HostingMode;
  // cloudfront mode:
  domainName?: string;
  includeWww: boolean;
  // existing-bucket mode:
  siteBucketName: string;
  sitePathPrefix: string;
  siteBaseUrl: string;

  // ---- First admin ----
  adminUsername: string;
  adminPassword: string;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "myapp";
}

export function loadConfig(): AppConfig {
  const appName = sanitize(process.env.APP_NAME?.trim() || "myapp");
  const hostingMode: HostingMode =
    process.env.HOSTING_MODE === "existing-bucket" ? "existing-bucket" : "cloudfront";

  const siteBucketName = process.env.SITE_BUCKET_NAME?.trim() || "";
  const sitePathPrefix = (process.env.SITE_PATH_PREFIX?.trim() || appName).replace(
    /^\/+|\/+$/g,
    ""
  );
  const siteBaseUrl =
    process.env.SITE_BASE_URL?.trim() ||
    (siteBucketName ? `http://${siteBucketName}/${sitePathPrefix}` : "");

  return {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
    appName,
    enableWebsocket: process.env.ENABLE_WEBSOCKET === "true",
    hostingMode,
    domainName: process.env.DOMAIN_NAME?.trim() || undefined,
    includeWww: process.env.INCLUDE_WWW === "true",
    siteBucketName,
    sitePathPrefix,
    siteBaseUrl,
    adminUsername: process.env.ADMIN_USERNAME?.trim() || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "",
  };
}
