// Functional self-tests for the admin Diagnostics page. These hit the LIVE API
// as a real client would. "smoke" steps are non-mutating (safe on every deploy);
// "full" steps create + clean up their own throwaway data.
//
// Convention: add a step here for every new feature/endpoint you build.
import { api, ApiError, getToken } from "./api";
import { loadRuntimeConfig } from "./config";
import type { PublicUser } from "./types";

export type StepKind = "smoke" | "full";
export type StepStatus = "pending" | "running" | "pass" | "fail";

export interface StepResult {
  id: string;
  name: string;
  kind: StepKind;
  status: StepStatus;
  detail?: string;
  ms?: number;
}

interface Step {
  id: string;
  name: string;
  kind: StepKind;
  run: (user: PublicUser) => Promise<void>;
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export const STEPS: Step[] = [
  {
    id: "config",
    name: "Runtime config loaded",
    kind: "smoke",
    run: async () => {
      const cfg = await loadRuntimeConfig();
      assert(cfg.apiUrl, "config.json is missing apiUrl");
    },
  },
  {
    id: "health",
    name: "API health (GET /health)",
    kind: "smoke",
    run: async () => {
      const { ok } = await api.health();
      assert(ok, "health endpoint did not return ok");
    },
  },
  {
    id: "session",
    name: "Session valid (GET /me)",
    kind: "smoke",
    run: async (user) => {
      const { user: me } = await api.me();
      assert(me.userId === user.userId, "GET /me returned a different user");
    },
  },
  {
    id: "users",
    name: "List users (GET /users)",
    kind: "smoke",
    run: async (user) => {
      const { users } = await api.listUsers();
      assert(users.some((u) => u.userId === user.userId), "current user missing from /users");
    },
  },
  {
    id: "items-list",
    name: "List items (GET /items)",
    kind: "smoke",
    run: async () => {
      const { items } = await api.listItems();
      assert(Array.isArray(items), "items is not an array");
    },
  },
  {
    id: "password-endpoint",
    name: "Change-password endpoint enforces current password",
    kind: "smoke",
    run: async () => {
      let rejected = false;
      try {
        await api.changePassword(`wrong-${Date.now()}`, "diagnostic-check");
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 400)) rejected = true;
        else throw err;
      }
      assert(rejected, "endpoint did not reject an incorrect current password");
    },
  },
  {
    id: "admin-reset-endpoint",
    name: "Admin password-reset endpoint validates",
    kind: "smoke",
    run: async (user) => {
      let rejected = false;
      try {
        await api.adminResetPassword(user.userId, "x"); // too short → 400, no change
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) rejected = true;
        else throw err;
      }
      assert(rejected, "endpoint did not reject a too-short password");
    },
  },
  {
    id: "items-crud",
    name: "Item create → read → delete round-trip",
    kind: "full",
    run: async () => {
      const title = `[diagnostic] ${new Date().toISOString()}`;
      const { item } = await api.createItem(title, "created by diagnostics");
      assert(item.itemId, "createItem returned no itemId");
      const after = await api.listItems();
      assert(
        after.items.some((i) => i.itemId === item.itemId),
        "created item not found in list"
      );
      await api.deleteItem(item.itemId);
      const cleaned = await api.listItems();
      assert(
        !cleaned.items.some((i) => i.itemId === item.itemId),
        "item still present after delete"
      );
    },
  },
];

// WebSocket module test — only included when the deployed config has a wsUrl.
const WS_STEP: Step = {
  id: "websocket",
  name: "WebSocket connect + echo round-trip",
  kind: "full",
  run: async () => {
    const { wsUrl } = await loadRuntimeConfig();
    const token = getToken();
    assert(wsUrl, "no wsUrl configured");
    assert(token, "no auth token");
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      const text = `diag-${Date.now()}`;
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("timed out waiting for echo"));
      }, 10000);
      ws.onopen = () => ws.send(JSON.stringify({ action: "echo", text }));
      ws.onmessage = (ev) => {
        try {
          const e = JSON.parse(ev.data) as { type?: string; text?: string };
          if (e.type === "echo" && e.text === text) {
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        } catch {
          /* ignore */
        }
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error("WebSocket connection error"));
      };
    });
  },
};

export async function runDiagnostics(
  mode: "smoke" | "all",
  user: PublicUser,
  onUpdate: (results: StepResult[]) => void
): Promise<StepResult[]> {
  const cfg = await loadRuntimeConfig();
  const all = cfg.wsUrl ? [...STEPS, WS_STEP] : STEPS;
  const chosen = mode === "all" ? all : all.filter((s) => s.kind === "smoke");
  const results: StepResult[] = chosen.map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind,
    status: "pending",
  }));
  onUpdate([...results]);

  for (let i = 0; i < chosen.length; i++) {
    results[i] = { ...results[i], status: "running" };
    onUpdate([...results]);
    const t0 = performance.now();
    try {
      await chosen[i].run(user);
      results[i] = { ...results[i], status: "pass", ms: Math.round(performance.now() - t0) };
    } catch (err) {
      results[i] = {
        ...results[i],
        status: "fail",
        ms: Math.round(performance.now() - t0),
        detail: err instanceof Error ? err.message : String(err),
      };
    }
    onUpdate([...results]);
  }
  return results;
}
