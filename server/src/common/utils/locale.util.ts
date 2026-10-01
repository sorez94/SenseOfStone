export type Locale = 'en' | 'fa';

/** docs/API.md §1.3: Accept-Language only ever affects locale-sensitive sorting. */
export function resolveLocale(acceptLanguage: string | undefined): Locale {
  return acceptLanguage?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function localize(value: { en: string; fa?: string } | null | undefined, locale: Locale): string {
  if (!value) return '';
  if (locale === 'fa' && value.fa) return value.fa;
  return value.en;
}
