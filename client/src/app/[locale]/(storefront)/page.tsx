import { setRequestLocale } from "next-intl/server";
import { CategoryShowcase } from "@/features/home/components/category-showcase";
import { FeaturedRows } from "@/features/home/components/featured-rows";
import { Hero } from "@/features/home/components/hero";
import { HowItWorks } from "@/features/home/components/how-it-works";
import type { Locale } from "@/i18n/config";
import { getServerServices } from "@/lib/api/server";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { catalog } = getServerServices();
  const [featured, categories] = await Promise.all([
    catalog.listProducts({ featured: true, sort: "featured", pageSize: 4 }),
    catalog.listCategories(),
  ]);

  return (
    <>
      <Hero />
      <FeaturedRows products={featured.items} />
      <CategoryShowcase categories={categories} />
      <HowItWorks />
    </>
  );
}
