import { Type } from 'class-transformer';
import { IsOptional, Length, Matches, ValidateNested } from 'class-validator';
import { AddressPatchDto } from './address.dto';
import { PHONE_PATTERN } from '../../../common/constants/patterns';

/**
 * docs/API.md §3.7: partial update of any subset of the PUT body; `address` is merged
 * field by field (so, unlike PUT, a partial address is accepted here).
 */
export class UpdateProfileDto {
  @IsOptional()
  @Length(2, 60)
  firstName?: string;

  @IsOptional()
  @Length(2, 60)
  lastName?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN)
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressPatchDto)
  address?: AddressPatchDto;
}
