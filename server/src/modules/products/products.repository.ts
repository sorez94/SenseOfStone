import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductInputDto, ProductOptionInputDto, ProductImageInputDto } from './dto/product-input.dto';
import { ProductWithRelations } from './product.mapper';
import {
  MATERIAL_TYPE_TO_DB,
  AVAILABILITY_TO_DB,
  PRICING_TYPE_TO_DB,
  PRODUCT_STATUS_TO_DB,
} from './product.enums';

export const PRODUCT_RELATIONS_INCLUDE = {
  category: true,
  images: true,
  options: { include: { values: true } },
} satisfies Prisma.ProductInclude;

export interface ProductSearchFilters {
  statuses: string[];
  categoryId?: string;
  materialType?: string;
  availability?: string;
  featured?: boolean;
  preOrderOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort: string;
  locale: 'en' | 'fa';
  skip: number;
  take: number;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** DTO instances are structurally plain data but lack the index signature Prisma's JSON input types require. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
function toJsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

function buildWhere(filters: ProductSearchFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`p."deletedAt" IS NULL`];

  conditions.push(Prisma.sql`p."status"::text IN (${Prisma.join(filters.statuses)})`);

  if (filters.categoryId) {
    conditions.push(Prisma.sql`p."categoryId" = ${filters.categoryId}`);
  }
  if (filters.materialType) {
    conditions.push(Prisma.sql`p."materialType"::text = ${filters.materialType}`);
  }
  if (filters.availability) {
    conditions.push(Prisma.sql`p."availability"::text = ${filters.availability}`);
  }
  if (filters.featured) {
    conditions.push(Prisma.sql`p."isFeatured" = true`);
  }
  if (filters.preOrderOnly) {
    conditions.push(
      Prisma.sql`p."status"::text = 'PUBLISHED' AND p."preOrderEnabled" = true AND p."availability"::text <> 'DISCONTINUED'`,
    );
  }
  if (filters.minPrice !== undefined) {
    conditions.push(
      Prisma.sql`p."referencePrice" IS NOT NULL AND p."referencePrice" >= ${filters.minPrice}`,
    );
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(
      Prisma.sql`p."referencePrice" IS NOT NULL AND p."referencePrice" <= ${filters.maxPrice}`,
    );
  }
  if (filters.q) {
    const pattern = `%${escapeLikePattern(filters.q)}%`;
    conditions.push(Prisma.sql`(
      p."title"->>'en' ILIKE ${pattern} ESCAPE '\\' OR
      p."title"->>'fa' ILIKE ${pattern} ESCAPE '\\' OR
      p."shortDescription"->>'en' ILIKE ${pattern} ESCAPE '\\' OR
      p."shortDescription"->>'fa' ILIKE ${pattern} ESCAPE '\\' OR
      p."material"->>'en' ILIKE ${pattern} ESCAPE '\\' OR
      p."material"->>'fa' ILIKE ${pattern} ESCAPE '\\' OR
      p."sku" ILIKE ${pattern} ESCAPE '\\' OR
      c."name"->>'en' ILIKE ${pattern} ESCAPE '\\' OR
      c."name"->>'fa' ILIKE ${pattern} ESCAPE '\\' OR
      EXISTS (SELECT 1 FROM unnest(p."tags") AS tg WHERE tg ILIKE ${pattern} ESCAPE '\\')
    )`);
  }

  return Prisma.join(conditions, ' AND ');
}

function buildOrderBy(sort: string, locale: 'en' | 'fa'): Prisma.Sql {
  switch (sort) {
    case 'featured':
      return Prisma.sql`p."isFeatured" DESC, p."createdAt" DESC`;
    case 'price_asc':
      return Prisma.sql`(p."referencePrice" IS NULL) ASC, p."referencePrice" ASC, p."createdAt" DESC`;
    case 'price_desc':
      return Prisma.sql`(p."referencePrice" IS NULL) ASC, p."referencePrice" DESC, p."createdAt" DESC`;
    case 'title_asc':
      return Prisma.sql`LOWER(COALESCE(p."title"->>${locale}, p."title"->>'en')) ASC`;
    default:
      return Prisma.sql`p."createdAt" DESC`;
  }
}

function reorderByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => Boolean(item));
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(filters: ProductSearchFilters): Promise<{ products: ProductWithRelations[]; total: number }> {
    const where = buildWhere(filters);
    const orderBy = buildOrderBy(filters.sort, filters.locale);

    const totalRows = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*) as count FROM "Product" p JOIN "Category" c ON c."id" = p."categoryId" WHERE ${where}`,
    );
    const total = Number(totalRows[0]?.count ?? 0);

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT p."id" FROM "Product" p JOIN "Category" c ON c."id" = p."categoryId" WHERE ${where} ORDER BY ${orderBy} LIMIT ${filters.take} OFFSET ${filters.skip}`,
    );
    const ids = idRows.map((row) => row.id);
    if (ids.length === 0) return { products: [], total };

    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: PRODUCT_RELATIONS_INCLUDE,
    });

    return { products: reorderByIds(products as ProductWithRelations[], ids), total };
  }

  findPublicBySlug(slug: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findFirst({
      where: { slug, deletedAt: null, status: 'PUBLISHED' },
      include: PRODUCT_RELATIONS_INCLUDE,
    }) as Promise<ProductWithRelations | null>;
  }

  findPublicById(id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null, status: 'PUBLISHED' },
      include: PRODUCT_RELATIONS_INCLUDE,
    }) as Promise<ProductWithRelations | null>;
  }

  findAdminById(id: string): Promise<ProductWithRelations | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: PRODUCT_RELATIONS_INCLUDE,
    }) as Promise<ProductWithRelations | null>;
  }

  findRelatedCandidates(
    excludeId: string,
    categoryId: string,
    materialType: Product['materialType'],
  ): Promise<ProductWithRelations[]> {
    return this.prisma.product.findMany({
      where: {
        id: { not: excludeId },
        deletedAt: null,
        status: 'PUBLISHED',
        OR: [{ categoryId }, { materialType }],
      },
      orderBy: { createdAt: 'asc' },
      include: PRODUCT_RELATIONS_INCLUDE,
    }) as Promise<ProductWithRelations[]>;
  }

  async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  }

  async isSkuTaken(sku: string, excludeId?: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { sku, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return Boolean(existing);
  }

  async categoryExists(categoryId: string): Promise<boolean> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    return Boolean(category);
  }

  async create(dto: ProductInputDto): Promise<ProductWithRelations> {
    const created = await this.prisma.product.create({
      data: {
        ...this.scalarData(dto),
        images: { create: dto.images.map((image, index) => this.imageCreateData(image, index)) },
        options: dto.options
          ? { create: dto.options.map((option, index) => this.optionCreateData(option, index)) }
          : undefined,
      } as Prisma.ProductUncheckedCreateInput,
      include: PRODUCT_RELATIONS_INCLUDE,
    });
    return created as ProductWithRelations;
  }

  async update(id: string, dto: ProductInputDto): Promise<ProductWithRelations> {
    await this.syncImages(id, dto.images);
    await this.syncOptions(id, dto.options ?? []);

    const updated = await this.prisma.product.update({
      where: { id },
      data: this.scalarData(dto) as Prisma.ProductUncheckedUpdateInput,
      include: PRODUCT_RELATIONS_INCLUDE,
    });
    return updated as ProductWithRelations;
  }

  async setStatus(id: string, status: Product['status']): Promise<ProductWithRelations> {
    const updated = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: PRODUCT_RELATIONS_INCLUDE,
    });
    return updated as ProductWithRelations;
  }

  async replaceOptions(id: string, options: ProductOptionInputDto[]): Promise<ProductWithRelations> {
    await this.syncOptions(id, options);
    const updated = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: PRODUCT_RELATIONS_INCLUDE,
    });
    return updated as ProductWithRelations;
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private scalarData(dto: ProductInputDto) {
    const amount = dto.pricing.type === 'fixed' ? dto.pricing.amount : null;
    const min = dto.pricing.type === 'range' ? dto.pricing.min : null;
    const max = dto.pricing.type === 'range' ? dto.pricing.max : null;
    const referencePrice = dto.pricing.type === 'fixed' ? (amount ?? null) : dto.pricing.type === 'range' ? (min ?? null) : null;

    return {
      slug: dto.slug,
      sku: dto.sku,
      title: toJson(dto.title),
      shortDescription: toJson(dto.shortDescription),
      description: toJson(dto.description),
      categoryId: dto.categoryId,
      materialType: MATERIAL_TYPE_TO_DB[dto.materialType],
      material: toJson(dto.material),
      finish: toJsonOrNull(dto.finish),
      origin: toJsonOrNull(dto.origin),
      dimLength: dto.dimensions.length ?? null,
      dimWidth: dto.dimensions.width ?? null,
      dimHeight: dto.dimensions.height ?? null,
      dimWeight: dto.dimensions.weight ?? null,
      pricingType: PRICING_TYPE_TO_DB[dto.pricing.type],
      priceAmount: amount,
      priceMin: min,
      priceMax: max,
      referencePrice,
      specifications: toJson(dto.specifications ?? []),
      availability: AVAILABILITY_TO_DB[dto.availability],
      preOrderEnabled: dto.preOrder.enabled,
      preOrderMinQuantity: dto.preOrder.minQuantity,
      preOrderMaxQuantity: dto.preOrder.maxQuantity,
      preOrderLeadTimeDays: dto.preOrder.leadTimeDays ?? null,
      isFeatured: dto.isFeatured,
      status: PRODUCT_STATUS_TO_DB[dto.status],
      tags: dto.tags ?? [],
    };
  }

  private imageCreateData(image: ProductImageInputDto, index: number) {
    return {
      id: image.id,
      url: image.url,
      alt: toJson(image.alt),
      sortOrder: image.sortOrder ?? index,
    };
  }

  private optionCreateData(option: ProductOptionInputDto, index: number) {
    return {
      id: option.id,
      name: toJson(option.name),
      required: option.required,
      sortOrder: index,
      values: {
        create: option.values.map((value, valueIndex) => ({
          id: value.id,
          label: toJson(value.label),
          priceDelta: value.priceDelta,
          sortOrder: valueIndex,
        })),
      },
    };
  }

  /** docs/API.md §6.3: omitted id -> created; present id -> kept (so snapshots stay stable). */
  private async syncImages(productId: string, images: ProductImageInputDto[]): Promise<void> {
    const keepIds = images.filter((image) => image.id).map((image) => image.id as string);
    await this.prisma.productImage.deleteMany({
      where: { productId, id: { notIn: keepIds.length > 0 ? keepIds : ['__none__'] } },
    });

    for (const [index, image] of images.entries()) {
      if (image.id) {
        await this.prisma.productImage.upsert({
          where: { id: image.id },
          update: { url: image.url, alt: toJson(image.alt), sortOrder: image.sortOrder ?? index },
          create: {
            id: image.id,
            productId,
            url: image.url,
            alt: toJson(image.alt),
            sortOrder: image.sortOrder ?? index,
          },
        });
      } else {
        await this.prisma.productImage.create({
          data: { productId, url: image.url, alt: toJson(image.alt), sortOrder: image.sortOrder ?? index },
        });
      }
    }
  }

  private async syncOptions(productId: string, options: ProductOptionInputDto[]): Promise<void> {
    const keepIds = options.filter((option) => option.id).map((option) => option.id as string);
    await this.prisma.productOption.deleteMany({
      where: { productId, id: { notIn: keepIds.length > 0 ? keepIds : ['__none__'] } },
    });

    for (const [index, option] of options.entries()) {
      const optionId = option.id
        ? (
            await this.prisma.productOption.upsert({
              where: { id: option.id },
              update: { name: toJson(option.name), required: option.required, sortOrder: index },
              create: {
                id: option.id,
                productId,
                name: toJson(option.name),
                required: option.required,
                sortOrder: index,
              },
            })
          ).id
        : (
            await this.prisma.productOption.create({
              data: { productId, name: toJson(option.name), required: option.required, sortOrder: index },
            })
          ).id;

      const keepValueIds = option.values.filter((value) => value.id).map((value) => value.id as string);
      await this.prisma.productOptionValue.deleteMany({
        where: { optionId, id: { notIn: keepValueIds.length > 0 ? keepValueIds : ['__none__'] } },
      });

      for (const [valueIndex, value] of option.values.entries()) {
        if (value.id) {
          await this.prisma.productOptionValue.upsert({
            where: { id: value.id },
            update: { label: toJson(value.label), priceDelta: value.priceDelta, sortOrder: valueIndex },
            create: {
              id: value.id,
              optionId,
              label: toJson(value.label),
              priceDelta: value.priceDelta,
              sortOrder: valueIndex,
            },
          });
        } else {
          await this.prisma.productOptionValue.create({
            data: { optionId, label: toJson(value.label), priceDelta: value.priceDelta, sortOrder: valueIndex },
          });
        }
      }
    }
  }
}
