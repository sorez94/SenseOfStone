import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/ui/section-title";
import type { Category } from "@/domain";
import { useLocalize } from "@/hooks/use-localize";
import { Link } from "@/i18n/navigation";

/**
 * SOS "COLLECTIONS" strip: tiles are blurred with a dark overlay and sharpen on hover/focus.
 * Implemented as a scroll-snap row (touch-swipeable, RTL-aware) instead of a JS carousel.
 */
export function CategoryShowcase({ categories }: { categories: Category[] }) {
  const t = useTranslations("home");
  const text = useLocalize();
  if (!categories.length) return null;

  return (
    <section aria-labelledby="collections-heading" className="py-16 lg:py-24">
      <SectionTitle>
        <span id="collections-heading">{t("collectionsTitle")}</span>
      </SectionTitle>
      <ul className="no-scrollbar flex snap-x snap-mandatory items-center gap-4 overflow-x-auto px-4 lg:gap-6 lg:px-10">
        {categories.map((category) => (
          <li key={category.id} className="w-[80%] shrink-0 snap-center sm:w-[45%] lg:w-[calc(20%-1.2rem)]">
            <Link href={`/products?category=${category.slug}`} className="group relative block overflow-hidden rounded-sm">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  width={9504}
                  height={6336}
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 45vw, 80vw"
                  className="h-auto w-full blur-sm transition-all duration-500 group-hover:blur-none group-focus-visible:blur-none"
                />
              ) : (
                <div className="aspect-[3/2] bg-sage" />
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white transition-colors group-hover:bg-black/35">
                <span className="text-xl">{text(category.name)}</span>
                <span className="text-xs opacity-80">{category.productCount}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
