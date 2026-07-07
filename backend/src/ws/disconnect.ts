// $disconnect route. Removes the connection record.
import { deleteConnection } from "../lib/ddb";
import type { WsEvent, WsResult } from "../lib/ws";

export const handler = async (event: WsEvent): Promise<WsResult> => {
  await deleteConnection(event.requestContext.connectionId);
  return { statusCode: 200 };
};
