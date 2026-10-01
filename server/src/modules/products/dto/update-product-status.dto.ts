import { IsIn } from 'class-validator';
import { PRODUCT_STATUSES } from '../product.enums';

export class UpdateProductStatusDto {
  @IsIn(PRODUCT_STATUSES)
  status!: string;
}
