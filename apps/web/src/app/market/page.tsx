"use client";

import { useState } from "react";
import { Briefcase, TrendingUp, TrendingDown, IndianRupee, BarChart3 } from "lucide-react";
import { trpc } from "~/lib/trpc";
import { StockCard } from "~/components/stock/stock-card";
import { LineChart } from "~/components/charts/line-chart";
import { MarketSkeleton } from "~/components/skeletons/market-skeleton";
import { StockCardSkeleton } from "~/components/skeletons/dashboard-skeleton";
import { NIFTY_50, SENSEX_30 } from "~/lib/constants";
import { formatCurrency, formatPercent } from "~/lib/utils";
import { cn } from "~/lib/utils";
import { useLivePrices } from "~/hooks/use-live-prices";

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

  const livePrices = useLivePrices(config.symbols);
  const hasLivePrices = Object.keys(livePrices).length > 0;

  // Index chart
  const indexProxy = activeTab === "NIFTY_50" ? "NIFTY 50" : "SENSEX";
  const { data: indexCandles } = trpc.market.historicalCandles.useQuery({
    tradingSymbol: indexProxy,
    timeframe: "1d",
  });

  // Portfolio summary (infrequent refresh is fine)
  const { data: portfolio } = trpc.portfolio.summary.useQuery(undefined, {
    staleTime: 30_000,
  });

  // Compute index-level summary from live data
  const indexSummary = computeIndexSummary(livePrices);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market</h1>
        <p className="text-sm text-text-secondary">
          Live prices and index overview
        </p>
      </div>

      {portfolio && <PortfolioSummaryCard portfolio={portfolio} />}

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
      {hasLivePrices && (
        <div className="grid gap-4 sm:grid-cols-2">
          <GainerLoserSection
            title="Top Gainers"
            livePrices={livePrices}
            sort="gain"
            count={5}
          />
          <GainerLoserSection
            title="Top Losers"
            livePrices={livePrices}
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

        {!hasLivePrices && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <StockCardSkeleton key={i} />
            ))}
          </div>
        )}

        {hasLivePrices && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.symbols.map((symbol) => {
              const tick = livePrices[symbol];
              if (!tick) return null;
              return (
                <StockCard
                  key={symbol}
                  tradingSymbol={symbol}
                  ltp={tick.ltp}
                  change={tick.change}
                  changePercent={tick.changePercent}
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
  livePrices: Record<string, { ltp: number; changePercent: number }>
) {
  const entries = Object.values(livePrices);
  if (entries.length === 0) return null;

  let totalChangePercent = 0;
  let advancers = 0;
  let decliners = 0;

  for (const tick of entries) {
    totalChangePercent += tick.changePercent;
    if (tick.changePercent >= 0) advancers++;
    else decliners++;
  }

  return {
    avgChangePercent: totalChangePercent / entries.length,
    advancers,
    decliners,
  };
}

function PortfolioSummaryCard({
  portfolio,
}: {
  portfolio: {
    totalInvested: number;
    totalCurrent: number;
    overallPnl: number;
    overallPnlPercent: number;
    dayPnl: number;
    dayPnlPercent: number;
    holdings: unknown[];
  };
}) {
  const isPositive = portfolio.overallPnl >= 0;
  const isDayPositive = portfolio.dayPnl >= 0;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="size-4 text-text-muted" />
        <h2 className="text-sm font-semibold">Your Portfolio</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-surface px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <IndianRupee className="size-3" />
            Invested
          </div>
          <p className="mt-0.5 text-sm font-semibold">
            {formatCurrency(portfolio.totalInvested)}
          </p>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <BarChart3 className="size-3" />
            Current
          </div>
          <p className="mt-0.5 text-sm font-semibold">
            {formatCurrency(portfolio.totalCurrent)}
          </p>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            {isPositive ? (
              <TrendingUp className="size-3 text-profit" />
            ) : (
              <TrendingDown className="size-3 text-loss" />
            )}
            Overall P&L
          </div>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold",
              isPositive ? "text-profit" : "text-loss"
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(portfolio.overallPnl)} ({formatPercent(portfolio.overallPnlPercent)})
          </p>
        </div>
        <div className="rounded-lg bg-surface px-3 py-2">
          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <Briefcase className="size-3" />
            Holdings
          </div>
          <p className="mt-0.5 text-sm font-semibold">
            {portfolio.holdings.length} stocks
          </p>
          <p
            className={cn(
              "text-[11px] font-medium",
              isDayPositive ? "text-profit" : "text-loss"
            )}
          >
            Today: {isDayPositive ? "+" : ""}{formatCurrency(portfolio.dayPnl)}
          </p>
        </div>
      </div>
    </div>
  );
}

function GainerLoserSection({
  title,
  livePrices,
  sort,
  count,
}: {
  title: string;
  livePrices: Record<string, { ltp: number; change: number; changePercent: number }>;
  sort: "gain" | "loss";
  count: number;
}) {
  const entries = Object.entries(livePrices)
    .map(([symbol, tick]) => ({
      symbol,
      ltp: tick.ltp,
      change: tick.change,
      changePercent: tick.changePercent,
    }))
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
