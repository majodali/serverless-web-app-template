// Thin REST client. Attaches the bearer token automatically.
import { loadRuntimeConfig } from "./config";
import type { PublicUser, Item } from "./types";

const TOKEN_KEY = "app.token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { apiUrl } = await loadRuntimeConfig();
  const token = getToken();
  const res = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("GET", "/health"),
  login: (username: string, password: string) =>
    request<{ token: string; user: PublicUser }>("POST", "/login", { username, password }),
  me: () => request<{ user: PublicUser }>("GET", "/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("POST", "/me/password", { currentPassword, newPassword }),
  listUsers: () => request<{ users: PublicUser[] }>("GET", "/users"),
  createUser: (input: {
    username: string;
    password: string;
    displayName?: string;
    role?: "admin" | "member";
  }) => request<{ user: PublicUser }>("POST", "/admin/users", input),
  adminResetPassword: (userId: string, newPassword: string) =>
    request<{ ok: boolean }>("POST", `/admin/users/${userId}/password`, { newPassword }),
  listItems: () => request<{ items: Item[] }>("GET", "/items"),
  createItem: (title: string, body: string) =>
    request<{ item: Item }>("POST", "/items", { title, body }),
  deleteItem: (itemId: string) =>
    request<{ ok: boolean }>("DELETE", `/items/${itemId}`),
};
