import type { LocalizedText } from "@/domain";
import { defaultLocale, type Locale } from "./config";

/** Picks the text for `locale`, falling back to the default locale, then English. */
export function localize(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale]?.trim() || text[defaultLocale]?.trim() || text.en;
}
