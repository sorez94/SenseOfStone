import type { EstimatedTotal, Pricing } from "@/domain";
import { localeMeta, type Locale } from "@/i18n/config";

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeMeta[locale].intl).format(value);
}

/** Uses the locale's native calendar (Solar Hijri for Persian). */
export function formatDate(iso: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(localeMeta[locale].intl, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export interface PriceLabels {
  currency: string;
  onRequest: string;
}

export function formatAmount(amount: number, locale: Locale, labels: Pick<PriceLabels, "currency">): string {
  return `${formatNumber(amount, locale)} ${labels.currency}`;
}

export function formatPricing(pricing: Pricing, locale: Locale, labels: PriceLabels): string {
  switch (pricing.type) {
    case "fixed":
      return formatAmount(pricing.amount, locale, labels);
    case "range":
      return `${formatNumber(pricing.min, locale)} – ${formatAmount(pricing.max, locale, labels)}`;
    case "on_request":
      return labels.onRequest;
  }
}

export function formatEstimate(total: EstimatedTotal | null, locale: Locale, labels: PriceLabels): string {
  if (!total) return labels.onRequest;
  return total.min === total.max
    ? formatAmount(total.min, locale, labels)
    : `${formatNumber(total.min, locale)} – ${formatAmount(total.max, locale, labels)}`;
}

export function formatList(items: string[], locale: Locale): string {
  return new Intl.ListFormat(localeMeta[locale].intl, { style: "short", type: "unit" }).format(items);
}
