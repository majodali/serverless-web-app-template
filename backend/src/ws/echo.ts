// `echo` route (client sends {"action":"echo","text":"..."}). Sends the text
// straight back to the sender — the simplest demonstration of server->client
// push, safe because the socket is established by the time a message arrives.
import { getConnection } from "../lib/ddb";
import { sendToConnection } from "../lib/push";
import { endpointFromEvent, parseWsBody, type WsEvent, type WsResult } from "../lib/ws";

export const handler = async (event: WsEvent): Promise<WsResult> => {
  const conn = await getConnection(event.requestContext.connectionId);
  if (!conn) return { statusCode: 401 };
  const { text } = parseWsBody<{ text?: string }>(event);
  await sendToConnection(
    conn.connectionId,
    { type: "echo", text: text ?? "", from: conn.username },
    endpointFromEvent(event)
  );
  return { statusCode: 200 };
};
