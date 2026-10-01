import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { ProductInputDto } from './dto/product-input.dto';
import { AdminProductQueryDto } from './dto/product-query.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ReplaceOptionsDto } from './dto/replace-options.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveLocale } from '../../common/utils/locale.util';

@ApiTags('admin-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: AdminProductQueryDto, @Headers('accept-language') acceptLanguage?: string) {
    return this.productsService.listAdmin(query, resolveLocale(acceptLanguage));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getAdminById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: ProductInputDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ProductInputDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdateProductStatusDto) {
    return this.productsService.setStatus(id, dto.status);
  }

  @Put(':id/options')
  replaceOptions(@Param('id') id: string, @Body() dto: ReplaceOptionsDto) {
    return this.productsService.replaceOptions(id, dto.options);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.productsService.remove(id);
  }
}
