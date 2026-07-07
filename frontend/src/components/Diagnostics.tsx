import { useEffect, useState } from "react";
import type { PublicUser } from "../types";
import { loadRuntimeConfig } from "../config";
import { runDiagnostics, type StepResult } from "../diagnostics";

const ICON: Record<StepResult["status"], string> = {
  pending: "⚪",
  running: "⏳",
  pass: "✅",
  fail: "❌",
};

export function Diagnostics({ user, onClose }: { user: PublicUser; onClose: () => void }) {
  const [results, setResults] = useState<StepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    loadRuntimeConfig().then((c) => setApiUrl(c.apiUrl)).catch(() => {});
  }, []);

  async function run(mode: "smoke" | "all") {
    if (running) return;
    setRunning(true);
    try {
      await runDiagnostics(mode, user, setResults);
    } finally {
      setRunning(false);
    }
  }

  const done = results.filter((r) => r.status === "pass" || r.status === "fail");
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  return (
    <div className="modal-backdrop" onClick={running ? undefined : onClose}>
      <div className="modal diag-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>🔧 Diagnostics</h2>
          <button className="icon-btn" onClick={onClose} disabled={running}>
            ✕
          </button>
        </header>

        <p className="hint">
          Live functional tests against the API using your admin session.
          <strong> Smoke</strong> is non-mutating (safe after a deploy);
          <strong> Full</strong> also runs an item create/read/delete round-trip.
        </p>
        <div className="diag-env">
          <span className="diag-env-label">API</span>
          <code>{apiUrl || "…"}</code>
        </div>

        <div className="diag-actions">
          <button className="primary-btn" onClick={() => run("smoke")} disabled={running}>
            {running ? "Running…" : "Run smoke tests"}
          </button>
          <button className="secondary-btn" onClick={() => run("all")} disabled={running}>
            Run full suite
          </button>
          {done.length > 0 && (
            <span className={`diag-summary ${failed ? "bad" : "good"}`}>
              {passed} passed{failed ? `, ${failed} failed` : ""}
            </span>
          )}
        </div>

        <div className="diag-results">
          {results.length === 0 && <p className="hint">No results yet — run a suite above.</p>}
          {results.map((r) => (
            <div key={r.id} className={`diag-row ${r.status}`}>
              <span className="diag-icon">{ICON[r.status]}</span>
              <div className="diag-body">
                <div className="diag-name">
                  {r.name}
                  <span className="diag-kind">{r.kind}</span>
                  {typeof r.ms === "number" && <span className="diag-ms">{r.ms} ms</span>}
                </div>
                {r.detail && <div className="diag-detail">{r.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
