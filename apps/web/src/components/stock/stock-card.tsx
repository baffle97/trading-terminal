"use client";

import Link from "next/link";
import { formatCurrency, formatPercent } from "~/lib/utils";

interface StockCardProps {
  tradingSymbol: string;
  name?: string;
  ltp: number;
  change: number;
  changePercent: number;
}

export function StockCard({
  tradingSymbol,
  name,
  ltp,
  change,
  changePercent,
}: StockCardProps) {
  const isPositive = change >= 0;

  return (
    <Link
      href={`/market/${tradingSymbol}`}
      className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4 transition-colors hover:border-text-muted"
    >
      <div>
        <p className="text-sm font-semibold">{tradingSymbol}</p>
        {name && (
          <p className="text-xs text-text-secondary">{name}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{formatCurrency(ltp)}</p>
        <p
          className={`text-xs font-medium ${isPositive ? "text-profit" : "text-loss"}`}
        >
          {isPositive ? "+" : ""}
          {formatCurrency(change)} ({formatPercent(changePercent)})
        </p>
      </div>
    </Link>
  );
}
