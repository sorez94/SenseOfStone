"use client";

import { ChevronRight, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { preOrderStatuses, type PreOrderStatus } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";
import { useMyPreOrders } from "../hooks";
import { PreOrderStatusBadge } from "./pre-order-status-badge";

export function MyPreOrdersList() {
  const t = useTranslations("myPreOrders");
  const tStatus = useTranslations("preOrderStatus");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const format = useFormatters();
  const [status, setStatus] = useState<PreOrderStatus | "">("");
  const [page, setPage] = useState(1);
  const query = useMyPreOrders({ status: status || undefined, page, pageSize: 10 });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <label htmlFor="my-status" className="sr-only">
          {t("filterStatus")}
        </label>
        <Select
          id="my-status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PreOrderStatus | "");
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">{tCommon("all")}</option>
          {preOrderStatuses.map((value) => (
            <option key={value} value={value}>
              {tStatus(value)}
            </option>
          ))}
        </Select>
      </div>

      {query.isPending ? (
        <div role="status" aria-busy className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title={tCommon("errorTitle")} description={tCommon("errorDescription")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-14" strokeWidth={1.25} />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/products" className={buttonStyles()}>
              {t("browse")}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3" aria-busy={query.isFetching || undefined}>
            {query.data.items.map((preOrder) => (
              <li key={preOrder.id}>
                <Link
                  href={`/account/pre-orders/${preOrder.id}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md transition hover:shadow-lg"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-neutral-900" dir="ltr">
                        {preOrder.reference}
                      </span>
                      <PreOrderStatusBadge status={preOrder.status} />
                    </div>
                    <p className="truncate text-sm text-neutral-700">
                      {format.list(preOrder.items.map((item) => text(item.productTitle)))}
                    </p>
                    <p className="text-xs text-neutral-500">
                      <time dateTime={preOrder.createdAt}>{format.date(preOrder.createdAt)}</time> ·{" "}
                      {t("itemCount", { count: preOrder.items.reduce((sum, item) => sum + item.quantity, 0) })} · {format.estimate(preOrder.estimatedTotal)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-neutral-400 transition group-hover:text-neutral-900 rtl:rotate-180" aria-hidden />
                  <span className="sr-only">{t("details")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onChange={setPage}
            labels={{
              nav: tCommon("pagination"),
              previous: tCommon("previous"),
              next: tCommon("next"),
              pageOf: tCommon("pageOf", { page: format.number(query.data.meta.page), total: format.number(query.data.meta.totalPages) }),
            }}
          />
        </>
      )}
    </div>
  );
}
