import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl bg-white shadow-md">
          <Skeleton className="aspect-[3/2] rounded-none" />
          <div className="flex flex-col items-center gap-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}
