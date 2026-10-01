import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutBanner, AboutCta, CompanyProfile, MissionVision } from "@/features/about/components/about-sections";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/about-us">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "about" });
  return { title: t("title"), description: t("bannerSubtitle") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about-us">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <AboutBanner />
      <CompanyProfile />
      <MissionVision />
      <AboutCta />
    </>
  );
}
