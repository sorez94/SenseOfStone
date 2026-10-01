import type { IsoDateTime, LocalizedText } from "./common";

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  imageUrl: string | null;
  sortOrder: number;
  /** Published products for public endpoints, all products for admin endpoints. */
  productCount: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CategoryInput {
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  imageUrl: string | null;
  sortOrder: number;
}
