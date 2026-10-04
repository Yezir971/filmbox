import { Skeleton } from "@/components/ui/skeleton";

export function ListCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4 shadow-md">
      <div className="flex -space-x-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 w-20 rounded-md border-2 border-card"
          />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function ListGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ListCardSkeleton key={i} />
      ))}
    </div>
  );
}
