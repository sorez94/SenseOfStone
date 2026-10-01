import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../../common/dto/localized-text.dto';
import { SLUG_PATTERN } from '../../../common/constants/patterns';

export class CategoryInputDto {
  @Matches(SLUG_PATTERN, { message: 'slug must be kebab-case (e.g. "living-room")' })
  slug!: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsInt()
  sortOrder!: number;
}
