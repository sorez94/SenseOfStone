"use client";

import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import type { Category } from "@/domain";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";
import { useAdminCategories, useDeleteCategory } from "../../hooks";
import { AdminPageHeader } from "../admin-page-header";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoriesView() {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const query = useAdminCategories();
  const deleteCategory = useDeleteCategory();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const openForm = (category: Category | null) => {
    setEditing(category);
    setFormOpen(true);
  };

  const columns: Column<Category>[] = [
    {
      key: "image",
      header: "",
      hideLabelOnMobile: true,
      className: "w-16 max-md:hidden",
      cell: (c) => (
        <div className="relative size-10 overflow-hidden rounded-md bg-sage-soft">
          {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="40px" className="object-cover" unoptimized={c.imageUrl.startsWith("http")} /> : null}
        </div>
      ),
    },
    {
      key: "name",
      header: t("name"),
      cell: (c) => (
        <div>
          <p className="text-neutral-900">{text(c.name)}</p>
          {c.description ? <p className="line-clamp-1 text-xs text-neutral-500">{text(c.description)}</p> : null}
        </div>
      ),
    },
    { key: "slug", header: t("slug"), cell: (c) => <code dir="ltr" className="text-xs">{c.slug}</code> },
    {
      key: "products",
      header: t("products"),
      cell: (c) => (
        <Link href={`/admin/products?category=${c.slug}`} className="text-leaf-dark hover:underline">
          {format.number(c.productCount)}
        </Link>
      ),
    },
    { key: "sort", header: t("sortOrder"), cell: (c) => format.number(c.sortOrder) },
    {
      key: "actions",
      header: tCommon("actions"),
      hideLabelOnMobile: true,
      className: "md:w-28",
      cell: (c) => (
        <div className="flex justify-end gap-1 max-md:w-full max-md:border-t max-md:border-neutral-100 max-md:pt-2">
          <button type="button" onClick={() => openForm(c)} className={buttonStyles({ variant: "ghost", size: "icon", className: "size-8" })} aria-label={`${tCommon("edit")}: ${text(c.name)}`}>
            <Pencil className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => setToDelete(c)} className={buttonStyles({ variant: "ghost", size: "icon", className: "size-8 text-red-600 hover:bg-red-50" })} aria-label={`${tCommon("delete")}: ${text(c.name)}`}>
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
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => openForm(null)}>
            {t("new")}
          </Button>
        }
      />

      {query.isPending ? (
        <div role="status" aria-busy className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState icon={<FolderTree className="size-14" strokeWidth={1.25} />} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <DataTable caption={t("title")} columns={columns} rows={query.data} rowKey={(c) => c.id} busy={query.isFetching} />
      )}

      {formOpen ? (
        <CategoryFormDialog
          open
          category={editing}
          nextSortOrder={(query.data?.reduce((max, c) => Math.max(max, c.sortOrder), 0) ?? 0) + 1}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        loading={deleteCategory.isPending}
        title={t("deleteTitle")}
        description={toDelete ? t("deleteBody", { name: text(toDelete.name) }) : ""}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        closeLabel={tCommon("close")}
        onConfirm={() =>
          toDelete &&
          deleteCategory.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(t("deleted"));
              setToDelete(null);
            },
            onError: (error) => {
              toast.error(errorMessage(error));
              setToDelete(null);
            },
          })
        }
      />
    </>
  );
}
