import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/ui/section-title";

export default function ProductLoading() {
  return (
    <Container className="py-8 lg:py-14">
      <div role="status" aria-busy className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-[3/2] rounded-2xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </Container>
  );
}
