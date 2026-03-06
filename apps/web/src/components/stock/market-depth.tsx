"use client";

import { formatCurrency } from "~/lib/utils";

interface DepthEntry {
  price: number;
  quantity: number;
}

interface MarketDepthProps {
  depth: {
    buy: DepthEntry[];
    sell: DepthEntry[];
  };
}

export function MarketDepthTable({ depth }: MarketDepthProps) {
  const maxRows = Math.max(depth.buy.length, depth.sell.length, 1);
  const maxQty = Math.max(
    ...depth.buy.map((e) => e.quantity),
    ...depth.sell.map((e) => e.quantity),
    1
  );

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <h3 className="mb-3 text-sm font-semibold">Market Depth</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 grid grid-cols-2 text-xs text-text-muted">
            <span>Bid</span>
            <span className="text-right">Qty</span>
          </div>
          {Array.from({ length: maxRows }).map((_, i) => {
            const entry = depth.buy[i];
            if (!entry) return <div key={`buy-${i}`} className="h-6" />;
            const pct = (entry.quantity / maxQty) * 100;
            return (
              <div key={`buy-${i}`} className="relative mb-0.5">
                <div
                  className="absolute inset-y-0 left-0 rounded-r bg-profit/10"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative grid grid-cols-2 px-1 py-0.5 text-xs">
                  <span className="font-medium text-profit">
                    {formatCurrency(entry.price)}
                  </span>
                  <span className="text-right text-text-secondary">
                    {entry.quantity.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="mb-2 grid grid-cols-2 text-xs text-text-muted">
            <span>Ask</span>
            <span className="text-right">Qty</span>
          </div>
          {Array.from({ length: maxRows }).map((_, i) => {
            const entry = depth.sell[i];
            if (!entry) return <div key={`sell-${i}`} className="h-6" />;
            const pct = (entry.quantity / maxQty) * 100;
            return (
              <div key={`sell-${i}`} className="relative mb-0.5">
                <div
                  className="absolute inset-y-0 right-0 rounded-l bg-loss/10"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative grid grid-cols-2 px-1 py-0.5 text-xs">
                  <span className="font-medium text-loss">
                    {formatCurrency(entry.price)}
                  </span>
                  <span className="text-right text-text-secondary">
                    {entry.quantity.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
