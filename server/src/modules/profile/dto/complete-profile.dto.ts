import { Type } from 'class-transformer';
import { Length, Matches, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { PHONE_PATTERN } from '../../../common/constants/patterns';

export class CompleteProfileDto {
  @Length(2, 60)
  firstName!: string;

  @Length(2, 60)
  lastName!: string;

  @Matches(PHONE_PATTERN)
  phone!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}
