import "server-only";
import { getTranslations } from "next-intl/server";
import type { EstimatedTotal, LocalizedText, Pricing } from "@/domain";
import { formatAmount, formatDate, formatEstimate, formatNumber, formatPricing } from "@/lib/utils/format";
import type { Locale } from "./config";
import { localize } from "./localize";

/** Locale-bound formatters for Server Components (mirror of `useFormatters`). */
export async function getServerFormatters(locale: Locale) {
  const t = await getTranslations({ locale, namespace: "common" });
  const labels = { currency: t("currency"), onRequest: t("priceOnRequest") };
  return {
    text: (value: LocalizedText | null | undefined) => localize(value, locale),
    pricing: (pricing: Pricing) => formatPricing(pricing, locale, labels),
    amount: (amount: number) => formatAmount(amount, locale, labels),
    estimate: (total: EstimatedTotal | null) => formatEstimate(total, locale, labels),
    number: (value: number) => formatNumber(value, locale),
    date: (iso: string) => formatDate(iso, locale),
  };
}
