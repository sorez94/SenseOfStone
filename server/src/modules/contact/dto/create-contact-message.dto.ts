import { IsEmail, Length } from 'class-validator';

export class CreateContactMessageDto {
  @Length(2, 80)
  name!: string;

  @IsEmail()
  email!: string;

  @Length(10, 2000)
  message!: string;
}
