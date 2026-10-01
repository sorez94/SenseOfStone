import {
  availabilityStatuses,
  materialTypes,
  productSorts,
  type AvailabilityStatus,
  type MaterialType,
  type ProductListQuery,
  type ProductSort,
} from "@/domain";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PRODUCTS_PAGE_SIZE = 12;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
const oneOf = <T extends string>(values: readonly T[], raw: string | undefined): T | undefined =>
  raw && (values as readonly string[]).includes(raw) ? (raw as T) : undefined;
const positiveInt = (raw: string | undefined): number | undefined => {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Parses storefront listing URL params into a validated API query. Invalid values are dropped. */
export function parseProductSearchParams(params: RawSearchParams): ProductListQuery & { page: number; pageSize: number } {
  return {
    q: first(params.q),
    category: first(params.category),
    materialType: oneOf<MaterialType>(materialTypes, first(params.materialType)),
    availability: oneOf<AvailabilityStatus>(availabilityStatuses, first(params.availability)),
    preOrderOnly: first(params.preOrderOnly) === "true" || undefined,
    featured: first(params.featured) === "true" || undefined,
    minPrice: positiveInt(first(params.minPrice)),
    maxPrice: positiveInt(first(params.maxPrice)),
    sort: oneOf<ProductSort>(productSorts, first(params.sort)),
    page: Math.max(1, positiveInt(first(params.page)) ?? 1),
    pageSize: PRODUCTS_PAGE_SIZE,
  };
}

/** Builds a locale-less listing URL, omitting defaults. */
export function productListHref(query: ProductListQuery, page = 1): string {
  const params = new URLSearchParams();
  const entries: Array<[string, string | number | boolean | undefined]> = [
    ["q", query.q],
    ["category", query.category],
    ["materialType", query.materialType],
    ["availability", query.availability],
    ["preOrderOnly", query.preOrderOnly],
    ["featured", query.featured],
    ["minPrice", query.minPrice],
    ["maxPrice", query.maxPrice],
    ["sort", query.sort],
    ["page", page > 1 ? page : undefined],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== "" && value !== false) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export function hasActiveFilters(query: ProductListQuery): boolean {
  return Boolean(
    query.q || query.category || query.materialType || query.availability || query.preOrderOnly || query.featured ||
      query.minPrice !== undefined || query.maxPrice !== undefined,
  );
}
