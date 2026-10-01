import { Category, Product, ProductImage, ProductOption, ProductOptionValue } from '@prisma/client';
import { AVAILABILITY_FROM_DB, MATERIAL_TYPE_FROM_DB, PRODUCT_STATUS_FROM_DB } from './product.enums';

export type ProductOptionWithValues = ProductOption & { values: ProductOptionValue[] };
export type ProductWithRelations = Product & {
  category: Category;
  images: ProductImage[];
  options: ProductOptionWithValues[];
};

export type Pricing =
  | { type: 'fixed'; amount: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'on_request' };

export function toPricingDto(product: Product): Pricing {
  if (product.pricingType === 'FIXED') return { type: 'fixed', amount: product.priceAmount ?? 0 };
  if (product.pricingType === 'RANGE') {
    return { type: 'range', min: product.priceMin ?? 0, max: product.priceMax ?? 0 };
  }
  return { type: 'on_request' };
}

/** docs/API.md §2.3 "Derived rule". */
export function canBePreOrdered(product: Product): boolean {
  return (
    product.status === 'PUBLISHED' && product.preOrderEnabled && product.availability !== 'DISCONTINUED'
  );
}

function toImageDto(image: ProductImage) {
  return { id: image.id, url: image.url, alt: image.alt, sortOrder: image.sortOrder };
}

export function toProductOptionDto(option: ProductOptionWithValues) {
  return {
    id: option.id,
    name: option.name,
    required: option.required,
    values: option.values
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((value) => ({ id: value.id, label: value.label, priceDelta: value.priceDelta })),
  };
}

export function toCategoryRefDto(category: Category) {
  return { id: category.id, slug: category.slug, name: category.name };
}

export function toProductDto(product: ProductWithRelations) {
  const sortedImages = product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedOptions = product.options.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    title: product.title,
    shortDescription: product.shortDescription,
    description: product.description,
    category: toCategoryRefDto(product.category),
    materialType: MATERIAL_TYPE_FROM_DB[product.materialType],
    material: product.material,
    finish: product.finish,
    origin: product.origin,
    dimensions: {
      length: product.dimLength,
      width: product.dimWidth,
      height: product.dimHeight,
      weight: product.dimWeight,
    },
    images: sortedImages.map(toImageDto),
    pricing: toPricingDto(product),
    currency: product.currency,
    options: sortedOptions.map(toProductOptionDto),
    specifications: product.specifications,
    availability: AVAILABILITY_FROM_DB[product.availability],
    preOrder: {
      enabled: product.preOrderEnabled,
      minQuantity: product.preOrderMinQuantity,
      maxQuantity: product.preOrderMaxQuantity,
      leadTimeDays: product.preOrderLeadTimeDays,
    },
    isFeatured: product.isFeatured,
    status: PRODUCT_STATUS_FROM_DB[product.status],
    tags: product.tags,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductSummaryDto(product: ProductWithRelations) {
  const sortedImages = product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const coverImage = sortedImages[0] ? toImageDto(sortedImages[0]) : null;

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    title: product.title,
    shortDescription: product.shortDescription,
    category: toCategoryRefDto(product.category),
    materialType: MATERIAL_TYPE_FROM_DB[product.materialType],
    material: product.material,
    pricing: toPricingDto(product),
    currency: product.currency,
    availability: AVAILABILITY_FROM_DB[product.availability],
    isFeatured: product.isFeatured,
    status: PRODUCT_STATUS_FROM_DB[product.status],
    coverImage,
    preOrderEnabled: canBePreOrdered(product),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
