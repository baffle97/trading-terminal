"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc";
import { formatCurrency } from "~/lib/utils";

interface OrderFormProps {
  tradingSymbol: string;
  ltp: number;
}

export function OrderForm({ tradingSymbol, ltp }: OrderFormProps) {
  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(ltp);

  const placeMutation = trpc.orders.place.useMutation({
    onSuccess: () => {
      setQuantity(1);
      alert("Order placed successfully!");
    },
    onError: (err) => {
      alert(`Order failed: ${err.message}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    placeMutation.mutate({
      tradingSymbol,
      transactionType,
      orderType,
      quantity,
      price: orderType === "LIMIT" ? price : undefined,
    });
  }

  const estimatedValue = quantity * (orderType === "LIMIT" ? price : ltp);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface-secondary p-4"
    >
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTransactionType("BUY")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            transactionType === "BUY"
              ? "bg-profit text-white"
              : "bg-surface-tertiary text-text-secondary"
          }`}
        >
          BUY
        </button>
        <button
          type="button"
          onClick={() => setTransactionType("SELL")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            transactionType === "SELL"
              ? "bg-loss text-white"
              : "bg-surface-tertiary text-text-secondary"
          }`}
        >
          SELL
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        {(["MARKET", "LIMIT"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              orderType === type
                ? "bg-primary text-primary-foreground"
                : "bg-surface-tertiary text-text-secondary"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-text-secondary">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      {orderType === "LIMIT" && (
        <div className="mb-3">
          <label className="mb-1 block text-xs text-text-secondary">
            Price
          </label>
          <input
            type="number"
            step={0.05}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-xs text-text-secondary">
        <span>Estimated value</span>
        <span className="font-medium text-text-primary">
          {formatCurrency(estimatedValue)}
        </span>
      </div>

      <button
        type="submit"
        disabled={placeMutation.isPending}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
          transactionType === "BUY"
            ? "bg-profit hover:bg-profit/90"
            : "bg-loss hover:bg-loss/90"
        }`}
      >
        {placeMutation.isPending
          ? "Placing..."
          : `${transactionType} ${tradingSymbol}`}
      </button>
    </form>
  );
}
