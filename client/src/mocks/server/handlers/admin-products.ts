import { z } from "zod";
import type { ProductInput } from "@/domain";
import { newId, now } from "../../db/store";
import type { MockDatabase, StoredProduct } from "../../db/types";
import { HttpError, created, noContent, ok, paged, paginate, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { optionsSchema, productInputSchema, productStatusSchema } from "../schemas";
import { findStoredProduct, queryProducts, resolveProduct } from "./shared";

function assertUnique(db: MockDatabase, input: Pick<ProductInput, "slug" | "sku">, ignoreId?: string) {
  if (db.products.some((p) => p.slug === input.slug && p.id !== ignoreId)) {
    throw new HttpError(409, "SLUG_TAKEN", "Slug is already used by another product", [
      { field: "slug", code: "taken", message: "Slug already in use" },
    ]);
  }
  if (db.products.some((p) => p.sku === input.sku && p.id !== ignoreId)) {
    throw new HttpError(409, "CONFLICT", "SKU is already used by another product", [
      { field: "sku", code: "taken", message: "SKU already in use" },
    ]);
  }
}

function assertCategory(db: MockDatabase, categoryId: string) {
  if (!db.categories.some((c) => c.id === categoryId)) {
    throw new HttpError(422, "VALIDATION_ERROR", "Category does not exist", [
      { field: "categoryId", code: "not_found", message: "Unknown category" },
    ]);
  }
}

function withIds(options: ProductInput["options"]): StoredProduct["options"] {
  return options.map((option) => ({
    ...option,
    id: option.id ?? newId("opt"),
    values: option.values.map((value) => ({ ...value, id: value.id ?? newId("val") })),
  }));
}

function toStored(input: ProductInput, base: Pick<StoredProduct, "id" | "createdAt">): StoredProduct {
  return {
    ...input,
    id: base.id,
    currency: "IRT",
    images: input.images.map((image, index) => ({ ...image, id: image.id ?? newId("img"), sortOrder: image.sortOrder ?? index })),
    options: withIds(input.options),
    createdAt: base.createdAt,
    updatedAt: now(),
  };
}

export const adminProductRoutes: RouteDefinition[] = [
  [
    "GET",
    "/admin/products",
    ({ req, db, auth, locale }) => {
      auth.requireAdmin();
      return paged(paginate(queryProducts(db, req.query, locale, "admin"), req.query, 20));
    },
  ],
  [
    "POST",
    "/admin/products",
    ({ req, db, auth }) => {
      auth.requireAdmin();
      const input = parseBody(productInputSchema, req.body) as ProductInput;
      assertUnique(db, input);
      assertCategory(db, input.categoryId);
      const stored = toStored(input, { id: newId("prd"), createdAt: now() });
      db.products.push(stored);
      return created(resolveProduct(db, stored));
    },
  ],
  [
    "GET",
    "/admin/products/:id",
    ({ db, auth, params }) => {
      auth.requireAdmin();
      return ok(resolveProduct(db, findStoredProduct(db, params.id!)));
    },
  ],
  [
    "PUT",
    "/admin/products/:id",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const existing = findStoredProduct(db, params.id!);
      const input = parseBody(productInputSchema, req.body) as ProductInput;
      assertUnique(db, input, existing.id);
      assertCategory(db, input.categoryId);
      const updated = toStored(input, existing);
      db.products[db.products.indexOf(existing)] = updated;
      return ok(resolveProduct(db, updated));
    },
  ],
  [
    "PATCH",
    "/admin/products/:id/status",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const product = findStoredProduct(db, params.id!);
      product.status = parseBody(productStatusSchema, req.body).status;
      product.updatedAt = now();
      return ok(resolveProduct(db, product));
    },
  ],
  [
    "PUT",
    "/admin/products/:id/options",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const product = findStoredProduct(db, params.id!);
      const { options } = parseBody(z.object({ options: optionsSchema }), req.body);
      product.options = withIds(options);
      product.updatedAt = now();
      return ok(product.options);
    },
  ],
  [
    "DELETE",
    "/admin/products/:id",
    ({ db, auth, params }) => {
      auth.requireAdmin();
      const product = findStoredProduct(db, params.id!);
      db.products.splice(db.products.indexOf(product), 1);
      return noContent();
    },
  ],
];
