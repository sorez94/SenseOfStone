"use client";

import { ClipboardList, FolderTree, Package, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { PreOrderStatusBadge } from "@/features/pre-orders/components/pre-order-status-badge";
import { useFormatters } from "@/hooks/use-formatters";
import { Link } from "@/i18n/navigation";
import { useDashboard } from "../hooks";
import { AdminCard, AdminPageHeader } from "./admin-page-header";

export function DashboardView() {
  const t = useTranslations("admin.dashboard");
  const tCommon = useTranslations("common");
  const format = useFormatters();
  const query = useDashboard();

  if (query.isError) {
    return <ErrorState title={tCommon("errorTitle")} description={tCommon("errorDescription")} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;
  }

  const stats = query.data;
  const cards = [
    { label: t("products"), value: stats?.products.total, hint: stats && t("published", { count: stats.products.byStatus.published }), icon: Package, href: "/admin/products" },
    { label: t("categories"), value: stats?.categories.total, icon: FolderTree, href: "/admin/categories" },
    { label: t("preOrders"), value: stats?.preOrders.total, hint: stats && t("pending", { count: stats.preOrders.byStatus.pending }), icon: ClipboardList, href: "/admin/pre-orders" },
    { label: t("customers"), value: stats?.customers.total, icon: Users },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon, href }) => {
          const content = (
            <>
              <span className="flex size-11 items-center justify-center rounded-lg bg-sage-soft text-sage-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-neutral-500">{label}</p>
                {value === undefined ? <Skeleton className="mt-1 h-7 w-12" /> : <p className="text-2xl text-neutral-900">{format.number(value)}</p>}
                {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
              </div>
            </>
          );
          const style = "flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5";
          return (
            <li key={label}>
              {href ? (
                <Link href={href} className={`${style} transition hover:border-neutral-400 hover:shadow-sm`}>
                  {content}
                </Link>
              ) : (
                <div className={style}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>

      <AdminCard
        title={t("recent")}
        className="mt-6"
        actions={
          <Link href="/admin/pre-orders" className="text-sm text-leaf-dark hover:underline">
            {t("viewAll")}
          </Link>
        }
      >
        {!stats ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {stats.recentPreOrders.map((preOrder) => (
              <li key={preOrder.id}>
                <Link href={`/admin/pre-orders/${preOrder.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-neutral-50">
                  <span className="font-mono text-sm" dir="ltr">
                    {preOrder.reference}
                  </span>
                  <span className="flex-1 truncate text-sm text-neutral-700">
                    {preOrder.customer.firstName} {preOrder.customer.lastName}
                  </span>
                  <span className="text-xs text-neutral-500">{format.date(preOrder.createdAt)}</span>
                  <PreOrderStatusBadge status={preOrder.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
