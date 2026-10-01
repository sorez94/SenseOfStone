"use client";

import { ClipboardList, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { preOrderStatuses, type PreOrder, type PreOrderStatus } from "@/domain";
import { PreOrderStatusBadge } from "@/features/pre-orders/components/pre-order-status-badge";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { useSearchState } from "@/hooks/use-search-state";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { useAdminPreOrders } from "../../hooks";
import { AdminPageHeader } from "../admin-page-header";

const FILTER_KEYS = ["q", "status"] as const;

export function PreOrderListView() {
  const t = useTranslations("admin.preOrders");
  const tStatus = useTranslations("preOrderStatus");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const { values, page, set } = useSearchState(FILTER_KEYS);
  const [search, setSearch] = useState(values.q);
  const query = useAdminPreOrders({ q: values.q || undefined, status: (values.status || undefined) as PreOrderStatus | undefined, page, pageSize: 20 });

  const columns: Column<PreOrder>[] = [
    {
      key: "reference",
      header: t("reference"),
      cell: (p) => (
        <Link href={`/admin/pre-orders/${p.id}`} className="font-mono text-neutral-900 hover:underline" dir="ltr">
          {p.reference}
        </Link>
      ),
    },
    {
      key: "customer",
      header: t("customer"),
      cell: (p) => (
        <div>
          <p className="text-neutral-900">
            {p.customer.firstName} {p.customer.lastName}
          </p>
          <p className="text-xs text-neutral-500" dir="ltr">
            {p.customer.phone}
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: t("items"),
      cell: (p) => <span className="line-clamp-2 max-w-60">{format.list(p.items.map((i) => `${text(i.productTitle)} ×${format.number(i.quantity)}`))}</span>,
    },
    { key: "total", header: t("total"), cell: (p) => <span className="whitespace-nowrap">{format.estimate(p.estimatedTotal)}</span> },
    { key: "date", header: t("date"), cell: (p) => <time dateTime={p.createdAt} className="whitespace-nowrap">{format.date(p.createdAt)}</time> },
    { key: "status", header: t("status"), cell: (p) => <PreOrderStatusBadge status={p.status} /> },
  ];

  const tabs: Array<{ value: string; label: string }> = [{ value: "", label: tCommon("all") }, ...preOrderStatuses.map((s) => ({ value: s, label: tStatus(s) }))];

  return (
    <>
      <AdminPageHeader title={t("title")} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={t("status")} className="no-scrollbar flex gap-1 overflow-x-auto rounded-lg bg-white p-1 ring-1 ring-neutral-200">
          {tabs.map((tab) => {
            const active = values.status === tab.value;
            return (
              <button
                key={tab.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => set({ status: tab.value })}
                className={cn("rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition", active ? "bg-sage text-neutral-900" : "text-neutral-600 hover:bg-neutral-100")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <form
          role="search"
          className="relative lg:w-96"
          onSubmit={(event) => {
            event.preventDefault();
            set({ q: search.trim() });
          }}
        >
          <label htmlFor="admin-preorder-search" className="sr-only">
            {tCommon("search")}
          </label>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="admin-preorder-search"
            type="search"
            appearance="boxed"
            className="ps-9"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (!event.target.value) set({ q: "" });
            }}
          />
        </form>
      </div>

      {query.isPending ? (
        <div role="status" aria-busy className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-14" strokeWidth={1.25} />} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <>
          <DataTable caption={t("title")} columns={columns} rows={query.data.items} rowKey={(p) => p.id} busy={query.isFetching} />
          <Pagination
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onChange={(target) => set({ page: target })}
            labels={{
              nav: tCommon("pagination"),
              previous: tCommon("previous"),
              next: tCommon("next"),
              pageOf: tCommon("pageOf", { page: format.number(query.data.meta.page), total: format.number(query.data.meta.totalPages) }),
            }}
          />
        </>
      )}
    </>
  );
}
