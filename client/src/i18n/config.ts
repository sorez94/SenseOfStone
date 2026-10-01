/**
 * Single source of truth for supported languages.
 * To add a language: add it here, add `messages/<locale>.json`, and add its
 * value to `LocalizedText` content (the UI falls back to the default locale).
 */
export const locales = ["en", "fa"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export type Direction = "ltr" | "rtl";

export const localeMeta: Record<Locale, { nativeLabel: string; shortLabel: string; dir: Direction; intl: string }> = {
  en: { nativeLabel: "English", shortLabel: "EN", dir: "ltr", intl: "en-US" },
  fa: { nativeLabel: "فارسی", shortLabel: "فا", dir: "rtl", intl: "fa-IR" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): Direction {
  return localeMeta[locale].dir;
}
