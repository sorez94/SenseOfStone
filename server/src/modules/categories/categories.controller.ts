import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryDto } from './category.mapper';

@ApiTags('categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  list(): Promise<CategoryDto[]> {
    return this.categoriesService.listPublic();
  }

  @Get('categories/slug/:slug')
  getBySlug(@Param('slug') slug: string): Promise<CategoryDto> {
    return this.categoriesService.getPublicBySlug(slug);
  }
}
