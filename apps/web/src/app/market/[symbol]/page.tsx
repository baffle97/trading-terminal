"use client";

import { use, useState } from "react";
import { trpc } from "~/lib/trpc";
import { CandlestickChart } from "~/components/charts/candlestick-chart";
import { OrderForm } from "~/components/order/order-form";
import { MarketDepthTable } from "~/components/stock/market-depth";
import { StockHoldingCard } from "~/components/stock/stock-holding-card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import { CHART_TIMEFRAMES } from "~/lib/constants";

const POLL_INTERVAL = 3000;

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const [timeframe, setTimeframe] = useState("1d");

  const { data: quote } = trpc.market.quote.useQuery(
    { tradingSymbol: symbol },
    { refetchInterval: POLL_INTERVAL }
  );

  const { data: candles } = trpc.market.historicalCandles.useQuery({
    tradingSymbol: symbol,
    timeframe,
  });

  const { data: holdings } = trpc.portfolio.holdings.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL,
  });
  const stockHolding = holdings?.find((h) => h.tradingSymbol === symbol);

  if (!quote) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Loading {symbol}...
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{symbol}</h1>
          <p className="text-sm text-text-secondary">NSE - Equity</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {formatCurrency(quote.ltp)}
            </span>
            <span
              className={`text-lg font-medium ${isPositive ? "text-profit" : "text-loss"}`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(quote.change)} (
              {formatPercent(quote.changePercent)})
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex gap-2">
            {CHART_TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeframe === tf.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {candles && candles.length > 0 ? (
            <CandlestickChart data={candles} />
          ) : candles && candles.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-muted">
              Chart data unavailable for this timeframe
            </div>
          ) : null}

          {stockHolding && <StockHoldingCard holding={stockHolding} />}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoItem label="Open" value={formatCurrency(quote.open)} />
            <InfoItem label="High" value={formatCurrency(quote.high)} />
            <InfoItem label="Low" value={formatCurrency(quote.low)} />
            <InfoItem label="Prev Close" value={formatCurrency(quote.close)} />
            <InfoItem
              label="Volume"
              value={quote.volume.toLocaleString("en-IN")}
            />
            <InfoItem
              label="Avg Price"
              value={formatCurrency(quote.averagePrice)}
            />
            <InfoItem
              label="Upper Circuit"
              value={formatCurrency(quote.upperCircuit)}
            />
            <InfoItem
              label="Lower Circuit"
              value={formatCurrency(quote.lowerCircuit)}
            />
          </div>

          {(quote.depth.buy.length > 0 || quote.depth.sell.length > 0) && (
            <MarketDepthTable depth={quote.depth} />
          )}
        </div>

        <OrderForm tradingSymbol={symbol} ltp={quote.ltp} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-secondary p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
