import { StockCardSkeleton } from "./dashboard-skeleton";

export function WatchlistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-text-secondary">
            Track your favourite stocks
          </p>
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-tertiary" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <StockCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
