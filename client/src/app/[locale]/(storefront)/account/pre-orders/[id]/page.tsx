import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyPreOrderDetail } from "@/features/pre-orders/components/my-pre-order-detail";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/account/pre-orders/[id]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "myPreOrders" });
  return { title: t("details"), robots: { index: false } };
}

export default async function MyPreOrderPage({ params }: PageProps<"/[locale]/account/pre-orders/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  return <MyPreOrderDetail id={id} />;
}
