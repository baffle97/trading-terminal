"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc";
import { StockCard } from "~/components/stock/stock-card";
import { NIFTY_50 } from "~/lib/constants";
import { Plus } from "lucide-react";

// Default watchlist uses Nifty 50 subset until user creates custom ones
const DEFAULT_WATCHLIST = [...NIFTY_50].slice(0, 8);

export default function WatchlistPage() {
  const [symbols] = useState<string[]>(DEFAULT_WATCHLIST);

  const { data: prices } = trpc.market.batchLtp.useQuery({ symbols });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-sm text-text-secondary">Track your favourite stocks</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Stock
        </button>
      </div>

      {prices && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {symbols.map((symbol) => {
            const ltp = prices[symbol];
            if (!ltp) return null;
            const change = ltp * (Math.random() - 0.45) * 0.02;
            return (
              <StockCard
                key={symbol}
                tradingSymbol={symbol}
                ltp={ltp}
                change={change}
                changePercent={(change / ltp) * 100}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
