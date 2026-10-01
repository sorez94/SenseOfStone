import { IsOptional, Length } from 'class-validator';

export class UpdatePreOrderNoteDto {
  @IsOptional()
  @Length(0, 2000)
  adminNote?: string | null;
}
