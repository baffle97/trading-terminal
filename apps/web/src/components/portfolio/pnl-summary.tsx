"use client";

import { formatCurrency, formatPercent } from "~/lib/utils";

interface PnlSummaryProps {
  totalInvested: number;
  totalCurrent: number;
  overallPnl: number;
  overallPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
}

export function PnlSummary({
  totalInvested,
  totalCurrent,
  overallPnl,
  overallPnlPercent,
  dayPnl,
  dayPnlPercent,
}: PnlSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard label="Invested" value={formatCurrency(totalInvested)} />
      <SummaryCard
        label="Current Value"
        value={formatCurrency(totalCurrent)}
      />
      <SummaryCard
        label="Overall P&L"
        value={`${formatCurrency(overallPnl)} (${formatPercent(overallPnlPercent)})`}
        positive={overallPnl >= 0}
      />
      <SummaryCard
        label="Day P&L"
        value={`${formatCurrency(dayPnl)} (${formatPercent(dayPnlPercent)})`}
        positive={dayPnl >= 0}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-secondary p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          positive === undefined
            ? "text-text-primary"
            : positive
              ? "text-profit"
              : "text-loss"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
