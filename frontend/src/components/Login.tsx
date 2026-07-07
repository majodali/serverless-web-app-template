import { useState } from "react";
import { api, setToken } from "../api";
import type { PublicUser } from "../types";

export function Login({
  appName,
  onLogin,
}: {
  appName: string;
  onLogin: (u: PublicUser) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = await api.login(username.trim(), password);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1>{appName}</h1>
        <p className="sub">Sign in to continue</p>
        <label>
          Username
          <input
            autoFocus
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="error-banner">{error}</div>}
        <button type="submit" disabled={busy || !username || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
