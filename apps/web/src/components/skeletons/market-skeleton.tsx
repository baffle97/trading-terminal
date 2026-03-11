import { Skeleton } from "~/components/ui/skeleton";
import { StockCardSkeleton } from "./dashboard-skeleton";

export function MarketSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market</h1>
        <p className="text-sm text-text-secondary">
          Live prices and index overview
        </p>
      </div>

      {/* Portfolio summary card */}
      <Skeleton className="h-28 p-4">
        <div className="mb-3 h-4 w-28 rounded bg-surface-tertiary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-surface px-3 py-2">
              <div className="h-3 w-14 rounded bg-surface-tertiary" />
              <div className="mt-2 h-4 w-20 rounded bg-surface-tertiary" />
            </div>
          ))}
        </div>
      </Skeleton>

      {/* Tabs */}
      <div className="flex gap-2">
        <div className="h-9 w-20 animate-pulse rounded-lg bg-primary/30" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-tertiary" />
      </div>

      {/* Index chart card */}
      <Skeleton className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="h-5 w-20 rounded bg-surface-tertiary" />
            <div className="mt-1 h-3 w-28 rounded bg-surface-tertiary" />
          </div>
          <div className="text-right">
            <div className="h-3 w-16 rounded bg-surface-tertiary" />
            <div className="mt-1 h-4 w-12 rounded bg-surface-tertiary" />
          </div>
        </div>
        <div className="h-[180px] rounded-lg bg-surface-tertiary" />
      </Skeleton>

      {/* Gainers & Losers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GainerLoserSkeleton title="Top Gainers" />
        <GainerLoserSkeleton title="Top Losers" />
      </div>

      {/* All stocks grid */}
      <div>
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-surface-tertiary" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <StockCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GainerLoserSkeleton({ title }: { title: string }) {
  return (
    <Skeleton className="p-4">
      <div className="mb-2 h-4 w-24 rounded bg-surface-tertiary" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-surface-tertiary" />
            <div className="flex gap-2">
              <div className="h-3 w-14 rounded bg-surface-tertiary" />
              <div className="h-3 w-10 rounded bg-surface-tertiary" />
            </div>
          </div>
        ))}
      </div>
    </Skeleton>
  );
}
