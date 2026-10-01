import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/section-title";
import { ProductGridSkeleton } from "@/features/catalog/components/product-grid-skeleton";

export default function ProductsLoading() {
  return (
    <Container className="py-10 lg:py-16">
      <div role="status" aria-busy className="flex flex-col items-center gap-3 pb-10">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="mb-8 h-10 w-full" />
      <ProductGridSkeleton />
    </Container>
  );
}
