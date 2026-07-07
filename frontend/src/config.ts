// Runtime configuration. Production serves /config.json (written by CDK). Local
// dev falls back to Vite env vars so the build never hardcodes environment URLs.

export interface RuntimeConfig {
  apiUrl: string;
  appName: string;
  wsUrl?: string; // present only when the WebSocket module is enabled
}

let cached: RuntimeConfig | null = null;

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;
  try {
    // Relative to the app's base path so it works whether the app is hosted at
    // the site root ("/") or under a sub-folder ("/app/").
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Partial<RuntimeConfig>;
      if (data.apiUrl) {
        cached = {
          apiUrl: data.apiUrl,
          appName: data.appName ?? "My App",
          wsUrl: data.wsUrl,
        };
        return cached;
      }
    }
  } catch {
    /* fall through */
  }
  cached = {
    apiUrl: import.meta.env.VITE_API_URL ?? "",
    appName: "My App",
    wsUrl: import.meta.env.VITE_WS_URL ?? undefined,
  };
  return cached;
}
