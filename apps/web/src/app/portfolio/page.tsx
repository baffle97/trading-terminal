"use client";

import { trpc } from "~/lib/trpc";
import { PnlSummary } from "~/components/portfolio/pnl-summary";
import { HoldingsTable } from "~/components/portfolio/holdings-table";

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = trpc.portfolio.summary.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-20 animate-pulse rounded-xl border border-border bg-surface-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-sm text-text-secondary">
          Holdings and P&L overview
        </p>
      </div>

      <PnlSummary
        totalInvested={portfolio.totalInvested}
        totalCurrent={portfolio.totalCurrent}
        overallPnl={portfolio.overallPnl}
        overallPnlPercent={portfolio.overallPnlPercent}
        dayPnl={portfolio.dayPnl}
        dayPnlPercent={portfolio.dayPnlPercent}
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Holdings ({portfolio.holdings.length})
        </h2>
        <HoldingsTable holdings={portfolio.holdings} />
      </div>
    </div>
  );
}
