// DELETE /items/{itemId} -> { ok: true }   (owner only, by construction)
import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { deleteItem } from "../lib/ddb";
import { getAuth, ok, badRequest, unauthorized, serverError } from "../lib/http";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  try {
    const auth = getAuth(event);
    if (!auth) return unauthorized();
    const itemId = event.pathParameters?.itemId;
    if (!itemId) return badRequest("itemId is required");
    // Key is (ownerId, itemId) so a user can only ever delete their own.
    await deleteItem(auth.sub, itemId);
    return ok({ ok: true });
  } catch (err) {
    console.error("deleteItem error", err);
    return serverError();
  }
};
