import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';
import { SLUG_PATTERN } from '../../../common/constants/patterns';
import { AVAILABILITIES, MATERIAL_TYPES, PRODUCT_STATUSES } from '../product.enums';

export class DimensionsInputDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number | null;
}

export class PricingInputDto {
  @IsIn(['fixed', 'range', 'on_request'])
  type!: 'fixed' | 'range' | 'on_request';

  @ValidateIf((o: PricingInputDto) => o.type === 'fixed')
  @IsInt()
  @Min(0)
  amount?: number;

  @ValidateIf((o: PricingInputDto) => o.type === 'range')
  @IsInt()
  @Min(0)
  min?: number;

  @ValidateIf((o: PricingInputDto) => o.type === 'range')
  @IsInt()
  @Min(0)
  max?: number;
}

export class ProductOptionValueInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  label!: LocalizedTextDto;

  @IsInt()
  priceDelta!: number;
}

export class ProductOptionInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @IsBoolean()
  required!: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductOptionValueInputDto)
  values!: ProductOptionValueInputDto[];
}

export class ProductImageInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @MinLength(1)
  url!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  alt!: LocalizedTextDto;

  @IsInt()
  sortOrder!: number;
}

export class SpecificationInputDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  label!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  value!: LocalizedTextDto;
}

export class PreOrderSettingsInputDto {
  @IsBoolean()
  enabled!: boolean;

  @IsInt()
  @Min(1)
  minQuantity!: number;

  @IsInt()
  @Min(1)
  maxQuantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;
}

export class ProductInputDto {
  @Matches(SLUG_PATTERN, { message: 'slug must be kebab-case (e.g. "luna-coffee-table")' })
  slug!: string;

  @Length(1, 40)
  sku!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  shortDescription!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @MinLength(1)
  categoryId!: string;

  @IsIn(MATERIAL_TYPES)
  materialType!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  material!: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  finish?: LocalizedTextDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  origin?: LocalizedTextDto | null;

  @ValidateNested()
  @Type(() => DimensionsInputDto)
  dimensions!: DimensionsInputDto;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images!: ProductImageInputDto[];

  @ValidateNested()
  @Type(() => PricingInputDto)
  pricing!: PricingInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionInputDto)
  options?: ProductOptionInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationInputDto)
  specifications?: SpecificationInputDto[];

  @IsIn(AVAILABILITIES)
  availability!: string;

  @ValidateNested()
  @Type(() => PreOrderSettingsInputDto)
  preOrder!: PreOrderSettingsInputDto;

  @IsBoolean()
  isFeatured!: boolean;

  @IsIn(PRODUCT_STATUSES)
  status!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}
