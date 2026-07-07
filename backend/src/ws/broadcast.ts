// `broadcast` route (client sends {"action":"broadcast","text":"..."}). Fans
// the message out to every connected client. Replace the "all connections"
// scan with your own targeting (e.g. members of a room) for real apps.
import { getConnection, getAllConnections } from "../lib/ddb";
import { broadcast } from "../lib/push";
import { endpointFromEvent, parseWsBody, type WsEvent, type WsResult } from "../lib/ws";

export const handler = async (event: WsEvent): Promise<WsResult> => {
  const conn = await getConnection(event.requestContext.connectionId);
  if (!conn) return { statusCode: 401 };
  const { text } = parseWsBody<{ text?: string }>(event);
  const all = await getAllConnections();
  await broadcast(
    all.map((c) => c.connectionId),
    { type: "broadcast", text: text ?? "", from: conn.username },
    endpointFromEvent(event)
  );
  return { statusCode: 200 };
};
