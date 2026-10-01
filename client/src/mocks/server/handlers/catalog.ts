import { toProductSummary } from "@/domain";
import { clampInt, notFound, ok, paged, paginate } from "../http";
import type { RouteDefinition } from "../router";
import { queryProducts, resolveProduct, withProductCount } from "./shared";

export const catalogRoutes: RouteDefinition[] = [
  ["GET", "/products", ({ req, db, locale }) => paged(paginate(queryProducts(db, req.query, locale, "public"), req.query))],
  [
    "GET",
    "/products/slug/:slug",
    ({ db, params }) => {
      const stored = db.products.find((p) => p.slug === params.slug && p.status === "published");
      if (!stored) throw notFound("Product");
      return ok(resolveProduct(db, stored));
    },
  ],
  [
    "GET",
    "/products/:id",
    ({ db, params }) => {
      const stored = db.products.find((p) => p.id === params.id && p.status === "published");
      if (!stored) throw notFound("Product");
      return ok(resolveProduct(db, stored));
    },
  ],
  [
    "GET",
    "/products/:id/options",
    ({ db, params }) => {
      const stored = db.products.find((p) => p.id === params.id && p.status === "published");
      if (!stored) throw notFound("Product");
      return ok(stored.options);
    },
  ],
  [
    "GET",
    "/products/:id/related",
    ({ req, db, params }) => {
      const source = db.products.find((p) => p.id === params.id && p.status === "published");
      if (!source) throw notFound("Product");
      const limit = clampInt(req.query.get("limit"), 4, 1, 12);
      const score = (p: typeof source) => (p.categoryId === source.categoryId ? 2 : 0) + (p.materialType === source.materialType ? 1 : 0);
      const related = db.products
        .filter((p) => p.id !== source.id && p.status === "published")
        .sort((a, b) => score(b) - score(a))
        .slice(0, limit)
        .map((p) => toProductSummary(resolveProduct(db, p)));
      return ok(related);
    },
  ],
  [
    "GET",
    "/categories",
    ({ db }) => ok([...db.categories].sort((a, b) => a.sortOrder - b.sortOrder).map(withProductCount(db, true))),
  ],
  [
    "GET",
    "/categories/slug/:slug",
    ({ db, params }) => {
      const category = db.categories.find((c) => c.slug === params.slug);
      if (!category) throw notFound("Category");
      return ok(withProductCount(db, true)(category));
    },
  ],
];
