import { canTransition } from "@/domain";
import { now } from "../../db/store";
import { HttpError, notFound, ok, paged, paginate, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { preOrderNoteSchema, preOrderStatusSchema } from "../schemas";
import { filterByStatus } from "./pre-orders";

export const adminPreOrderRoutes: RouteDefinition[] = [
  [
    "GET",
    "/admin/pre-orders",
    ({ req, db, auth }) => {
      auth.requireAdmin();
      const q = req.query.get("q")?.trim().toLowerCase();
      const productId = req.query.get("productId");
      const items = filterByStatus([...db.preOrders], req.query.get("status"))
        .filter((p) => !productId || p.items.some((i) => i.productId === productId))
        .filter(
          (p) =>
            !q ||
            [p.reference, p.customer.email, p.customer.firstName, p.customer.lastName, p.customer.phone].some((v) =>
              v.toLowerCase().includes(q),
            ),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paged(paginate(items, req.query, 20));
    },
  ],
  [
    "GET",
    "/admin/pre-orders/:id",
    ({ db, auth, params }) => {
      auth.requireAdmin();
      const preOrder = db.preOrders.find((p) => p.id === params.id);
      if (!preOrder) throw notFound("Pre-order");
      return ok(preOrder);
    },
  ],
  [
    "PATCH",
    "/admin/pre-orders/:id/status",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const preOrder = db.preOrders.find((p) => p.id === params.id);
      if (!preOrder) throw notFound("Pre-order");
      const { status, note } = parseBody(preOrderStatusSchema, req.body);
      if (!canTransition(preOrder.status, status)) {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", `Cannot change status from "${preOrder.status}" to "${status}"`);
      }
      const timestamp = now();
      preOrder.status = status;
      preOrder.history.push({ status, changedAt: timestamp, changedBy: "admin", note: note || null });
      preOrder.updatedAt = timestamp;
      return ok(preOrder);
    },
  ],
  [
    "PATCH",
    "/admin/pre-orders/:id",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const preOrder = db.preOrders.find((p) => p.id === params.id);
      if (!preOrder) throw notFound("Pre-order");
      const { adminNote } = parseBody(preOrderNoteSchema, req.body);
      preOrder.adminNote = adminNote || null;
      preOrder.updatedAt = now();
      return ok(preOrder);
    },
  ],
];
