import { Category } from '@prisma/client';

export interface CategoryDto {
  id: string;
  slug: string;
  name: unknown;
  description: unknown;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toCategoryDto(category: Category, productCount: number): CategoryDto {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    productCount,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
