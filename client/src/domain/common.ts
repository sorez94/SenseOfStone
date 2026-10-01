import type { Locale } from "@/i18n/config";

/** ISO-8601 date-time string, e.g. "2026-09-30T10:00:00.000Z". */
export type IsoDateTime = string;

/** Content translated into the supported locales. `en` is required and used as the fallback. */
export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;

/** Prices are stored as integers in Iranian Toman. */
export type CurrencyCode = "IRT";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}
