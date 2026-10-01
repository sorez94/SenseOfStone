import { Transform } from 'class-transformer';
import { IsOptional, Length, Matches } from 'class-validator';
import { POSTAL_CODE_PATTERN } from '../../../common/constants/patterns';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class AddressDto {
  @Length(2, 80)
  city!: string;

  @Length(5, 300)
  line!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Matches(POSTAL_CODE_PATTERN)
  postalCode?: string;
}

export class AddressPatchDto {
  @IsOptional()
  @Length(2, 80)
  city?: string;

  @IsOptional()
  @Length(5, 300)
  line?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Matches(POSTAL_CODE_PATTERN)
  postalCode?: string;
}
