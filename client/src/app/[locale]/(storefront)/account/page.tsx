import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProfileView } from "@/features/auth/components/profile-view";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "profile" });
  return { title: t("editTitle"), robots: { index: false } };
}

export default async function AccountPage({ params, searchParams }: PageProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { next } = await searchParams;
  return <ProfileView next={typeof next === "string" ? next : null} />;
}
