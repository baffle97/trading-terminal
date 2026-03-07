"use client";

import { useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "~/lib/trpc";
import { formatCurrency } from "~/lib/utils";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface OrderFormProps {
  tradingSymbol: string;
  ltp: number;
}

type OrderType = "MARKET" | "LIMIT" | "SL" | "SLM";
type Product = "CNC" | "MIS";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "MARKET", label: "MKT" },
  { value: "LIMIT", label: "LMT" },
  { value: "SL", label: "SL" },
  { value: "SLM", label: "SL-M" },
];

export function OrderForm({ tradingSymbol, ltp }: OrderFormProps) {
  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [product, setProduct] = useState<Product>("CNC");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(ltp);
  const [triggerPrice, setTriggerPrice] = useState(ltp);

  const utils = trpc.useUtils();
  const isBuy = transactionType === "BUY";
  const showPrice = orderType === "LIMIT" || orderType === "SL";
  const showTrigger = orderType === "SL" || orderType === "SLM";

  const placeMutation = trpc.orders.place.useMutation({
    onSuccess: (data) => {
      setQuantity(1);
      toast.success(`${transactionType} order placed for ${tradingSymbol}`, {
        description: `Order ID: ${data.growwOrderId}`,
      });
      utils.orders.list.invalidate();
    },
    onError: (err) => {
      toast.error("Order failed", { description: err.message });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    placeMutation.mutate({
      tradingSymbol,
      transactionType,
      orderType,
      product,
      quantity,
      price: showPrice ? price : undefined,
      triggerPrice: showTrigger ? triggerPrice : undefined,
    });
  }

  const effectivePrice = showPrice ? price : ltp;
  const estimatedValue = quantity * effectivePrice;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface-secondary p-4 space-y-4"
    >
      {/* BUY / SELL toggle */}
      <div className="relative flex rounded-lg bg-surface-tertiary p-1 gap-1">
        <div
          className={cn(
            "absolute inset-1 w-[calc(50%-2px)] rounded-md transition-all duration-200 ease-in-out",
            isBuy ? "translate-x-0 bg-profit" : "translate-x-full bg-loss"
          )}
        />
        {(["BUY", "SELL"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTransactionType(t)}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-colors duration-200",
              transactionType === t ? "text-white" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {t === "BUY" ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* Order type + Product */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {ORDER_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setOrderType(value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150",
                orderType === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex rounded-md bg-surface-tertiary p-0.5 gap-0.5">
          {(["CNC", "MIS"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProduct(p)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-all duration-150",
                product === p
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
          />
        </div>

        {showPrice && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-150">
            <label className="mb-1 block text-xs text-text-secondary">Price</label>
            <input
              type="number"
              step={0.05}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
            />
          </div>
        )}

        {showTrigger && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-150">
            <label className="mb-1 block text-xs text-text-secondary">Trigger Price</label>
            <input
              type="number"
              step={0.05}
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Estimated value */}
      <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
        <span className="text-text-muted">Estimated value</span>
        <span className="font-semibold text-text-primary">{formatCurrency(estimatedValue)}</span>
      </div>

      {/* Product hint */}
      <p className="text-[11px] text-text-muted">
        {product === "CNC" ? "CNC — Delivery (held in demat)" : "MIS — Intraday (auto square-off)"}
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={placeMutation.isPending}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2",
          isBuy
            ? "bg-profit hover:bg-profit/90 active:scale-[0.98]"
            : "bg-loss hover:bg-loss/90 active:scale-[0.98]"
        )}
      >
        {placeMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Placing order...
          </>
        ) : (
          <>
            {isBuy ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {transactionType} {tradingSymbol}
          </>
        )}
      </button>
    </form>
  );
}
