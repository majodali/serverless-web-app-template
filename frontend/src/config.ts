// Runtime configuration. Production serves /config.json (written by CDK). Local
// dev falls back to Vite env vars so the build never hardcodes environment URLs.

export interface RuntimeConfig {
  apiUrl: string;
  appName: string;
}

let cached: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Partial<RuntimeConfig>;
      if (data.apiUrl) {
        cached = { apiUrl: data.apiUrl, appName: data.appName ?? "My App" };
        return cached;
      }
    }
  } catch {
    /* fall through */
  }
  cached = {
    apiUrl: import.meta.env.VITE_API_URL ?? "",
    appName: "My App",
  };
  return cached;
}
