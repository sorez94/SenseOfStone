"use client";

import { useTranslations } from "next-intl";
import type { PreOrderStatusChange } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { PreOrderStatusBadge } from "./pre-order-status-badge";

/** Vertical timeline of status changes (newest last). */
export function PreOrderHistory({ history, audience }: { history: PreOrderStatusChange[]; audience: "customer" | "admin" }) {
  const t = useTranslations("myPreOrders");
  const format = useFormatters();
  return (
    <ol className="relative ms-2 border-s border-neutral-200">
      {history.map((entry, index) => (
        <li key={`${entry.changedAt}-${index}`} className="ms-5 pb-5 last:pb-0">
          <span aria-hidden className="absolute -start-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-sage-deep" />
          <div className="flex flex-wrap items-center gap-2">
            <PreOrderStatusBadge status={entry.status} />
            <time dateTime={entry.changedAt} className="text-xs text-neutral-500">
              {format.date(entry.changedAt, true)}
            </time>
            <span className="text-xs text-neutral-400">
              {audience === "customer" ? t(`changedBy.${entry.changedBy}`) : entry.changedBy}
            </span>
          </div>
          {entry.note ? <p className="mt-1 text-sm text-neutral-700">{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
