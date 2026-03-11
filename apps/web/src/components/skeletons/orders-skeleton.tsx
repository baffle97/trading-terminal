import { Skeleton } from "~/components/ui/skeleton";

/** Table-only skeleton (no page header) for inline use */
export function OrdersTableSkeleton() {
  return (
    <Skeleton className="overflow-hidden p-0">
      {/* Table header */}
      <div className="flex border-b border-border px-4 py-3">
        {["Time", "Stock", "Type", "Qty", "Price", "Status"].map((label) => (
          <div key={label} className="flex-1">
            <div className="h-3 w-12 rounded bg-surface-tertiary" />
          </div>
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center border-b border-border px-4 py-3 last:border-b-0"
        >
          <div className="flex-1">
            <div className="h-3 w-24 rounded bg-surface-tertiary" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-20 rounded bg-surface-tertiary" />
          </div>
          <div className="flex-1">
            <div className="h-5 w-12 rounded bg-surface-tertiary" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-10 rounded bg-surface-tertiary" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-16 rounded bg-surface-tertiary" />
          </div>
          <div className="flex-1">
            <div className="h-5 w-16 rounded-full bg-surface-tertiary" />
          </div>
        </div>
      ))}
    </Skeleton>
  );
}
