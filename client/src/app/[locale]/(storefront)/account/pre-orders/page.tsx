import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyPreOrdersList } from "@/features/pre-orders/components/my-pre-orders-list";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/pre-orders">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "myPreOrders" });
  return { title: t("title"), robots: { index: false } };
}

export default async function MyPreOrdersPage({ params }: PageProps<"/[locale]/account/pre-orders">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("myPreOrders");
  return (
    <>
      <h1 className="text-2xl text-ink">{t("title")}</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">{t("subtitle")}</p>
      <MyPreOrdersList />
    </>
  );
}
