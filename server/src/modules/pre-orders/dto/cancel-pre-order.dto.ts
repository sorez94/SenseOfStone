import { IsOptional, IsString, Length } from 'class-validator';

export class CancelPreOrderDto {
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}
