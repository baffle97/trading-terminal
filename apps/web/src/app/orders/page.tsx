"use client";

import { trpc } from "~/lib/trpc";
import { formatCurrency } from "~/lib/utils";
import { X } from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL = 5000;

export default function OrdersPage() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.list.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL,
  });

  const cancelMutation = trpc.orders.cancel.useMutation({
    onSuccess: (data) => {
      toast.success(`Order ${data.growwOrderId} cancelled`);
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Cancel failed: ${err.message}`);
    },
  });

  function handleCancel(growwOrderId: string) {
    cancelMutation.mutate({ growwOrderId });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-text-secondary">
          Your order book and history
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-16 animate-pulse rounded-xl border border-border bg-surface-secondary"
            />
          ))}
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-surface-secondary text-text-muted">
          No orders yet. Place your first order from the Market page.
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-secondary">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-muted">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isCancellable =
                  order.status === "OPEN" || order.status === "PENDING";

                return (
                  <tr
                    key={order.growwOrderId}
                    className="border-b border-border last:border-b-0 hover:bg-surface-tertiary"
                  >
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {order.tradingSymbol}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          order.transactionType === "BUY"
                            ? "bg-profit/10 text-profit"
                            : "bg-loss/10 text-loss"
                        }`}
                      >
                        {order.transactionType}
                      </span>
                      <span className="ml-1 text-xs text-text-muted">
                        {order.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.filledQuantity}/{order.quantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {order.averageFillPrice
                        ? formatCurrency(order.averageFillPrice)
                        : order.price
                          ? formatCurrency(order.price)
                          : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isCancellable && (
                        <button
                          onClick={() => handleCancel(order.growwOrderId)}
                          disabled={cancelMutation.isPending}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETE: "bg-profit/10 text-profit",
    EXECUTED: "bg-profit/10 text-profit",
    OPEN: "bg-primary/10 text-primary",
    PENDING: "bg-primary/10 text-primary",
    CANCELLED: "bg-text-muted/10 text-text-muted",
    REJECTED: "bg-loss/10 text-loss",
  };

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.OPEN}`}
    >
      {status}
    </span>
  );
}
