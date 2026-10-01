import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { glacier, vazirmatn } from "@/app/fonts";
import { env } from "@/config/env";
import { getDirection } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/app-providers";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t("title"), template: `%s | ${t("title")}` },
    description: t("description"),
    icons: { icon: "/favicon.ico" },
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = { themeColor: "#cad7b2", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html lang={locale} dir={getDirection(locale)} className={`${glacier.variable} ${vazirmatn.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
