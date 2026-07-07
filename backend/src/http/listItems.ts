// GET /items -> { items }   The signed-in user's own items (example resource).
import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { listItems } from "../lib/ddb";
import { getAuth, ok, unauthorized, serverError } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  try {
    const auth = getAuth(event);
    if (!auth) return unauthorized();
    const items = await listItems(auth.sub);
    items.sort((a, b) => b.createdAt - a.createdAt);
    return ok({ items });
  } catch (err) {
    console.error("listItems error", err);
    return serverError();
  }
};
