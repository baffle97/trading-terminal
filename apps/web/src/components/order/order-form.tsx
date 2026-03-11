"use client";

import { useState, useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Wallet, Package } from "lucide-react";
import { trpc } from "~/lib/trpc";
import { formatCurrency } from "~/lib/utils";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

interface OrderFormProps {
  tradingSymbol: string;
  ltp: number;
  onOrderPlaced?: (orderId: string, tradingSymbol: string, transactionType: string, quantity: number) => void;
}

type OrderType = "MARKET" | "LIMIT" | "SL" | "SLM";
type Product = "CNC" | "MIS";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "MARKET", label: "MKT" },
  { value: "LIMIT", label: "LMT" },
  { value: "SL", label: "SL" },
  { value: "SLM", label: "SL-M" },
];

export function OrderForm({ tradingSymbol, ltp, onOrderPlaced }: OrderFormProps) {
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
  const effectivePrice = showPrice ? price : ltp;
  const estimatedValue = quantity * effectivePrice;

  // --- Holdings context for SELL ---
  const { data: holdings } = trpc.portfolio.holdings.useQuery(undefined, {
    staleTime: 30_000,
    enabled: !isBuy,
  });

  const currentHolding = useMemo(() => {
    if (!holdings) return null;
    return holdings.find((h) => h.tradingSymbol === tradingSymbol) ?? null;
  }, [holdings, tradingSymbol]);

  const holdingQty = currentHolding?.quantity ?? 0;
  const exceedsHolding = !isBuy && product === "CNC" && quantity > holdingQty;

  // --- Margin queries ---
  const { data: userMargin } = trpc.portfolio.margin.useQuery(undefined, {
    staleTime: 30_000,
  });

  const marginQueryInput = useMemo(
    () => ({
      tradingSymbol,
      transactionType,
      quantity,
      price: effectivePrice,
      orderType,
      product,
    }),
    [tradingSymbol, transactionType, quantity, effectivePrice, orderType, product]
  );

  const {
    data: requiredMargin,
    isFetching: isMarginLoading,
  } = trpc.orders.requiredMargin.useQuery(marginQueryInput, {
    enabled: quantity > 0 && effectivePrice > 0,
    staleTime: 5_000,
    retry: false,
  });

  const availableBalance = userMargin
    ? product === "CNC"
      ? userMargin.cncBalanceAvailable
      : userMargin.misBalanceAvailable
    : null;

  const marginRequired = requiredMargin
    ? product === "CNC"
      ? requiredMargin.cncMarginRequired
      : requiredMargin.misMarginRequired
    : null;

  const hasSufficientMargin =
    availableBalance != null && marginRequired != null
      ? availableBalance >= marginRequired
      : true; // default to true while loading

  // --- Place order ---
  const placeMutation = trpc.orders.place.useMutation({
    onSuccess: (data) => {
      const qty = quantity;
      const txnType = transactionType;
      setQuantity(1);
      toast.success(`${txnType} order placed for ${tradingSymbol}`, {
        description: `Order ID: ${data.growwOrderId} — tracking status...`,
      });
      utils.orders.list.invalidate();
      utils.portfolio.margin.invalidate();
      onOrderPlaced?.(data.growwOrderId, tradingSymbol, txnType, qty);
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

      {/* Holdings info for SELL */}
      {!isBuy && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          <div
            className={cn(
              "rounded-lg border px-3 py-2.5 transition-colors duration-200",
              holdingQty > 0
                ? exceedsHolding
                  ? "border-loss/20 bg-loss/5"
                  : "border-border bg-surface"
                : "border-loss/20 bg-loss/5"
            )}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-text-muted">
                <Package className="size-3" />
                Holdings ({tradingSymbol})
              </span>
              <span className="font-semibold text-text-primary">
                {holdingQty > 0 ? `${holdingQty} shares` : "No holdings"}
              </span>
            </div>
            {currentHolding && holdingQty > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-text-muted">Avg price</span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(currentHolding.averagePrice)}
                </span>
              </div>
            )}
            {currentHolding && holdingQty > 0 && (
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-text-muted">P&L</span>
                <span
                  className={cn(
                    "font-medium",
                    currentHolding.pnl >= 0 ? "text-profit" : "text-loss"
                  )}
                >
                  {formatCurrency(currentHolding.pnl)} ({currentHolding.pnlPercent.toFixed(2)}%)
                </span>
              </div>
            )}
            {exceedsHolding && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-loss font-medium">
                <AlertTriangle className="size-3" />
                Quantity exceeds holdings ({holdingQty} available)
              </p>
            )}
            {holdingQty > 0 && product === "CNC" && (
              <button
                type="button"
                onClick={() => setQuantity(holdingQty)}
                className="mt-1.5 text-[11px] font-medium text-primary hover:underline"
              >
                Sell all {holdingQty} shares
              </button>
            )}
          </div>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-text-secondary">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className={cn(
              "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-primary",
              exceedsHolding ? "border-loss" : "border-border"
            )}
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

      {/* Margin section */}
      <MarginIndicator
        availableBalance={availableBalance}
        marginRequired={marginRequired}
        brokerageAndCharges={requiredMargin?.brokerageAndCharges ?? null}
        hasSufficientMargin={hasSufficientMargin}
        isLoading={isMarginLoading}
        product={product}
      />

      {/* Product hint */}
      <p className="text-[11px] text-text-muted">
        {product === "CNC" ? "CNC — Delivery (held in demat)" : "MIS — Intraday (auto square-off)"}
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={placeMutation.isPending || !hasSufficientMargin || exceedsHolding}
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
        ) : exceedsHolding ? (
          <>
            <AlertTriangle className="size-4" />
            Exceeds holdings
          </>
        ) : !hasSufficientMargin ? (
          <>
            <AlertTriangle className="size-4" />
            Insufficient margin
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

/* ─── Margin Indicator ─── */

function MarginIndicator({
  availableBalance,
  marginRequired,
  brokerageAndCharges,
  hasSufficientMargin,
  isLoading,
  product,
}: {
  availableBalance: number | null;
  marginRequired: number | null;
  brokerageAndCharges: number | null;
  hasSufficientMargin: boolean;
  isLoading: boolean;
  product: Product;
}) {
  if (availableBalance == null && marginRequired == null && !isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 space-y-2 transition-colors duration-200",
        isLoading
          ? "border-border bg-surface"
          : hasSufficientMargin
            ? "border-profit/20 bg-profit/5"
            : "border-loss/20 bg-loss/5"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium">
        {isLoading ? (
          <>
            <Loader2 className="size-3 animate-spin text-text-muted" />
            <span className="text-text-muted">Checking margin...</span>
          </>
        ) : hasSufficientMargin ? (
          <>
            <CheckCircle2 className="size-3 text-profit" />
            <span className="text-profit">Margin available</span>
          </>
        ) : (
          <>
            <AlertTriangle className="size-3 text-loss" />
            <span className="text-loss">Insufficient margin</span>
          </>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">
            <Wallet className="mr-1 inline size-3" />
            Available ({product})
          </span>
          <span className="font-medium text-text-primary">
            {availableBalance != null ? formatCurrency(availableBalance) : "—"}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-muted">Required margin</span>
          <span className="font-medium text-text-primary">
            {marginRequired != null ? formatCurrency(marginRequired) : "—"}
          </span>
        </div>
        {brokerageAndCharges != null && brokerageAndCharges > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Brokerage & charges</span>
            <span className="font-medium text-text-primary">
              {formatCurrency(brokerageAndCharges)}
            </span>
          </div>
        )}
      </div>

      {/* Margin usage bar */}
      {availableBalance != null && marginRequired != null && availableBalance > 0 && (
        <div className="pt-0.5">
          <div className="h-1.5 w-full rounded-full bg-surface-tertiary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                hasSufficientMargin ? "bg-profit" : "bg-loss"
              )}
              style={{
                width: `${Math.min(100, (marginRequired / availableBalance) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>{Math.round((marginRequired / availableBalance) * 100)}% of available</span>
            {!hasSufficientMargin && (
              <span className="text-loss font-medium">
                Short by {formatCurrency(marginRequired - availableBalance)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
