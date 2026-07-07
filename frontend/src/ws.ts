// Optional WebSocket client (WebSocket module). Only used when the deployed
// config.json includes a wsUrl. Auto-reconnects; emits parsed server events.
import { loadRuntimeConfig } from "./config";
import { getToken } from "./api";

export interface ServerEvent {
  type: string;
  [key: string]: unknown;
}

type Listener = (event: ServerEvent) => void;

export class AppSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private reconnectDelay = 1000;
  private closedByUser = false;

  async connect(): Promise<void> {
    this.closedByUser = false;
    const { wsUrl } = await loadRuntimeConfig();
    const token = getToken();
    if (!wsUrl || !token) return;

    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    this.ws = ws;
    ws.onopen = () => {
      this.reconnectDelay = 1000;
    };
    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as ServerEvent;
        this.listeners.forEach((l) => l(parsed));
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => {
      this.ws = null;
      if (!this.closedByUser) {
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 15000);
      }
    };
    ws.onerror = () => ws.close();
  }

  send(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  onEvent(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
    this.ws = null;
  }
}
