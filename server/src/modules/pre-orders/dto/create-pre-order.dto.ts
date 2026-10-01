import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePreOrderItemDto {
  @MinLength(1)
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  /** Map of `optionId -> valueId`. Validated against the product's actual options in the service. */
  @IsOptional()
  @IsObject()
  options?: Record<string, string>;
}

export class CreatePreOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreatePreOrderItemDto)
  items!: CreatePreOrderItemDto[];

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  customerNote?: string;
}
