import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CategoriesRepository } from './categories.repository';
import { CategoryInputDto } from './dto/category-input.dto';
import { CategoryDto, toCategoryDto } from './category.mapper';
import { Errors } from '../../common/exceptions/app.exception';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async listPublic(): Promise<CategoryDto[]> {
    return this.listWithCounts(true);
  }

  async listAdmin(): Promise<CategoryDto[]> {
    return this.listWithCounts(false);
  }

  async getPublicBySlug(slug: string): Promise<CategoryDto> {
    const category = await this.repository.findActiveBySlug(slug);
    if (!category) throw Errors.notFound('Category not found');
    const count = await this.repository.countProducts(category.id, true);
    return toCategoryDto(category, count);
  }

  async create(dto: CategoryInputDto): Promise<CategoryDto> {
    if (await this.repository.isSlugTaken(dto.slug)) {
      throw Errors.slugTaken();
    }
    const created = await this.repository.create(dto);
    return toCategoryDto(created, 0);
  }

  async update(id: string, dto: CategoryInputDto): Promise<CategoryDto> {
    const existing = await this.repository.findActiveById(id);
    if (!existing) throw Errors.notFound('Category not found');

    if (await this.repository.isSlugTaken(dto.slug, id)) {
      throw Errors.slugTaken();
    }

    const updated = await this.repository.update(id, dto);
    const count = await this.repository.countProducts(id, false);
    return toCategoryDto(updated, count);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findActiveById(id);
    if (!existing) throw Errors.notFound('Category not found');

    const productCount = await this.repository.countProducts(id, false);
    if (productCount > 0) {
      throw Errors.categoryNotEmpty();
    }

    await this.repository.softDelete(id);
  }

  private async listWithCounts(onlyPublished: boolean): Promise<CategoryDto[]> {
    const categories = await this.repository.findAllActive();
    const counts = await this.repository.countProductsByCategoryIds(
      categories.map((c: Category) => c.id),
      onlyPublished,
    );
    const countByCategoryId = new Map(counts.map((c) => [c.categoryId, c._count.categoryId]));
    return categories.map((category) =>
      toCategoryDto(category, countByCategoryId.get(category.id) ?? 0),
    );
  }
}
