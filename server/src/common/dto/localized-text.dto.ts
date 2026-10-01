import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * `LocalizedText` per docs/API.md §1.3: `en` is required, other locales are
 * optional (frontend falls back to `en`). Adding a locale later is additive -
 * no API change needed, so this DTO intentionally doesn't enumerate every
 * possible locale key beyond the two currently shipped.
 */
export class LocalizedTextDto {
  @IsString()
  @IsNotEmpty()
  en!: string;

  @IsOptional()
  @IsString()
  fa?: string;
}

export type LocalizedText = { en: string; fa?: string };
