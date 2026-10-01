import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const toBoolean = ({ value }: { value: unknown }) => value === 'true' || value === true;

/**
 * docs/API.md §4.1: "Unknown/invalid filter values are ignored" - so these are intentionally
 * loosely typed strings rather than @IsIn-validated enums; ProductsService silently drops
 * anything that doesn't match a known value instead of raising a 422.
 */
export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  materialType?: string;

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @Transform(toBoolean)
  preOrderOnly?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
