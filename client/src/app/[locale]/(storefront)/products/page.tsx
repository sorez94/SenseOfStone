import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pagination } from "@/components/ui/pagination";
import { Container, SectionTitle } from "@/components/ui/section-title";
import { EmptyState } from "@/components/ui/states";
import { buttonStyles } from "@/components/ui/button";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { ProductFilters } from "@/features/catalog/components/product-filters";
import { parseProductSearchParams, productListHref } from "@/features/catalog/search-params";
import { Link } from "@/i18n/navigation";
import { getServerServices } from "@/lib/api/server";
import { formatNumber } from "@/lib/utils/format";
import type { Locale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "catalog" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ProductsPage({ params, searchParams }: PageProps<"/[locale]/products">) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const query = parseProductSearchParams(await searchParams);
  const [t, tCommon] = await Promise.all([getTranslations("catalog"), getTranslations("common")]);

  const services = getServerServices();
  const [page, categories] = await Promise.all([services.catalog.listProducts(query), services.catalog.listCategories()]);

  return (
    <Container className="py-10 lg:py-16">
      <SectionTitle as="h1" subtitle={t("subtitle")}>
        {t("title")}
      </SectionTitle>

      <ProductFilters query={query} categories={categories} />

      <p className="mt-6 mb-4 text-sm text-neutral-500" role="status">
        {t("results", { count: page.meta.total })}
      </p>

      {page.items.length ? (
        <ProductGrid products={page.items} priorityCount={4} />
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/products" className={buttonStyles({ variant: "outline" })}>
              {t("reset")}
            </Link>
          }
        />
      )}

      <Pagination
        page={page.meta.page}
        totalPages={page.meta.totalPages}
        hrefFor={(target) => productListHref(query, target)}
        labels={{
          nav: tCommon("pagination"),
          previous: tCommon("previous"),
          next: tCommon("next"),
          pageOf: tCommon("pageOf", { page: formatNumber(page.meta.page, locale), total: formatNumber(page.meta.totalPages, locale) }),
        }}
      />
    </Container>
  );
}
