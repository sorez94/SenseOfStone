import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { RelatedProductsQueryDto } from './dto/related-products-query.dto';
import { resolveLocale } from '../../common/utils/locale.util';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ProductQueryDto, @Headers('accept-language') acceptLanguage?: string) {
    return this.productsService.listPublic(query, resolveLocale(acceptLanguage));
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getPublicBySlug(slug);
  }

  @Get(':id/options')
  getOptions(@Param('id') id: string) {
    return this.productsService.getOptions(id);
  }

  @Get(':id/related')
  getRelated(@Param('id') id: string, @Query() query: RelatedProductsQueryDto) {
    return this.productsService.getRelated(id, query.limit ?? 4);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getPublicById(id);
  }
}
