import type { CurrencyCode, IsoDateTime, LocalizedText, PageQuery } from "./common";

export const materialTypes = ["stone", "wood", "mixed"] as const;
export type MaterialType = (typeof materialTypes)[number];

export const availabilityStatuses = ["in_stock", "made_to_order", "out_of_stock", "discontinued"] as const;
export type AvailabilityStatus = (typeof availabilityStatuses)[number];

/** Publication status controlled by admins. Only "published" products are visible in the storefront. */
export const productStatuses = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const pricingTypes = ["fixed", "range", "on_request"] as const;
export type Pricing =
  | { type: "fixed"; amount: number }
  | { type: "range"; min: number; max: number }
  | { type: "on_request" };

export interface Dimensions {
  /** Centimetres. */
  length: number | null;
  width: number | null;
  height: number | null;
  /** Kilograms. */
  weight: number | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: LocalizedText;
  sortOrder: number;
}

export interface ProductOptionValue {
  id: string;
  label: LocalizedText;
  /** Added to the unit price when selected (Toman). May be negative. */
  priceDelta: number;
}

/** A configurable option such as "Size" or "Finish". Customers pick one value per option. */
export interface ProductOption {
  id: string;
  name: LocalizedText;
  required: boolean;
  values: ProductOptionValue[];
}

export interface ProductSpecification {
  label: LocalizedText;
  value: LocalizedText;
}

export interface PreOrderSettings {
  enabled: boolean;
  minQuantity: number;
  maxQuantity: number;
  /** Estimated production + delivery time. */
  leadTimeDays: number | null;
}

export interface ProductCategoryRef {
  id: string;
  slug: string;
  name: LocalizedText;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  category: ProductCategoryRef;
  materialType: MaterialType;
  material: LocalizedText;
  finish: LocalizedText | null;
  origin: LocalizedText | null;
  dimensions: Dimensions;
  images: ProductImage[];
  pricing: Pricing;
  currency: CurrencyCode;
  options: ProductOption[];
  specifications: ProductSpecification[];
  availability: AvailabilityStatus;
  preOrder: PreOrderSettings;
  isFeatured: boolean;
  status: ProductStatus;
  tags: string[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Lightweight shape returned by list endpoints. */
export interface ProductSummary {
  id: string;
  slug: string;
  sku: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  category: ProductCategoryRef;
  materialType: MaterialType;
  material: LocalizedText;
  pricing: Pricing;
  currency: CurrencyCode;
  availability: AvailabilityStatus;
  isFeatured: boolean;
  status: ProductStatus;
  coverImage: ProductImage | null;
  preOrderEnabled: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export const productSorts = ["newest", "featured", "price_asc", "price_desc", "title_asc"] as const;
export type ProductSort = (typeof productSorts)[number];

export interface ProductListQuery extends PageQuery {
  q?: string;
  category?: string;
  materialType?: MaterialType;
  availability?: AvailabilityStatus;
  preOrderOnly?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
}

export interface AdminProductListQuery extends ProductListQuery {
  status?: ProductStatus;
}

type WithOptionalId<T extends { id: string }> = Omit<T, "id"> & { id?: string };

/** Create/update payload. Items without `id` are created; existing ids are preserved. */
export interface ProductInput {
  slug: string;
  sku: string;
  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  categoryId: string;
  materialType: MaterialType;
  material: LocalizedText;
  finish: LocalizedText | null;
  origin: LocalizedText | null;
  dimensions: Dimensions;
  images: WithOptionalId<ProductImage>[];
  pricing: Pricing;
  options: Array<WithOptionalId<Omit<ProductOption, "values">> & { values: WithOptionalId<ProductOptionValue>[] }>;
  specifications: ProductSpecification[];
  availability: AvailabilityStatus;
  preOrder: PreOrderSettings;
  isFeatured: boolean;
  status: ProductStatus;
  tags: string[];
}

export function sortImages<T extends Pick<ProductImage, "sortOrder">>(images: T[]): T[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function canBePreOrdered(product: Pick<Product, "status" | "availability" | "preOrder">): boolean {
  return product.status === "published" && product.preOrder.enabled && product.availability !== "discontinued";
}

export function toProductSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    title: product.title,
    shortDescription: product.shortDescription,
    category: product.category,
    materialType: product.materialType,
    material: product.material,
    pricing: product.pricing,
    currency: product.currency,
    availability: product.availability,
    isFeatured: product.isFeatured,
    status: product.status,
    coverImage: sortImages(product.images)[0] ?? null,
    preOrderEnabled: canBePreOrdered(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/** Lowest price, used for sorting and price filters. Null for "price on request". */
export function referencePrice(pricing: Pricing): number | null {
  switch (pricing.type) {
    case "fixed":
      return pricing.amount;
    case "range":
      return pricing.min;
    case "on_request":
      return null;
  }
}
