// Push server events to connected WebSocket clients via the API Gateway
// Management API (WebSocket module).
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { env } from "./env";
import { deleteConnection } from "./ddb";
import type { ServerEvent } from "./types";

/**
 * Send an event to a single connection. A stale connection (410 Gone) is
 * cleaned up. NOTE: never call this from within a $connect handler — the
 * socket isn't established yet, so it returns 410 and this would delete the
 * connection you just stored. Reply to the first client message instead.
 */
export async function sendToConnection(
  connectionId: string,
  event: ServerEvent,
  endpoint: string
): Promise<void> {
  const client = new ApiGatewayManagementApiClient({ region: env.region, endpoint });
  try {
    await client.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(event)),
      })
    );
  } catch (err: unknown) {
    const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode;
    if (status === 410) await deleteConnection(connectionId).catch(() => {});
    else console.error("sendToConnection failed", connectionId, err);
  }
}

export async function broadcast(
  connectionIds: string[],
  event: ServerEvent,
  endpoint: string
): Promise<void> {
  await Promise.all(connectionIds.map((id) => sendToConnection(id, event, endpoint)));
}
