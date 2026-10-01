import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center">
      <EmptyState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={
          <Link href="/" className={buttonStyles()}>
            {t("goHome")}
          </Link>
        }
      />
    </main>
  );
}
