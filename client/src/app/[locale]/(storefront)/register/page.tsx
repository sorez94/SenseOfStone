import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";
import { safeNextPath } from "@/features/auth/redirects";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "auth" });
  return { title: t("registerTitle"), robots: { index: false } };
}

export default async function RegisterPage({ params, searchParams }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { next } = await searchParams;
  return <RegisterForm next={safeNextPath(typeof next === "string" ? next : null)} />;
}
