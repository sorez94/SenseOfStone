"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { LoadingBlock } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/states";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";
import { useAdminProduct } from "../../hooks";
import { AdminPageHeader } from "../admin-page-header";
import { ProductForm } from "./product-form";

function BackLink() {
  const t = useTranslations("admin.nav");
  return (
    <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden /> {t("products")}
    </Link>
  );
}

export function ProductCreateView() {
  const t = useTranslations("admin.products");
  return (
    <>
      <BackLink />
      <AdminPageHeader title={t("createTitle")} />
      <ProductForm />
    </>
  );
}

export function ProductEditView({ id }: { id: string }) {
  const t = useTranslations("admin.products");
  const tCommon = useTranslations("common");
  const text = useLocalize();
  const errorMessage = useApiErrorMessage();
  const query = useAdminProduct(id);

  if (query.isPending) return <LoadingBlock label={tCommon("loading")} />;
  if (query.isError) return <ErrorState title={tCommon("errorTitle")} description={errorMessage(query.error)} retryLabel={tCommon("retry")} onRetry={() => query.refetch()} />;

  return (
    <>
      <BackLink />
      <AdminPageHeader title={t("editTitle")} description={text(query.data.title)} />
      {/* key: reset the form when navigating between products */}
      <ProductForm key={query.data.id} product={query.data} />
    </>
  );
}
