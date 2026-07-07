// POST /items  { title, body? } -> { item }   (example resource)
import { randomUUID } from "node:crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { putItem } from "../lib/ddb";
import { getAuth, ok, badRequest, unauthorized, parseBody, serverError } from "../lib/http";
import type { Item } from "../lib/types";

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
) => {
  try {
    const auth = getAuth(event);
    if (!auth) return unauthorized();

    const body = parseBody<{ title?: string; body?: string }>(event);
    const title = body.title?.trim() ?? "";
    if (!title) return badRequest("title is required");

    const item: Item = {
      ownerId: auth.sub,
      itemId: randomUUID(),
      title: title.slice(0, 200),
      body: (body.body ?? "").slice(0, 4000),
      createdAt: Date.now(),
    };
    await putItem(item);
    return ok({ item });
  } catch (err) {
    console.error("createItem error", err);
    return serverError();
  }
};
