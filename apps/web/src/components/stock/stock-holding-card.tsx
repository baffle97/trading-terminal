"use client";

import { formatCurrency, formatPercent } from "~/lib/utils";
import type { Holding } from "~/server/groww/portfolio";

interface StockHoldingCardProps {
  holding: Holding;
}

export function StockHoldingCard({ holding }: StockHoldingCardProps) {
  const isProfitOverall = holding.pnl >= 0;
  const isProfitDay = holding.dayChange >= 0;

  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Your Position
        </h3>
        <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-xs font-medium text-text-secondary">
          {holding.quantity} {holding.quantity === 1 ? "share" : "shares"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Avg Price" value={formatCurrency(holding.averagePrice)} />
        <Metric label="Invested" value={formatCurrency(holding.invested)} />
        <Metric
          label="Current Value"
          value={formatCurrency(holding.currentValue)}
        />
        <Metric
          label="Overall P&L"
          value={`${isProfitOverall ? "+" : ""}${formatCurrency(holding.pnl)} (${formatPercent(holding.pnlPercent)})`}
          color={isProfitOverall ? "text-profit" : "text-loss"}
        />
        <Metric
          label="Day P&L"
          value={`${isProfitDay ? "+" : ""}${formatCurrency(holding.dayChange * holding.quantity)} (${formatPercent(holding.dayChangePercent)})`}
          color={isProfitDay ? "text-profit" : "text-loss"}
        />
        <Metric label="LTP" value={formatCurrency(holding.ltp)} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${color ?? "text-text-primary"}`}>
        {value}
      </p>
    </div>
  );
}
