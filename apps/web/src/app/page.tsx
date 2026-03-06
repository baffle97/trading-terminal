"use client";

import { trpc } from "~/lib/trpc";
import { StockCard } from "~/components/stock/stock-card";
import { PnlSummary } from "~/components/portfolio/pnl-summary";
import { NIFTY_50 } from "~/lib/constants";
import { formatCurrency } from "~/lib/utils";

const TOP_STOCKS = [...NIFTY_50].slice(0, 10);
const POLL_INTERVAL = 5000;

export default function DashboardPage() {
  const { data: portfolio } = trpc.portfolio.summary.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL,
  });
  const { data: margin } = trpc.portfolio.margin.useQuery();
  const { data: prices } = trpc.market.batchLtp.useQuery(
    { symbols: TOP_STOCKS },
    { refetchInterval: POLL_INTERVAL }
  );
  const { data: ohlcData } = trpc.market.batchOhlc.useQuery(
    { symbols: TOP_STOCKS },
    { refetchInterval: POLL_INTERVAL }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-text-secondary">
          Overview of your trading activity
        </p>
      </div>

      {portfolio && (
        <PnlSummary
          totalInvested={portfolio.totalInvested}
          totalCurrent={portfolio.totalCurrent}
          overallPnl={portfolio.overallPnl}
          overallPnlPercent={portfolio.overallPnlPercent}
          dayPnl={portfolio.dayPnl}
          dayPnlPercent={portfolio.dayPnlPercent}
        />
      )}

      {margin && (
        <div className="rounded-xl border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-muted">Available Margin</p>
          <p className="mt-1 text-lg font-semibold text-text-primary">
            {formatCurrency(margin.availableMargin)}
          </p>
          <p className="text-xs text-text-secondary">
            Used: {formatCurrency(margin.usedMargin)} / Total:{" "}
            {formatCurrency(margin.totalMargin)}
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Top Stocks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prices &&
            Object.entries(prices).map(([symbol, ltp]) => {
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
      </div>
    </div>
  );
}
