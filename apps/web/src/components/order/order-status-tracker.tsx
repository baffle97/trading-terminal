"use client";

import {
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";
import type { TrackedOrder } from "~/hooks/use-order-tracker";

interface OrderStatusTrackerProps {
  orders: TrackedOrder[];
  onDismiss: (orderId: string) => void;
  onDismissAll: () => void;
}

export function OrderStatusTracker({
  orders,
  onDismiss,
  onDismissAll,
}: OrderStatusTrackerProps) {
  if (orders.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary">
          Order Tracking ({orders.length})
        </p>
        {orders.length > 1 && orders.every((o) => o.isTerminal) && (
          <button
            onClick={onDismissAll}
            className="text-[11px] text-text-muted hover:text-text-primary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      {orders.map((order) => (
        <OrderStatusCard key={order.growwOrderId} order={order} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function OrderStatusCard({
  order,
  onDismiss,
}: {
  order: TrackedOrder;
  onDismiss: (orderId: string) => void;
}) {
  const isBuy = order.transactionType === "BUY";

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all duration-300 animate-in slide-in-from-top-2 fade-in",
        order.isTerminal
          ? order.isSuccess
            ? "border-profit/20 bg-profit/5"
            : "border-loss/20 bg-loss/5"
          : "border-primary/20 bg-primary/5"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon order={order} />
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  isBuy ? "text-profit" : "text-loss"
                )}
              >
                {isBuy ? (
                  <TrendingUp className="mr-0.5 inline size-3" />
                ) : (
                  <TrendingDown className="mr-0.5 inline size-3" />
                )}
                {order.transactionType}
              </span>
              <span className="text-xs font-semibold text-text-primary">
                {order.tradingSymbol}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              {order.growwOrderId}
            </p>
          </div>
        </div>

        {order.isTerminal && (
          <button
            onClick={() => onDismiss(order.growwOrderId)}
            className="rounded p-0.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Status + fill info */}
      <div className="mt-2 flex items-center justify-between">
        <StatusBadge status={order.status} isTerminal={order.isTerminal} isSuccess={order.isSuccess} />
        <span className="text-xs text-text-secondary">
          {order.filledQuantity}/{order.quantity} filled
        </span>
      </div>

      {/* Fill progress bar */}
      <div className="mt-1.5">
        <div className="h-1 w-full rounded-full bg-surface-tertiary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              order.isSuccess
                ? "bg-profit"
                : order.isTerminal
                  ? "bg-loss"
                  : "bg-primary"
            )}
            style={{
              width: `${order.quantity > 0 ? (order.filledQuantity / order.quantity) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Avg fill price */}
      {order.averageFillPrice != null && order.averageFillPrice > 0 && (
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span className="text-text-muted">Avg fill price</span>
          <span className="font-medium text-text-primary">
            {formatCurrency(order.averageFillPrice)}
          </span>
        </div>
      )}

      {/* Remark for failed/rejected */}
      {order.isTerminal && !order.isSuccess && order.remark && (
        <p className="mt-1.5 text-[11px] text-loss">
          {order.remark}
        </p>
      )}
    </div>
  );
}

function StatusIcon({ order }: { order: TrackedOrder }) {
  if (!order.isTerminal) {
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-3.5 animate-spin text-primary" />
      </div>
    );
  }
  if (order.isSuccess) {
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-profit/10">
        <CheckCircle2 className="size-3.5 text-profit" />
      </div>
    );
  }
  if (order.status === "CANCELLED") {
    return (
      <div className="flex size-7 items-center justify-center rounded-full bg-text-muted/10">
        <Clock className="size-3.5 text-text-muted" />
      </div>
    );
  }
  return (
    <div className="flex size-7 items-center justify-center rounded-full bg-loss/10">
      <XCircle className="size-3.5 text-loss" />
    </div>
  );
}

function StatusBadge({
  status,
  isTerminal,
  isSuccess,
}: {
  status: string;
  isTerminal: boolean;
  isSuccess: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
        isTerminal
          ? isSuccess
            ? "bg-profit/10 text-profit"
            : status === "CANCELLED"
              ? "bg-text-muted/10 text-text-muted"
              : "bg-loss/10 text-loss"
          : "bg-primary/10 text-primary"
      )}
    >
      {!isTerminal && <Loader2 className="size-2.5 animate-spin" />}
      {status}
    </span>
  );
}
