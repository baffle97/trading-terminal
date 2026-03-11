import { Skeleton } from "~/components/ui/skeleton";

export function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-text-secondary">
          Holdings and P&L overview
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

      {/* Holdings header */}
      <div>
        <div className="mb-3 h-6 w-32 animate-pulse rounded bg-surface-tertiary" />
        {/* Holdings table */}
        <Skeleton className="overflow-hidden p-0">
          {/* Table header */}
          <div className="flex border-b border-border px-4 py-3">
            {["w-24", "w-16", "w-20", "w-16", "w-20", "w-16"].map(
              (width, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-3 ${width} rounded bg-surface-tertiary`} />
                </div>
              ),
            )}
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex border-b border-border px-4 py-3 last:border-b-0"
            >
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex-1">
                  <div className="h-4 w-16 rounded bg-surface-tertiary" />
                </div>
              ))}
            </div>
          ))}
        </Skeleton>
      </div>
    </div>
  );
}
