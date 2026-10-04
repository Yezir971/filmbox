import { Skeleton } from "@/components/ui/skeleton";

export function RankingRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/60">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function RankingListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <RankingRowSkeleton key={i} />
      ))}
    </div>
  );
}
