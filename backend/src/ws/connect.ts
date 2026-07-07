// $connect route. Authenticates via ?token=<jwt> and records the connection.
// IMPORTANT: do NOT PostToConnection here — the socket isn't established yet
// (it returns 410, which would delete the row we just stored). Reply to the
// client's first message instead (see echo.ts).
import { verifyToken } from "../lib/auth";
import { putConnection } from "../lib/ddb";
import type { WsEvent, WsResult } from "../lib/ws";
import type { Connection } from "../lib/types";

export const handler = async (event: WsEvent): Promise<WsResult> => {
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 401, body: "Missing token" };
  const auth = verifyToken(token);
  if (!auth) return { statusCode: 401, body: "Invalid token" };

  const conn: Connection = {
    connectionId: event.requestContext.connectionId,
    userId: auth.sub,
    username: auth.username,
    connectedAt: Date.now(),
  };
  await putConnection(conn);
  return { statusCode: 200 };
};
