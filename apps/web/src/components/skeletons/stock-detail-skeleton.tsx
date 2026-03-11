import { Skeleton } from "~/components/ui/skeleton";

export function StockDetailSkeleton({ symbol }: { symbol: string }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{symbol}</h1>
        <p className="text-sm text-text-secondary">NSE - Equity</p>
        <div className="mt-2 flex items-baseline gap-3">
          <div className="h-9 w-32 animate-pulse rounded bg-surface-tertiary" />
          <div className="h-6 w-40 animate-pulse rounded bg-surface-tertiary" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Timeframe buttons */}
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-12 animate-pulse rounded-lg bg-surface-tertiary"
              />
            ))}
          </div>

          {/* Chart area */}
          <Skeleton className="h-[300px]" />

          {/* OHLC info grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="p-3">
                <div className="h-3 w-14 rounded bg-surface-tertiary" />
                <div className="mt-2 h-4 w-16 rounded bg-surface-tertiary" />
              </Skeleton>
            ))}
          </div>

          {/* Market depth */}
          <Skeleton className="h-[200px] p-4">
            <div className="mb-3 h-4 w-28 rounded bg-surface-tertiary" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-surface-tertiary" />
                  <div className="h-4 w-16 rounded bg-surface-tertiary" />
                  <div className="h-4 w-16 rounded bg-surface-tertiary" />
                  <div className="h-4 w-20 rounded bg-surface-tertiary" />
                </div>
              ))}
            </div>
          </Skeleton>
        </div>

        {/* Order form */}
        <div className="space-y-4">
          <Skeleton className="h-[400px] p-4">
            <div className="mb-4 h-5 w-24 rounded bg-surface-tertiary" />
            {/* Buy/Sell tabs */}
            <div className="mb-4 flex gap-2">
              <div className="h-9 flex-1 rounded-lg bg-surface-tertiary" />
              <div className="h-9 flex-1 rounded-lg bg-surface-tertiary" />
            </div>
            {/* Form fields */}
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1 h-3 w-16 rounded bg-surface-tertiary" />
                  <div className="h-9 w-full rounded-lg bg-surface-tertiary" />
                </div>
              ))}
            </div>
            {/* Submit button */}
            <div className="mt-6 h-10 w-full rounded-lg bg-surface-tertiary" />
          </Skeleton>
        </div>
      </div>
    </div>
  );
}
