import { newId, now } from "../../db/store";
import { created, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { contactMessageSchema } from "../schemas";

export const contactRoutes: RouteDefinition[] = [
  [
    "POST",
    "/contact",
    ({ req, db }) => {
      const input = parseBody(contactMessageSchema, req.body);
      const message = { id: newId("msg"), ...input, createdAt: now() };
      db.contactMessages.push(message);
      return created({ id: message.id, createdAt: message.createdAt });
    },
  ],
];
