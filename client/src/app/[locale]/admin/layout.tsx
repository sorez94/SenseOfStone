import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/features/admin/components/admin-shell";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default function AdminLayout({ children }: LayoutProps<"/[locale]/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
