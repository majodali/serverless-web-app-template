import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the CloudFront root, so the default base "/" is correct.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist" },
});
