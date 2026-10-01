import type { CategoryInput } from "@/domain";
import { newId, now } from "../../db/store";
import type { MockDatabase } from "../../db/types";
import { HttpError, created, noContent, notFound, ok, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { categoryInputSchema } from "../schemas";
import { withProductCount } from "./shared";

function assertUniqueSlug(db: MockDatabase, slug: string, ignoreId?: string) {
  if (db.categories.some((c) => c.slug === slug && c.id !== ignoreId)) {
    throw new HttpError(409, "SLUG_TAKEN", "Slug is already used by another category", [
      { field: "slug", code: "taken", message: "Slug already in use" },
    ]);
  }
}

export const adminCategoryRoutes: RouteDefinition[] = [
  [
    "GET",
    "/admin/categories",
    ({ db, auth }) => {
      auth.requireAdmin();
      return ok([...db.categories].sort((a, b) => a.sortOrder - b.sortOrder).map(withProductCount(db, false)));
    },
  ],
  [
    "POST",
    "/admin/categories",
    ({ req, db, auth }) => {
      auth.requireAdmin();
      const input: CategoryInput = parseBody(categoryInputSchema, req.body);
      assertUniqueSlug(db, input.slug);
      const timestamp = now();
      const category = { ...input, id: newId("cat"), createdAt: timestamp, updatedAt: timestamp };
      db.categories.push(category);
      return created(withProductCount(db, false)(category));
    },
  ],
  [
    "PUT",
    "/admin/categories/:id",
    ({ req, db, auth, params }) => {
      auth.requireAdmin();
      const category = db.categories.find((c) => c.id === params.id);
      if (!category) throw notFound("Category");
      const input: CategoryInput = parseBody(categoryInputSchema, req.body);
      assertUniqueSlug(db, input.slug, category.id);
      Object.assign(category, input, { updatedAt: now() });
      return ok(withProductCount(db, false)(category));
    },
  ],
  [
    "DELETE",
    "/admin/categories/:id",
    ({ db, auth, params }) => {
      auth.requireAdmin();
      const index = db.categories.findIndex((c) => c.id === params.id);
      if (index === -1) throw notFound("Category");
      if (db.products.some((p) => p.categoryId === params.id)) {
        throw new HttpError(409, "CATEGORY_NOT_EMPTY", "Move or delete this category's products first");
      }
      db.categories.splice(index, 1);
      return noContent();
    },
  ],
];
