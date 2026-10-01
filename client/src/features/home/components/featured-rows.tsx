import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/ui/section-title";
import { ShopNowLink } from "@/components/ui/shop-now-link";
import type { ProductSummary } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { cn } from "@/lib/utils/cn";

/** SOS landing rows: large image and a title/subtitle/"Shop Now" block, alternating sides. */
export function FeaturedRows({ products }: { products: ProductSummary[] }) {
  const t = useTranslations("home");
  const text = useLocalize();
  const format = useFormatters();
  if (!products.length) return null;

  return (
    <section aria-labelledby="featured-heading" className="pt-16 lg:pt-24">
      <SectionTitle>
        <span id="featured-heading">{t("featuredTitle")}</span>
      </SectionTitle>
      <ul>
        {products.map((product, index) => (
          <li
            key={product.id}
            className={cn(
              "my-12 flex flex-col-reverse px-5 lg:my-20 lg:items-center lg:px-24",
              index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse",
            )}
          >
            <div className="mt-5 flex w-full flex-col justify-center gap-2 px-2 lg:mt-0 lg:w-[34%] lg:px-8">
              <h3 className="text-2xl tracking-wide text-neutral-900 lg:text-5xl">{text(product.title)}</h3>
              <p className="text-sm font-light tracking-widest text-neutral-600 lg:text-base rtl:tracking-normal">
                {text(product.material)} · {format.pricing(product.pricing)}
              </p>
              <p className="mb-4 line-clamp-3 text-sm text-neutral-500 lg:mb-10">{text(product.shortDescription)}</p>
              <ShopNowLink href={`/products/${product.slug}`}>{product.preOrderEnabled ? t("shopNow") : t("viewProduct")}</ShopNowLink>
            </div>
            <div className="w-full overflow-hidden lg:w-[66%] lg:shrink-0">
              {product.coverImage ? (
                <Image
                  src={product.coverImage.url}
                  alt={text(product.coverImage.alt) || text(product.title)}
                  width={9504}
                  height={6336}
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="h-auto w-full transition-transform duration-700 motion-safe:hover:scale-105"
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
