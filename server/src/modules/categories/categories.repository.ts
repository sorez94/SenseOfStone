import { Injectable } from '@nestjs/common';
import { Category, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryInputDto } from './dto/category-input.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findActiveBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { slug, deletedAt: null } });
  }

  findActiveById(id: string): Promise<Category | null> {
    return this.prisma.category.findFirst({ where: { id, deletedAt: null } });
  }

  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  }

  create(dto: CategoryInputDto): Promise<Category> {
    return this.prisma.category.create({
      data: {
        slug: dto.slug,
        name: dto.name as unknown as Prisma.InputJsonValue,
        description: (dto.description as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        imageUrl: dto.imageUrl ?? null,
        sortOrder: dto.sortOrder,
      },
    });
  }

  update(id: string, dto: CategoryInputDto): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name as unknown as Prisma.InputJsonValue,
        description: (dto.description as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        imageUrl: dto.imageUrl ?? null,
        sortOrder: dto.sortOrder,
      },
    });
  }

  softDelete(id: string): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countProducts(categoryId: string, onlyPublished: boolean): Promise<number> {
    return this.prisma.product.count({
      where: {
        categoryId,
        deletedAt: null,
        ...(onlyPublished ? { status: ProductStatus.PUBLISHED } : {}),
      },
    });
  }

  async countProductsByCategoryIds(categoryIds: string[], onlyPublished: boolean) {
    return this.prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        categoryId: { in: categoryIds },
        deletedAt: null,
        ...(onlyPublished ? { status: ProductStatus.PUBLISHED } : {}),
      },
      _count: { categoryId: true },
    });
  }
}
