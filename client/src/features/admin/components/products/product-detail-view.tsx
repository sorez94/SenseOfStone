"use client";

import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert, ErrorState } from "@/components/ui/states";
import { sortImages } from "@/domain";
import { AvailabilityBadge } from "@/features/catalog/components/product-badges";
import { ProductOptionsPreview } from "@/features/catalog/components/product-options-preview";
import { ProductSpecifications } from "@/features/catalog/components/product-specifications";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link, useRouter } from "@/i18n/navigation";
import { useAdminProduct, useDeleteProduct } from "../../hooks";
import { AdminCard, AdminPageHeader } from "../admin-page-header";
import { ProductStatusSelect } from "./product-status-select";

export function ProductDetailView({ id }: { id: string }) {
  const t = useTranslations("admin.products");
  const tForm = useTranslations("admin.productForm");
  const tNav = useTranslations("admin.nav");
  const tCommon = useTranslations("common");
  const tProduct = useTranslations("product");
  const text = useLocalize();
  const format = useFormatters();
  const errorMessage = useApiErrorMessage();
  const router = useRouter();
  const query = useAdminProduct(id);
  const deleteProduct = useDeleteProduct();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (query.isPending) return <LoadingBlock label={tCommon("loading")} />;
  if (query.isError) return <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;

  const product = query.data;
  const title = text(product.title);

  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {tNav("products")}
      </Link>
      <AdminPageHeader
        title={title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span dir="ltr">{product.sku}</span>
            <AvailabilityBadge availability={product.availability} />
            {product.isFeatured ? <Badge tone="dark">{tForm("featured")}</Badge> : null}
          </span>
        }
        actions={
          <>
            {product.status === "published" ? (
              <Link href={`/products/${product.slug}`} target="_blank" className={buttonStyles({ variant: "outline", className: "gap-1.5" })}>
                <ExternalLink className="size-4" aria-hidden /> {t("viewInStore")}
              </Link>
            ) : null}
            <Link href={`/admin/products/${product.id}/edit`} className={buttonStyles({ className: "gap-1.5" })}>
              <Pencil className="size-4" aria-hidden /> {tCommon("edit")}
            </Link>
            <Button variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirmOpen(true)}>
              {tCommon("delete")}
            </Button>
          </>
        }
      />

      {product.status !== "published" ? <Alert className="mb-4">{t("notPublished")}</Alert> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title={tForm("media")}>
            {product.images.length ? (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {sortImages(product.images).map((image) => (
                  <li key={image.id} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-neutral-100">
                    <Image src={image.url} alt={text(image.alt)} fill sizes="160px" className="object-cover" unoptimized={image.url.startsWith("http")} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">{tForm("noImages")}</p>
            )}
          </AdminCard>
          <AdminCard title={tForm("content")}>
            <p className="text-sm text-neutral-700">{text(product.shortDescription)}</p>
            <p className="mt-3 text-sm whitespace-pre-line text-neutral-600">{text(product.description)}</p>
          </AdminCard>
          <AdminCard title={tProduct("specifications")}>
            <ProductSpecifications product={product} />
          </AdminCard>
        </div>
        <div className="space-y-6">
          <AdminCard title={tForm("publishing")}>
            <ProductStatusSelect id={product.id} status={product.status} name={title} />
          </AdminCard>
          <AdminCard title={tForm("pricing")}>
            <p className="text-lg text-leaf-dark">{format.pricing(product.pricing)}</p>
          </AdminCard>
          <AdminCard title={tForm("preOrder")}>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-neutral-500">{tForm("preOrderEnabled")}</dt>
              <dd>{product.preOrder.enabled ? tCommon("yes") : tCommon("no")}</dd>
              <dt className="text-neutral-500">{tForm("minQuantity")}</dt>
              <dd>{format.number(product.preOrder.minQuantity)}</dd>
              <dt className="text-neutral-500">{tForm("maxQuantity")}</dt>
              <dd>{format.number(product.preOrder.maxQuantity)}</dd>
              <dt className="text-neutral-500">{tForm("leadTimeDays")}</dt>
              <dd>{product.preOrder.leadTimeDays === null ? tCommon("noValue") : format.number(product.preOrder.leadTimeDays)}</dd>
            </dl>
          </AdminCard>
          <AdminCard title={tForm("options")}>
            {product.options.length ? <ProductOptionsPreview options={product.options} /> : <p className="text-sm text-neutral-500">{tForm("noOptions")}</p>}
          </AdminCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        loading={deleteProduct.isPending}
        title={t("deleteTitle")}
        description={t("deleteBody", { name: title })}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        closeLabel={tCommon("close")}
        onConfirm={() =>
          deleteProduct.mutate(product.id, {
            onSuccess: () => {
              toast.success(t("deleted"));
              router.push("/admin/products");
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }
      />
    </>
  );
}
