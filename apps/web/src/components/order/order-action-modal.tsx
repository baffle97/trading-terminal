"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { trpc } from "~/lib/trpc";
import { formatCurrency } from "~/lib/utils";
import { cn } from "~/lib/utils";
import type { Order } from "~/server/groww/orders";

type ModalView = "actions" | "details" | "modify" | "cancel-confirm" | "success";

interface OrderActionModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderActionModal({ order, onClose }: OrderActionModalProps) {
  const [view, setView] = useState<ModalView>("actions");
  const [successMessage, setSuccessMessage] = useState("");

  const isCancellable = order.status === "OPEN" || order.status === "PENDING";
  const isModifiable = isCancellable;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-0 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {view !== "actions" && view !== "success" && (
              <button
                onClick={() => setView("actions")}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div>
              <h2 className="text-base font-semibold">{order.tradingSymbol}</h2>
              <p className="text-xs text-text-muted">
                {order.transactionType} · {order.orderType} · {order.growwOrderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {view === "actions" && (
            <ActionsView
              isModifiable={isModifiable}
              isCancellable={isCancellable}
              onModify={() => setView("modify")}
              onCancel={() => setView("cancel-confirm")}
              onDetails={() => setView("details")}
            />
          )}
          {view === "details" && <DetailsView order={order} />}
          {view === "modify" && (
            <ModifyView
              order={order}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setView("success");
              }}
            />
          )}
          {view === "cancel-confirm" && (
            <CancelConfirmView
              order={order}
              onBack={() => setView("actions")}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setView("success");
              }}
            />
          )}
          {view === "success" && (
            <SuccessView message={successMessage} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Actions View ─── */

function ActionsView({
  isModifiable,
  isCancellable,
  onModify,
  onCancel,
  onDetails,
}: {
  isModifiable: boolean;
  isCancellable: boolean;
  onModify: () => void;
  onCancel: () => void;
  onDetails: () => void;
}) {
  return (
    <div className="space-y-2">
      {isModifiable && (
        <button
          onClick={onModify}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-surface-tertiary active:scale-[0.99]"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Pencil className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Modify Order</p>
            <p className="text-xs text-text-muted">Change price, quantity or order type</p>
          </div>
        </button>
      )}

      {isCancellable && (
        <button
          onClick={onCancel}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-loss/5 active:scale-[0.99]"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-loss/10 text-loss">
            <Trash2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-loss">Cancel Order</p>
            <p className="text-xs text-text-muted">Cancel this pending order</p>
          </div>
        </button>
      )}

      <button
        onClick={onDetails}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-surface-tertiary active:scale-[0.99]"
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-surface-tertiary text-text-secondary">
          <Eye className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">View Details</p>
          <p className="text-xs text-text-muted">See full order information</p>
        </div>
      </button>
    </div>
  );
}

/* ─── Details View ─── */

function DetailsView({ order }: { order: Order }) {
  const rows: [string, string | number | null][] = [
    ["Order ID", order.growwOrderId],
    ["Symbol", order.tradingSymbol],
    ["Exchange", order.exchange],
    ["Segment", order.segment],
    ["Transaction", order.transactionType],
    ["Order Type", order.orderType],
    ["Product", order.product],
    ["Status", order.status],
    ["Quantity", `${order.filledQuantity}/${order.quantity}`],
    ["Price", order.price != null ? formatCurrency(order.price) : "-"],
    ["Trigger Price", order.triggerPrice != null ? formatCurrency(order.triggerPrice) : "-"],
    ["Avg Fill Price", order.averageFillPrice != null ? formatCurrency(order.averageFillPrice) : "-"],
    ["Validity", order.validity],
    ["Placed At", new Date(order.createdAt).toLocaleString("en-IN")],
    ["Remark", order.remark],
  ];

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm odd:bg-surface-tertiary/50"
        >
          <span className="text-text-muted">{label}</span>
          <span className="font-medium text-text-primary">{value ?? "-"}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Modify View ─── */

type OrderType = "MARKET" | "LIMIT" | "SL" | "SLM";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "MARKET", label: "MKT" },
  { value: "LIMIT", label: "LMT" },
  { value: "SL", label: "SL" },
  { value: "SLM", label: "SL-M" },
];

function ModifyView({
  order,
  onSuccess,
}: {
  order: Order;
  onSuccess: (msg: string) => void;
}) {
  const [orderType, setOrderType] = useState<OrderType>(order.orderType as OrderType);
  const [quantity, setQuantity] = useState(order.quantity);
  const [price, setPrice] = useState(order.price ?? 0);
  const [triggerPrice, setTriggerPrice] = useState(order.triggerPrice ?? 0);

  const utils = trpc.useUtils();

  const showPrice = orderType === "LIMIT" || orderType === "SL";
  const showTrigger = orderType === "SL" || orderType === "SLM";

  const modifyMutation = trpc.orders.modify.useMutation({
    onSuccess: (data) => {
      utils.orders.list.invalidate();
      onSuccess(`Order ${data.growwOrderId} modified successfully`);
    },
  });

  function handleModify(e: React.FormEvent) {
    e.preventDefault();
    modifyMutation.mutate({
      growwOrderId: order.growwOrderId,
      orderType,
      quantity,
      price: showPrice ? price : undefined,
      triggerPrice: showTrigger ? triggerPrice : undefined,
    });
  }

  return (
    <form onSubmit={handleModify} className="space-y-4">
      {/* Order type selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">Order Type</label>
        <div className="flex gap-1">
          {ORDER_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOrderType(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
                orderType === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-secondary">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Price */}
      {showPrice && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Price</label>
          <input
            type="number"
            step={0.05}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>
      )}

      {/* Trigger price */}
      {showTrigger && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Trigger Price</label>
          <input
            type="number"
            step={0.05}
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>
      )}

      {/* Error */}
      {modifyMutation.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-loss/10 px-3 py-2 text-xs text-loss">
          <AlertTriangle className="size-3.5 shrink-0" />
          {modifyMutation.error.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={modifyMutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
      >
        {modifyMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Modifying...
          </>
        ) : (
          "Confirm Modification"
        )}
      </button>
    </form>
  );
}

/* ─── Cancel Confirm View ─── */

function CancelConfirmView({
  order,
  onBack,
  onSuccess,
}: {
  order: Order;
  onBack: () => void;
  onSuccess: (msg: string) => void;
}) {
  const utils = trpc.useUtils();

  const cancelMutation = trpc.orders.cancel.useMutation({
    onSuccess: (data) => {
      utils.orders.list.invalidate();
      onSuccess(`Order ${data.growwOrderId} cancelled successfully`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-loss/10">
          <AlertTriangle className="size-6 text-loss" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Cancel this order?</p>
          <p className="mt-1 text-xs text-text-muted">
            {order.transactionType} {order.quantity} x {order.tradingSymbol}{" "}
            {order.price != null ? `@ ${formatCurrency(order.price)}` : "(Market)"}
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-lg bg-surface-tertiary px-4 py-3 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-text-muted">Order ID</span>
          <span className="font-medium">{order.growwOrderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Type</span>
          <span className="font-medium">{order.orderType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Filled</span>
          <span className="font-medium">{order.filledQuantity}/{order.quantity}</span>
        </div>
      </div>

      {/* Error */}
      {cancelMutation.isError && (
        <div className="flex items-center gap-2 rounded-lg bg-loss/10 px-3 py-2 text-xs text-loss">
          <AlertTriangle className="size-3.5 shrink-0" />
          {cancelMutation.error.message}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={cancelMutation.isPending}
          className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-60"
        >
          Go Back
        </button>
        <button
          onClick={() => cancelMutation.mutate({ growwOrderId: order.growwOrderId })}
          disabled={cancelMutation.isPending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-loss py-2.5 text-sm font-semibold text-white transition-all hover:bg-loss/90 active:scale-[0.98] disabled:opacity-60"
        >
          {cancelMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Cancelling...
            </>
          ) : (
            "Yes, Cancel"
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Success View ─── */

function SuccessView({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-50 fade-in duration-300">
      <div className="flex size-14 items-center justify-center rounded-full bg-profit/10">
        <CheckCircle2 className="size-7 text-profit" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">Success</p>
        <p className="mt-1 text-xs text-text-muted">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  );
}
