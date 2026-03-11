"use client";

import { trpc } from "~/lib/trpc";
import { PnlSummary } from "~/components/portfolio/pnl-summary";
import { HoldingsTable } from "~/components/portfolio/holdings-table";
import { PortfolioSkeleton } from "~/components/skeletons/portfolio-skeleton";

export default function PortfolioPage() {
  const { data: portfolio, isLoading } = trpc.portfolio.summary.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );

  if (isLoading) {
    return <PortfolioSkeleton />;
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
