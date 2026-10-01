import {
  canBePreOrdered,
  canCustomerCancel,
  estimateTotal,
  isProfileComplete,
  preOrderStatuses,
  resolveSelectedOptions,
  sortImages,
  unitPriceWithOptions,
  type PreOrder,
  type PreOrderItem,
  type PreOrderStatus,
} from "@/domain";
import type { ApiFieldError } from "@/lib/api/types";
import { newId, now } from "../../db/store";
import type { MockDatabase } from "../../db/types";
import { HttpError, created, notFound, ok, paged, paginate, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { cancelPreOrderSchema, createPreOrderSchema } from "../schemas";

export function filterByStatus(items: PreOrder[], raw: string | null): PreOrder[] {
  const status = raw && (preOrderStatuses as readonly string[]).includes(raw) ? (raw as PreOrderStatus) : undefined;
  return status ? items.filter((p) => p.status === status) : items;
}

const newestFirst = (a: PreOrder, b: PreOrder) => b.createdAt.localeCompare(a.createdAt);

function nextReference(db: MockDatabase): string {
  db.sequences.preOrder += 1;
  return `PO-${new Date().getUTCFullYear()}-${String(db.sequences.preOrder).padStart(5, "0")}`;
}

export const preOrderRoutes: RouteDefinition[] = [
  [
    "POST",
    "/pre-orders",
    ({ req, db, auth }) => {
      const user = auth.require();
      if (!isProfileComplete(user.profile)) {
        throw new HttpError(403, "PROFILE_INCOMPLETE", "Complete your profile before submitting a pre-order");
      }
      const input = parseBody(createPreOrderSchema, req.body);

      const errors: ApiFieldError[] = [];
      const items: PreOrderItem[] = input.items.map((line, index) => {
        const product = db.products.find((p) => p.id === line.productId);
        if (!product || !canBePreOrdered(product)) {
          throw new HttpError(422, "PRODUCT_NOT_PREORDERABLE", "This product is not available for pre-order", [
            { field: `items.${index}.productId`, code: "not_preorderable", message: "Product cannot be pre-ordered" },
          ]);
        }
        const { minQuantity, maxQuantity } = product.preOrder;
        if (line.quantity < minQuantity || line.quantity > maxQuantity) {
          errors.push({
            field: `items.${index}.quantity`,
            code: "out_of_range",
            message: `Quantity must be between ${minQuantity} and ${maxQuantity}`,
          });
        }
        const resolved = resolveSelectedOptions(product, line.options);
        if (!resolved.ok) {
          for (const optionId of resolved.missingOptionIds) {
            errors.push({ field: `items.${index}.options.${optionId}`, code: "required", message: "Option is required" });
          }
          for (const optionId of resolved.invalidOptionIds) {
            errors.push({ field: `items.${index}.options.${optionId}`, code: "invalid", message: "Invalid option value" });
          }
        }
        const selectedOptions = resolved.ok ? resolved.options : [];
        return {
          id: newId("poi"),
          productId: product.id,
          productSlug: product.slug,
          productTitle: product.title,
          productImageUrl: sortImages(product.images)[0]?.url ?? null,
          quantity: line.quantity,
          selectedOptions,
          unitPrice: unitPriceWithOptions(product.pricing, selectedOptions),
        };
      });
      if (errors.length) throw new HttpError(422, "VALIDATION_ERROR", "Request validation failed", errors);

      const profile = user.profile!;
      const timestamp = now();
      const preOrder: PreOrder = {
        id: newId("po"),
        reference: nextReference(db),
        status: "pending",
        customer: {
          userId: user.id,
          email: user.email,
          firstName: profile.firstName!,
          lastName: profile.lastName!,
          phone: profile.phone!,
          address: profile.address!,
        },
        items,
        estimatedTotal: estimateTotal(items),
        currency: "IRT",
        customerNote: input.customerNote || null,
        adminNote: null,
        history: [{ status: "pending", changedAt: timestamp, changedBy: "customer", note: null }],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.preOrders.push(preOrder);
      return created(preOrder);
    },
  ],
  [
    "GET",
    "/pre-orders",
    ({ req, db, auth }) => {
      const user = auth.require();
      const mine = db.preOrders.filter((p) => p.customer.userId === user.id).sort(newestFirst);
      return paged(paginate(filterByStatus(mine, req.query.get("status")), req.query, 10));
    },
  ],
  [
    "GET",
    "/pre-orders/:id",
    ({ db, auth, params }) => {
      const user = auth.require();
      const preOrder = db.preOrders.find((p) => p.id === params.id && p.customer.userId === user.id);
      if (!preOrder) throw notFound("Pre-order");
      return ok(preOrder);
    },
  ],
  [
    "POST",
    "/pre-orders/:id/cancel",
    ({ req, db, auth, params }) => {
      const user = auth.require();
      const { reason } = parseBody(cancelPreOrderSchema, req.body) ?? {};
      const preOrder = db.preOrders.find((p) => p.id === params.id && p.customer.userId === user.id);
      if (!preOrder) throw notFound("Pre-order");
      if (!canCustomerCancel(preOrder)) {
        throw new HttpError(409, "INVALID_STATUS_TRANSITION", `Cannot cancel a pre-order with status "${preOrder.status}"`);
      }
      const timestamp = now();
      preOrder.status = "cancelled";
      preOrder.history.push({ status: "cancelled", changedAt: timestamp, changedBy: "customer", note: reason || null });
      preOrder.updatedAt = timestamp;
      return ok(preOrder);
    },
  ],
];
