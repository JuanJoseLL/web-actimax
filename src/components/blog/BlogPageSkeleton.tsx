import { Skeleton } from "@/components/ui/skeleton";

export function BlogPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-4 h-14 w-4/5 max-w-3xl sm:h-20" />
      <Skeleton className="mt-5 h-4 w-3/5 max-w-xl" />
      <Skeleton className="mt-12 h-96 w-full" />
    </div>
  );
}
