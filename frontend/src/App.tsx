import { useEffect, useState } from "react";
import { api, getToken, clearToken } from "./api";
import { loadRuntimeConfig } from "./config";
import type { PublicUser } from "./types";
import { Login } from "./components/Login";
import { AppShell } from "./components/AppShell";

export function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [appName, setAppName] = useState("My App");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadRuntimeConfig().then((c) => active && setAppName(c.appName));
    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.me();
        if (active) setUser(user);
      } catch {
        clearToken();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Login appName={appName} onLogin={setUser} />;
  return (
    <AppShell
      user={user}
      appName={appName}
      onLogout={() => {
        clearToken();
        setUser(null);
      }}
    />
  );
}
