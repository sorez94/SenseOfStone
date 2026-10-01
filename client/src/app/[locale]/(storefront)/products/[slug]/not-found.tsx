import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";

export default function ProductNotFound() {
  const t = useTranslations("product");
  return (
    <EmptyState
      title={t("notFoundTitle")}
      description={t("notFoundDescription")}
      action={
        <Link href="/products" className={buttonStyles()}>
          {t("backToProducts")}
        </Link>
      }
    />
  );
}
