import { MinLength } from 'class-validator';

export class GoogleLoginDto {
  @MinLength(10)
  idToken!: string;
}
