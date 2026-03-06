"use client";

import { trpc } from "~/lib/trpc";
import { StockCard } from "~/components/stock/stock-card";
import { NIFTY_50 } from "~/lib/constants";

const POLL_INTERVAL = 5000;

export default function MarketPage() {
  const symbols = [...NIFTY_50];

  const { data: prices, isLoading } = trpc.market.batchLtp.useQuery(
    { symbols },
    { refetchInterval: POLL_INTERVAL }
  );

  const { data: ohlcData } = trpc.market.batchOhlc.useQuery(
    { symbols },
    { refetchInterval: POLL_INTERVAL }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market</h1>
        <p className="text-sm text-text-secondary">
          Nifty 50 stocks — live prices
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-20 animate-pulse rounded-xl border border-border bg-surface-secondary"
            />
          ))}
        </div>
      )}

      {prices && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(prices)
            .sort(([, a], [, b]) => b - a)
            .map(([symbol, ltp]) => {
              const prevClose = ohlcData?.[symbol]?.close ?? ltp;
              const change = ltp - prevClose;
              const changePercent =
                prevClose > 0 ? (change / prevClose) * 100 : 0;
              return (
                <StockCard
                  key={symbol}
                  tradingSymbol={symbol}
                  ltp={ltp}
                  change={change}
                  changePercent={changePercent}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
