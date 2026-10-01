import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/redirects";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "auth" });
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(typeof next === "string" ? next : null)} />;
}
