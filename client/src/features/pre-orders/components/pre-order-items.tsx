"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { PreOrderItem } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";

/** Line items with their selected options, as snapshotted at submission time. */
export function PreOrderItems({ items, linkToProduct = true }: { items: PreOrderItem[]; linkToProduct?: boolean }) {
  const t = useTranslations("myPreOrders");
  const tAdmin = useTranslations("admin.preOrders");
  const text = useLocalize();
  const format = useFormatters();

  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <div className="relative flex aspect-[3/2] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
            {item.productImageUrl ? (
              <Image src={item.productImageUrl} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              <ImageOff className="size-6 text-neutral-400" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-neutral-900">
              {linkToProduct ? (
                <Link href={`/products/${item.productSlug}`} className="hover:underline">
                  {text(item.productTitle)}
                </Link>
              ) : (
                text(item.productTitle)
              )}
            </p>
            {item.selectedOptions.length ? (
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
                {item.selectedOptions.map((option) => (
                  <li key={option.optionId}>
                    {text(option.optionName)}: <span className="text-neutral-700">{text(option.valueLabel)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-sm text-neutral-600">
              {t("quantity", { count: format.number(item.quantity) })} · {tAdmin("unitPrice")}: {format.pricing(item.unitPrice)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
