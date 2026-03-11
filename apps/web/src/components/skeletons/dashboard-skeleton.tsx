import { Skeleton } from "~/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Overview of your trading activity
        </p>
      </div>

      {/* PnL Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 p-4">
            <div className="h-3 w-16 rounded bg-surface-tertiary" />
            <div className="mt-3 h-5 w-24 rounded bg-surface-tertiary" />
          </Skeleton>
        ))}
      </div>

      {/* Margin card */}
      <Skeleton className="h-24 p-4">
        <div className="h-3 w-24 rounded bg-surface-tertiary" />
        <div className="mt-3 h-5 w-32 rounded bg-surface-tertiary" />
        <div className="mt-2 h-3 w-40 rounded bg-surface-tertiary" />
      </Skeleton>

      {/* Top Stocks */}
      <div>
        <div className="mb-3 h-6 w-28 animate-pulse rounded bg-surface-tertiary" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StockCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StockCardSkeleton() {
  return (
    <Skeleton className="flex items-center justify-between p-4">
      <div>
        <div className="h-4 w-20 rounded bg-surface-tertiary" />
      </div>
      <div className="text-right">
        <div className="h-4 w-16 rounded bg-surface-tertiary" />
        <div className="mt-1.5 h-3 w-24 rounded bg-surface-tertiary" />
      </div>
    </Skeleton>
  );
}
