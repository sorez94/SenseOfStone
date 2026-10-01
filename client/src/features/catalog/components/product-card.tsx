import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ProductSummary } from "@/domain";
import { useFormatters } from "@/hooks/use-formatters";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";

/** SOS product card: white rounded card, soft shadow, lifts on hover, image zooms in. */
export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const t = useTranslations("catalog");
  const text = useLocalize();
  const format = useFormatters();
  const title = text(product.title);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl motion-safe:hover:-translate-y-1">
      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
        {product.coverImage ? (
          <Image
            src={product.coverImage.url}
            alt={text(product.coverImage.alt) || title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <ImageOff className="size-10" aria-hidden />
          </div>
        )}
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {product.isFeatured ? <Badge tone="dark">{t("featuredBadge")}</Badge> : null}
          {product.preOrderEnabled ? <Badge tone="sage">{t("preOrderBadge")}</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-4 text-center">
        <p className="text-xs tracking-wide text-neutral-500 uppercase rtl:tracking-normal">{text(product.category.name)}</p>
        <h3 className="text-base text-neutral-900">
          {/* Stretched link: the whole card is clickable, one tab stop. */}
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-neutral-500">{text(product.shortDescription)}</p>
        <p className="mt-auto pt-2 text-sm font-medium text-leaf-dark">{format.pricing(product.pricing)}</p>
      </div>
      {/* Focus ring for the stretched link. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-leaf-dark group-has-[a:focus-visible]:ring-2" />
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductSummary[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
      {products.map((product, index) => (
        <li key={product.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
