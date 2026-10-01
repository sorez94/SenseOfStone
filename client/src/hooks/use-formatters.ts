import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { EstimatedTotal, Pricing } from "@/domain";
import { formatAmount, formatDate, formatEstimate, formatList, formatNumber, formatPricing } from "@/lib/utils/format";

/** Locale-bound formatters for Client Components. */
export function useFormatters() {
  const locale = useLocale();
  const t = useTranslations("common");
  return useMemo(() => {
    const labels = { currency: t("currency"), onRequest: t("priceOnRequest") };
    return {
      pricing: (pricing: Pricing) => formatPricing(pricing, locale, labels),
      amount: (amount: number) => formatAmount(amount, locale, labels),
      estimate: (total: EstimatedTotal | null) => formatEstimate(total, locale, labels),
      number: (value: number) => formatNumber(value, locale),
      date: (iso: string, withTime = false) => formatDate(iso, locale, withTime),
      list: (items: string[]) => formatList(items, locale),
    };
  }, [locale, t]);
}
