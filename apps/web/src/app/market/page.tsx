"use client";

import { useState } from "react";
import { trpc } from "~/lib/trpc";
import { StockCard } from "~/components/stock/stock-card";
import { LineChart } from "~/components/charts/line-chart";
import { NIFTY_50, SENSEX_30 } from "~/lib/constants";
import { formatCurrency, formatPercent } from "~/lib/utils";

const POLL_INTERVAL = 5000;

type IndexTab = "NIFTY_50" | "SENSEX";

const INDEX_CONFIG: Record<
  IndexTab,
  { label: string; symbols: string[]; indexSymbol: string }
> = {
  NIFTY_50: {
    label: "Nifty 50",
    symbols: [...NIFTY_50],
    indexSymbol: "NIFTY 50",
  },
  SENSEX: {
    label: "Sensex",
    symbols: [...SENSEX_30],
    indexSymbol: "SENSEX",
  },
};

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<IndexTab>("NIFTY_50");
  const config = INDEX_CONFIG[activeTab];

  const { data: prices, isLoading } = trpc.market.batchLtp.useQuery(
    { symbols: config.symbols },
    { refetchInterval: POLL_INTERVAL }
  );

  const { data: ohlcData } = trpc.market.batchOhlc.useQuery(
    { symbols: config.symbols },
    { refetchInterval: POLL_INTERVAL }
  );

  // Index chart — uses a well-known stock from the index as proxy
  // (true index candle data would require a separate index candle endpoint)
  const indexProxy = activeTab === "NIFTY_50" ? "NIFTY 50" : "SENSEX";
  const { data: indexCandles } = trpc.market.historicalCandles.useQuery({
    tradingSymbol: indexProxy,
    timeframe: "1d",
  });

  // Compute index-level summary from constituent OHLC data
  const indexSummary = computeIndexSummary(prices, ohlcData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market</h1>
        <p className="text-sm text-text-secondary">
          Live prices and index overview
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(Object.keys(INDEX_CONFIG) as IndexTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-surface-tertiary text-text-secondary hover:text-text-primary"
            }`}
          >
            {INDEX_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* Index summary card + chart */}
      <div className="rounded-xl border border-border bg-surface-secondary p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-semibold">{config.label}</h2>
            <p className="text-xs text-text-muted">
              {config.symbols.length} constituents
            </p>
          </div>
          {indexSummary && (
            <div className="text-right">
              <p className="text-xs text-text-muted">Avg Change</p>
              <p
                className={`text-sm font-semibold ${indexSummary.avgChangePercent >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatPercent(indexSummary.avgChangePercent)}
              </p>
              <p className="text-xs text-text-muted">
                {indexSummary.advancers}A / {indexSummary.decliners}D
              </p>
            </div>
          )}
        </div>

        {indexCandles && indexCandles.length > 0 && (
          <LineChart data={indexCandles} height={180} />
        )}
      </div>

      {/* Gainers & Losers quick strip */}
      {prices && ohlcData && (
        <div className="grid gap-4 sm:grid-cols-2">
          <GainerLoserSection
            title="Top Gainers"
            prices={prices}
            ohlcData={ohlcData}
            sort="gain"
            count={5}
          />
          <GainerLoserSection
            title="Top Losers"
            prices={prices}
            ohlcData={ohlcData}
            sort="loss"
            count={5}
          />
        </div>
      )}

      {/* All stocks grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          All {config.label} Stocks
        </h2>

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
            {config.symbols.map((symbol) => {
              const ltp = prices[symbol];
              if (!ltp) return null;
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
    </div>
  );
}

function computeIndexSummary(
  prices?: Record<string, number>,
  ohlcData?: Record<string, { open: number; high: number; low: number; close: number }>
) {
  if (!prices || !ohlcData) return null;

  let totalChangePercent = 0;
  let count = 0;
  let advancers = 0;
  let decliners = 0;

  for (const [symbol, ltp] of Object.entries(prices)) {
    const ohlc = ohlcData[symbol];
    if (!ohlc) continue;
    const prevClose = ohlc.close;
    if (prevClose <= 0) continue;
    const changePct = ((ltp - prevClose) / prevClose) * 100;
    totalChangePercent += changePct;
    count++;
    if (changePct >= 0) advancers++;
    else decliners++;
  }

  return {
    avgChangePercent: count > 0 ? totalChangePercent / count : 0,
    advancers,
    decliners,
  };
}

function GainerLoserSection({
  title,
  prices,
  ohlcData,
  sort,
  count,
}: {
  title: string;
  prices: Record<string, number>;
  ohlcData: Record<string, { open: number; high: number; low: number; close: number }>;
  sort: "gain" | "loss";
  count: number;
}) {
  const entries = Object.entries(prices)
    .map(([symbol, ltp]) => {
      const prevClose = ohlcData[symbol]?.close ?? ltp;
      const change = ltp - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return { symbol, ltp, change, changePercent };
    })
    .sort((a, b) =>
      sort === "gain"
        ? b.changePercent - a.changePercent
        : a.changePercent - b.changePercent
    )
    .slice(0, count);

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <h3 className="mb-2 text-sm font-semibold text-text-secondary">
        {title}
      </h3>
      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.symbol}
            className="flex items-center justify-between text-sm"
          >
            <span className="font-medium">{e.symbol}</span>
            <div className="text-right">
              <span className="mr-2 text-xs text-text-muted">
                {formatCurrency(e.ltp)}
              </span>
              <span
                className={`text-xs font-medium ${e.changePercent >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatPercent(e.changePercent)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
