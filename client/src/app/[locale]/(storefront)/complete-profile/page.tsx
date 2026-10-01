import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CompleteProfileView } from "@/features/auth/components/complete-profile-view";
import { safeNextPath } from "@/features/auth/redirects";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/complete-profile">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "profile" });
  return { title: t("completeTitle"), robots: { index: false } };
}

export default async function CompleteProfilePage({ params, searchParams }: PageProps<"/[locale]/complete-profile">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { next } = await searchParams;
  return <CompleteProfileView next={safeNextPath(typeof next === "string" ? next : null)} />;
}
