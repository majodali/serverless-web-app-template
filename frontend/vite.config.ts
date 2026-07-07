import * as path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";

// A single infra/.env drives both the CDK stack and the SPA base path. In CI the
// same values come from repo Variables (process.env), which take precedence.
dotenv.config({ path: path.resolve(process.cwd(), "../infra/.env") });

function basePath(): string {
  if (process.env.HOSTING_MODE === "existing-bucket") {
    const prefix = (process.env.SITE_PATH_PREFIX || process.env.APP_NAME || "")
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "");
    if (prefix) return `/${prefix}/`;
  }
  return "/";
}

export default defineConfig({
  base: basePath(),
  plugins: [react()],
  build: { outDir: "dist" },
});
