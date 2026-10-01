import { ChevronRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/section-title";
import { canBePreOrdered, sortImages } from "@/domain";
import { AvailabilityBadge } from "@/features/catalog/components/product-badges";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductOptionsPreview } from "@/features/catalog/components/product-options-preview";
import { ProductSpecifications } from "@/features/catalog/components/product-specifications";
import { getProductBySlugOrNotFound } from "@/features/catalog/server";
import type { Locale } from "@/i18n/config";
import { localize } from "@/i18n/localize";
import { Link } from "@/i18n/navigation";
import { getServerFormatters } from "@/i18n/server-formatters";
import { getServerServices } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/products/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlugOrNotFound(slug);
  const cover = sortImages(product.images)[0];
  return {
    title: localize(product.title, locale as Locale),
    description: localize(product.shortDescription, locale as Locale),
    openGraph: cover ? { images: [{ url: cover.url }] } : undefined,
  };
}

export default async function ProductDetailPage({ params }: PageProps<"/[locale]/products/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const product = await getProductBySlugOrNotFound(slug);
  const [t, tNav, format, related] = await Promise.all([
    getTranslations("product"),
    getTranslations("nav"),
    getServerFormatters(locale),
    getServerServices().catalog.getRelatedProducts(product.id, 4).catch(() => []),
  ]);
  const title = format.text(product.title);
  const preOrderable = canBePreOrdered(product);

  return (
    <Container className="py-8 lg:py-14">
      <nav aria-label={t("breadcrumb")} className="mb-6 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          {[
            { href: "/", label: tNav("home") },
            { href: "/products", label: tNav("products") },
            { href: `/products?category=${product.category.slug}`, label: format.text(product.category.name) },
          ].map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <Link href={crumb.href} className="hover:text-neutral-900">
                {crumb.label}
              </Link>
              <ChevronRight aria-hidden className="size-3.5 rtl:rotate-180" />
            </li>
          ))}
          <li aria-current="page" className="text-neutral-800">
            {title}
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="md:sticky md:top-24 md:self-start lg:top-32">
          <ProductGallery images={product.images} title={title} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <AvailabilityBadge availability={product.availability} />
              <Badge tone="neutral">{format.text(product.material)}</Badge>
            </div>
            <h1 className="text-3xl text-neutral-900 lg:text-5xl">{title}</h1>
            <p className="text-base text-neutral-500 lg:text-lg">{format.text(product.shortDescription)}</p>
            <p className="text-2xl text-leaf-dark">{format.pricing(product.pricing)}</p>
            {product.preOrder.leadTimeDays ? (
              <p className="flex items-center gap-2 text-sm text-neutral-600">
                <Clock className="size-4" aria-hidden />
                {t("leadTime", { days: format.number(product.preOrder.leadTimeDays) })}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-sage-line bg-sage-soft/60 p-5">
            {preOrderable ? (
              <>
                <Link href={`/products/${product.slug}/pre-order`} className={buttonStyles({ size: "lg", className: "w-full" })}>
                  {t("preOrderCta")}
                </Link>
                <p className="mt-3 text-center text-xs text-neutral-600">
                  {t("preOrderNote")} ·{" "}
                  {t("quantityLimits", { min: format.number(product.preOrder.minQuantity), max: format.number(product.preOrder.maxQuantity) })}
                </p>
              </>
            ) : (
              <p className="text-center text-sm text-neutral-600">{t("preOrderUnavailable")}</p>
            )}
          </div>

          <ProductOptionsPreview options={product.options} />

          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="mb-2 text-lg text-neutral-900">
              {t("description")}
            </h2>
            <div className="space-y-3 text-sm leading-7 text-neutral-600">
              {format
                .text(product.description)
                .split(/\n+/)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>
          </section>

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-2 text-lg text-neutral-900">
              {t("specifications")}
            </h2>
            <ProductSpecifications product={product} />
          </section>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-heading" className="mt-16 lg:mt-24">
          <h2 id="related-heading" className="mb-8 text-center font-display text-3xl text-sage-deep uppercase lg:text-4xl">
            {t("relatedTitle")}
          </h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
    </Container>
  );
}
