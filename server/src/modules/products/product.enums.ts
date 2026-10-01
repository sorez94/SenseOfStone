import { Availability, PricingType, ProductStatus, MaterialType } from '@prisma/client';

export const MATERIAL_TYPE_TO_DB: Record<string, MaterialType> = {
  stone: MaterialType.STONE,
  wood: MaterialType.WOOD,
  mixed: MaterialType.MIXED,
};
export const MATERIAL_TYPE_FROM_DB: Record<MaterialType, string> = {
  [MaterialType.STONE]: 'stone',
  [MaterialType.WOOD]: 'wood',
  [MaterialType.MIXED]: 'mixed',
};

export const AVAILABILITY_TO_DB: Record<string, Availability> = {
  in_stock: Availability.IN_STOCK,
  made_to_order: Availability.MADE_TO_ORDER,
  out_of_stock: Availability.OUT_OF_STOCK,
  discontinued: Availability.DISCONTINUED,
};
export const AVAILABILITY_FROM_DB: Record<Availability, string> = {
  [Availability.IN_STOCK]: 'in_stock',
  [Availability.MADE_TO_ORDER]: 'made_to_order',
  [Availability.OUT_OF_STOCK]: 'out_of_stock',
  [Availability.DISCONTINUED]: 'discontinued',
};

export const PRODUCT_STATUS_TO_DB: Record<string, ProductStatus> = {
  draft: ProductStatus.DRAFT,
  published: ProductStatus.PUBLISHED,
  archived: ProductStatus.ARCHIVED,
};
export const PRODUCT_STATUS_FROM_DB: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: 'draft',
  [ProductStatus.PUBLISHED]: 'published',
  [ProductStatus.ARCHIVED]: 'archived',
};

export const PRICING_TYPE_TO_DB: Record<string, PricingType> = {
  fixed: PricingType.FIXED,
  range: PricingType.RANGE,
  on_request: PricingType.ON_REQUEST,
};
export const PRICING_TYPE_FROM_DB: Record<PricingType, string> = {
  [PricingType.FIXED]: 'fixed',
  [PricingType.RANGE]: 'range',
  [PricingType.ON_REQUEST]: 'on_request',
};

export const MATERIAL_TYPES = Object.keys(MATERIAL_TYPE_TO_DB);
export const AVAILABILITIES = Object.keys(AVAILABILITY_TO_DB);
export const PRODUCT_STATUSES = Object.keys(PRODUCT_STATUS_TO_DB);
