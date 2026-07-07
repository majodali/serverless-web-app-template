// Shared entity + public wire types.

export interface User {
  userId: string;
  username: string;
  usernameLower: string; // case-insensitive login lookup (GSI)
  displayName: string;
  passwordHash: string;
  role: "admin" | "member";
  createdAt: number;
}

export interface PublicUser {
  userId: string;
  username: string;
  displayName: string;
  role: "admin" | "member";
  createdAt: number;
}

export function toPublicUser(u: User): PublicUser {
  return {
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt,
  };
}

// Example resource — copy this pattern for your own domain objects.
export interface Item {
  ownerId: string; // partition key
  itemId: string; // sort key
  title: string;
  body: string;
  createdAt: number;
}

// ---- WebSocket module (only used when ENABLE_WEBSOCKET=true) ----

export interface Connection {
  connectionId: string;
  userId: string;
  username: string;
  connectedAt: number;
}

// Server -> client push payloads (extend for your app).
export type ServerEvent =
  | { type: "echo"; text: string; from: string }
  | { type: "broadcast"; text: string; from: string }
  | { type: "error"; message: string };
