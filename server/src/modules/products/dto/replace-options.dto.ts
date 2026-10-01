import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProductOptionInputDto } from './product-input.dto';

export class ReplaceOptionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionInputDto)
  options!: ProductOptionInputDto[];
}
