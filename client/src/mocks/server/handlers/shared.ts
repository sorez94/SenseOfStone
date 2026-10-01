import {
  availabilityStatuses,
  materialTypes,
  productSorts,
  productStatuses,
  referencePrice,
  toProductSummary,
  type AvailabilityStatus,
  type Category,
  type MaterialType,
  type Product,
  type ProductSort,
  type ProductStatus,
  type ProductSummary,
  type User,
} from "@/domain";
import type { MockDatabase, StoredProduct, StoredUser } from "../../db/types";
import { notFound, optionalNumber } from "../http";

export function toPublicUser(user: StoredUser): User {
  const { password: _password, ...rest } = user;
  return rest;
}

export function resolveProduct(db: MockDatabase, stored: StoredProduct): Product {
  const { categoryId, ...rest } = stored;
  const category = db.categories.find((c) => c.id === categoryId);
  return {
    ...rest,
    category: category
      ? { id: category.id, slug: category.slug, name: category.name }
      : { id: categoryId, slug: "unknown", name: { en: "Uncategorized", fa: "بدون دسته" } },
  };
}

export function findStoredProduct(db: MockDatabase, id: string): StoredProduct {
  const product = db.products.find((p) => p.id === id);
  if (!product) throw notFound("Product");
  return product;
}

export function withProductCount(db: MockDatabase, onlyPublished: boolean) {
  return (category: MockDatabase["categories"][number]): Category => ({
    ...category,
    productCount: db.products.filter((p) => p.categoryId === category.id && (!onlyPublished || p.status === "published")).length,
  });
}

const pick = <T extends string>(values: readonly T[], raw: string | null): T | undefined =>
  raw && (values as readonly string[]).includes(raw) ? (raw as T) : undefined;

/** Applies documented list filters (docs/API.md §4.1) to products. */
export function queryProducts(
  db: MockDatabase,
  query: URLSearchParams,
  locale: "en" | "fa",
  scope: "public" | "admin",
): ProductSummary[] {
  const q = query.get("q")?.trim().toLowerCase();
  const categorySlug = query.get("category");
  const materialType = pick<MaterialType>(materialTypes, query.get("materialType"));
  const availability = pick<AvailabilityStatus>(availabilityStatuses, query.get("availability"));
  const status = scope === "admin" ? pick<ProductStatus>(productStatuses, query.get("status")) : "published";
  const preOrderOnly = query.get("preOrderOnly") === "true";
  const featured = query.get("featured") === "true";
  const minPrice = optionalNumber(query.get("minPrice"));
  const maxPrice = optionalNumber(query.get("maxPrice"));
  const sort = pick<ProductSort>(productSorts, query.get("sort")) ?? "newest";
  const category = categorySlug ? db.categories.find((c) => c.slug === categorySlug) : undefined;

  let items = db.products
    .map((stored) => resolveProduct(db, stored))
    .filter((p) => !status || p.status === status)
    .filter((p) => !categorySlug || p.category.id === category?.id)
    .filter((p) => !materialType || p.materialType === materialType)
    .filter((p) => !availability || p.availability === availability)
    .filter((p) => !featured || p.isFeatured)
    .map(toProductSummary)
    .filter((p) => !preOrderOnly || p.preOrderEnabled)
    .filter((p) => {
      if (minPrice === undefined && maxPrice === undefined) return true;
      const price = referencePrice(p.pricing);
      if (price === null) return false;
      return (minPrice === undefined || price >= minPrice) && (maxPrice === undefined || price <= maxPrice);
    });

  if (q) {
    items = items.filter((p) =>
      [p.title.en, p.title.fa, p.shortDescription.en, p.shortDescription.fa, p.material.en, p.material.fa, p.sku, p.category.name.en, p.category.name.fa]
        .filter(Boolean)
        .some((text) => text!.toLowerCase().includes(q)),
    );
  }

  const byNewest = (a: ProductSummary, b: ProductSummary) => b.createdAt.localeCompare(a.createdAt);
  const priceOf = (p: ProductSummary) => referencePrice(p.pricing);
  const comparePrice = (dir: 1 | -1) => (a: ProductSummary, b: ProductSummary) => {
    const pa = priceOf(a);
    const pb = priceOf(b);
    if (pa === null) return pb === null ? 0 : 1; // "on request" always last
    if (pb === null) return -1;
    return (pa - pb) * dir;
  };
  const comparators: Record<ProductSort, (a: ProductSummary, b: ProductSummary) => number> = {
    newest: byNewest,
    featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byNewest(a, b),
    price_asc: comparePrice(1),
    price_desc: comparePrice(-1),
    title_asc: (a, b) => (a.title[locale] ?? a.title.en).localeCompare(b.title[locale] ?? b.title.en, locale),
  };
  return items.sort(comparators[sort]);
}
