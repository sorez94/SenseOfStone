import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { PRE_ORDER_STATUSES } from '../pre-order.enums';

export class UpdatePreOrderStatusDto {
  @IsIn(PRE_ORDER_STATUSES)
  status!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  note?: string;
}
