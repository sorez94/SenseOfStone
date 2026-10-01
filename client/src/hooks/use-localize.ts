import { useLocale } from "next-intl";
import { useCallback } from "react";
import type { LocalizedText } from "@/domain";
import { localize } from "@/i18n/localize";

export function useLocalize() {
  const locale = useLocale();
  return useCallback((text: LocalizedText | null | undefined) => localize(text, locale), [locale]);
}
