"use client";

import { Eye, ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input, Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { materialTypes, productStatuses, type MaterialType, type ProductStatus, type ProductSummary } from "@/domain";
import { AvailabilityBadge } from "@/features/catalog/components/product-badges";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { useSearchState } from "@/hooks/use-search-state";
import { Link } from "@/i18n/navigation";
import { useAdminCategories, useAdminProducts, useDeleteProduct } from "../../hooks";
import { AdminPageHeader } from "../admin-page-header";
import { ProductStatusSelect } from "./product-status-select";

const FILTER_KEYS = ["q", "status", "category", "materialType"] as const;

export function ProductListView() {
  const t = useTranslations("admin.products");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("productStatus");
  const tMaterial = useTranslations("materialType");
  const tCatalog = useTranslations("catalog");
  const text = useLocalize();
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const { values, page, set } = useSearchState(FILTER_KEYS);
  const [search, setSearch] = useState(values.q);
  const [toDelete, setToDelete] = useState<ProductSummary | null>(null);

  const categories = useAdminCategories();
  const query = useAdminProducts({
    q: values.q || undefined,
    status: (values.status || undefined) as ProductStatus | undefined,
    category: values.category || undefined,
    materialType: (values.materialType || undefined) as MaterialType | undefined,
    page,
    pageSize: 20,
  });
  const deleteProduct = useDeleteProduct();

  const columns: Column<ProductSummary>[] = [
    {
      key: "image",
      header: t("image"),
      hideLabelOnMobile: true,
      className: "w-20 max-md:hidden",
      cell: (p) => (
        <div className="relative flex aspect-[3/2] w-16 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
          {p.coverImage ? <Image src={p.coverImage.url} alt="" fill sizes="64px" className="object-cover" /> : <ImageOff className="size-5 text-neutral-400" aria-hidden />}
        </div>
      ),
    },
    {
      key: "name",
      header: t("name"),
      cell: (p) => (
        <div>
          <Link href={`/admin/products/${p.id}`} className="text-neutral-900 hover:underline">
            {text(p.title)}
          </Link>
          <p className="text-xs text-neutral-500" dir="ltr">
            {p.sku}
          </p>
        </div>
      ),
    },
    { key: "category", header: t("category"), cell: (p) => text(p.category.name) },
    { key: "price", header: t("price"), cell: (p) => <span className="whitespace-nowrap">{format.pricing(p.pricing)}</span> },
    { key: "availability", header: t("availability"), cell: (p) => <AvailabilityBadge availability={p.availability} /> },
    { key: "status", header: t("status"), cell: (p) => <ProductStatusSelect id={p.id} status={p.status} name={text(p.title)} /> },
    {
      key: "actions",
      header: tCommon("actions"),
      hideLabelOnMobile: true,
      className: "md:w-32",
      cell: (p) => (
        <div className="flex justify-end gap-1 max-md:w-full max-md:border-t max-md:border-neutral-100 max-md:pt-2">
          <Link href={`/admin/products/${p.id}`} className={buttonStyles({ variant: "ghost", size: "icon", className: "size-8" })} aria-label={`${tCommon("view")}: ${text(p.title)}`}>
            <Eye className="size-4" aria-hidden />
          </Link>
          <Link href={`/admin/products/${p.id}/edit`} className={buttonStyles({ variant: "ghost", size: "icon", className: "size-8" })} aria-label={`${tCommon("edit")}: ${text(p.title)}`}>
            <Pencil className="size-4" aria-hidden />
          </Link>
          <button type="button" onClick={() => setToDelete(p)} className={buttonStyles({ variant: "ghost", size: "icon", className: "size-8 text-red-600 hover:bg-red-50" })} aria-label={`${tCommon("delete")}: ${text(p.title)}`}>
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        description={query.data ? tCatalog("results", { count: query.data.meta.total }) : undefined}
        actions={
          <Link href="/admin/products/new" className={buttonStyles({ className: "gap-1.5" })}>
            <Plus className="size-4" aria-hidden /> {t("new")}
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]" role="search">
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            set({ q: search.trim() });
          }}
        >
          <label htmlFor="admin-product-search" className="sr-only">
            {tCommon("search")}
          </label>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="admin-product-search"
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
        <Select aria-label={t("status")} value={values.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="">{t("anyStatus")}</option>
          {productStatuses.map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>
        <Select aria-label={t("category")} value={values.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">{tCatalog("allCategories")}</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.slug}>
              {text(c.name)}
            </option>
          ))}
        </Select>
        <Select aria-label={tCatalog("materialType")} value={values.materialType} onChange={(e) => set({ materialType: e.target.value })}>
          <option value="">{tCatalog("anyMaterial")}</option>
          {materialTypes.map((m) => (
            <option key={m} value={m}>
              {tMaterial(m)}
            </option>
          ))}
        </Select>
      </div>

      {query.isPending ? (
        <div role="status" aria-busy className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        loading={deleteProduct.isPending}
        title={t("deleteTitle")}
        description={toDelete ? t("deleteBody", { name: text(toDelete.title) }) : ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        closeLabel={tCommon("close")}
        onConfirm={() =>
          toDelete &&
          deleteProduct.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(t("deleted"));
              setToDelete(null);
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </>
  );
}
