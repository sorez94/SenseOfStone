import { Injectable } from '@nestjs/common';
import { Product } from '@prisma/client';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { ProductInputDto, ProductOptionInputDto } from './dto/product-input.dto';
import { ProductQueryDto, AdminProductQueryDto } from './dto/product-query.dto';
import { canBePreOrdered, toProductDto, toProductOptionDto, toProductSummaryDto } from './product.mapper';
import { MATERIAL_TYPES, AVAILABILITIES, PRODUCT_STATUSES, PRODUCT_STATUS_TO_DB } from './product.enums';
import { PaginatedResult, clampPagination, resolveOvershootPage } from '../../common/dto/paginated-result';
import { Locale } from '../../common/utils/locale.util';
import { Errors } from '../../common/exceptions/app.exception';

const VALID_SORTS = new Set(['newest', 'featured', 'price_asc', 'price_desc', 'title_asc']);

@Injectable()
export class ProductsService {
  constructor(
    private readonly repository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async listPublic(query: ProductQueryDto, locale: Locale) {
    return this.list(query, locale, ['PUBLISHED']);
  }

  async listAdmin(query: AdminProductQueryDto, locale: Locale) {
    const statuses =
      query.status && PRODUCT_STATUSES.includes(query.status)
        ? [query.status.toUpperCase()]
        : PRODUCT_STATUSES.map((s) => s.toUpperCase());
    return this.list(query, locale, statuses, 20);
  }

  async getPublicBySlug(slug: string) {
    const product = await this.repository.findPublicBySlug(slug);
    if (!product) throw Errors.notFound('Product not found');
    return toProductDto(product);
  }

  async getPublicById(id: string) {
    const product = await this.repository.findPublicById(id);
    if (!product) throw Errors.notFound('Product not found');
    return toProductDto(product);
  }

  async getAdminById(id: string) {
    const product = await this.repository.findAdminById(id);
    if (!product) throw Errors.notFound('Product not found');
    return toProductDto(product);
  }

  async getOptions(id: string) {
    const product = await this.repository.findPublicById(id);
    if (!product) throw Errors.notFound('Product not found');
    return product.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toProductOptionDto);
  }

  async getRelated(id: string, limit: number) {
    const product = await this.repository.findPublicById(id);
    if (!product) throw Errors.notFound('Product not found');

    const candidates = await this.repository.findRelatedCandidates(
      id,
      product.categoryId,
      product.materialType,
    );

    const scored = candidates.map((candidate) => ({
      candidate,
      score:
        (candidate.categoryId === product.categoryId ? 2 : 0) +
        (candidate.materialType === product.materialType ? 1 : 0),
    }));
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ candidate }) => toProductSummaryDto(candidate));
  }

  async create(dto: ProductInputDto) {
    await this.validateInput(dto);
    const created = await this.repository.create(dto);
    return toProductDto(created);
  }

  async update(id: string, dto: ProductInputDto) {
    const existing = await this.repository.findAdminById(id);
    if (!existing) throw Errors.notFound('Product not found');
    await this.validateInput(dto, id);
    const updated = await this.repository.update(id, dto);
    return toProductDto(updated);
  }

  async setStatus(id: string, status: string) {
    const existing = await this.repository.findAdminById(id);
    if (!existing) throw Errors.notFound('Product not found');
    const updated = await this.repository.setStatus(id, PRODUCT_STATUS_TO_DB[status]);
    return toProductDto(updated);
  }

  async replaceOptions(id: string, options: ProductOptionInputDto[]) {
    const existing = await this.repository.findAdminById(id);
    if (!existing) throw Errors.notFound('Product not found');
    this.validateOptions(options);
    const updated = await this.repository.replaceOptions(id, options);
    return updated.options
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toProductOptionDto);
  }

  async remove(id: string) {
    const existing = await this.repository.findAdminById(id);
    if (!existing) throw Errors.notFound('Product not found');
    await this.repository.softDelete(id);
  }

  canBePreOrdered(product: Product) {
    return canBePreOrdered(product);
  }

  private async list(
    query: ProductQueryDto,
    locale: Locale,
    statuses: string[],
    defaultPageSize = 12,
  ) {
    const { page, pageSize, skip } = clampPagination(query, defaultPageSize);

    let categoryId: string | undefined;
    if (query.category) {
      const category = await this.categoriesRepository.findActiveBySlug(query.category);
      categoryId = category ? category.id : '__none__';
    }

    const materialType =
      query.materialType && MATERIAL_TYPES.includes(query.materialType)
        ? query.materialType.toUpperCase()
        : undefined;
    const availability =
      query.availability && AVAILABILITIES.includes(query.availability)
        ? query.availability.toUpperCase()
        : undefined;
    const sort = query.sort && VALID_SORTS.has(query.sort) ? query.sort : 'newest';

    const { products, total } = await this.repository.search({
      statuses,
      categoryId,
      materialType,
      availability,
      featured: query.featured,
      preOrderOnly: query.preOrderOnly,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      q: query.q?.trim() || undefined,
      sort,
      locale,
      skip,
      take: pageSize,
    });

    const correctedPage = resolveOvershootPage(page, pageSize, total);
    if (correctedPage !== page && total > 0) {
      const recomputedSkip = (correctedPage - 1) * pageSize;
      const retry = await this.repository.search({
        statuses,
        categoryId,
        materialType,
        availability,
        featured: query.featured,
        preOrderOnly: query.preOrderOnly,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        q: query.q?.trim() || undefined,
        sort,
        locale,
        skip: recomputedSkip,
        take: pageSize,
      });
      return new PaginatedResult(retry.products.map(toProductSummaryDto), correctedPage, pageSize, retry.total);
    }

    return new PaginatedResult(products.map(toProductSummaryDto), page, pageSize, total);
  }

  private async validateInput(dto: ProductInputDto, selfId?: string): Promise<void> {
    if (await this.repository.isSlugTaken(dto.slug, selfId)) {
      throw Errors.slugTaken();
    }
    if (await this.repository.isSkuTaken(dto.sku, selfId)) {
      throw Errors.conflict('SKU is already in use', [
        { field: 'sku', code: 'taken', message: 'SKU is already in use' },
      ]);
    }
    if (!(await this.repository.categoryExists(dto.categoryId))) {
      throw Errors.validation([
        { field: 'categoryId', code: 'not_found', message: 'Category does not exist' },
      ]);
    }
    if (dto.pricing.type === 'range' && (dto.pricing.max ?? 0) < (dto.pricing.min ?? 0)) {
      throw Errors.validation([
        { field: 'pricing.max', code: 'out_of_range', message: 'max must be greater than or equal to min' },
      ]);
    }
    if (dto.preOrder.maxQuantity < dto.preOrder.minQuantity) {
      throw Errors.validation([
        {
          field: 'preOrder.maxQuantity',
          code: 'out_of_range',
          message: 'maxQuantity must be greater than or equal to minQuantity',
        },
      ]);
    }
    this.validateOptions(dto.options ?? []);
  }

  private validateOptions(options: ProductOptionInputDto[]): void {
    options.forEach((option, index) => {
      if (option.values.length === 0) {
        throw Errors.validation([
          { field: `options.${index}.values`, code: 'too_small', message: 'At least one value is required' },
        ]);
      }
    });
  }
}
