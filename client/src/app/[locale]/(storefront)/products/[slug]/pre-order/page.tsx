import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container, SectionTitle } from "@/components/ui/section-title";
import { getProductBySlugOrNotFound } from "@/features/catalog/server";
import { PreOrderFlow } from "@/features/pre-orders/components/pre-order-flow";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/localize";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]/pre-order">): Promise<Metadata> {
  const { locale, slug } = await params;
  const [t, product] = await Promise.all([getTranslations({ locale: locale as Locale, namespace: "preOrder" }), getProductBySlugOrNotFound(slug)]);
  return { title: `${t("title")} — ${localize(product.title, locale as Locale)}`, robots: { index: false } };
}

export default async function PreOrderPage({ params }: PageProps<"/[locale]/products/[slug]/pre-order">) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const [t, product] = await Promise.all([getTranslations("preOrder"), getProductBySlugOrNotFound(slug)]);

  return (
    <Container className="py-10 lg:py-16">
      <SectionTitle as="h1" subtitle={t("subtitle")}>
        {t("title")}
      </SectionTitle>
      <PreOrderFlow product={product} />
    </Container>
  );
}
