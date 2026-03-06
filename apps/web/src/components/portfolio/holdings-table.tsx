"use client";

import Link from "next/link";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { Holding } from "~/server/groww/portfolio";

interface HoldingsTableProps {
  holdings: Holding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-secondary">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-text-muted">
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3 text-right">Qty</th>
            <th className="px-4 py-3 text-right">Avg Price</th>
            <th className="px-4 py-3 text-right">LTP</th>
            <th className="px-4 py-3 text-right">Current Value</th>
            <th className="px-4 py-3 text-right">P&L</th>
            <th className="px-4 py-3 text-right">Day Change</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr
              key={h.tradingSymbol}
              className="border-b border-border last:border-b-0 hover:bg-surface-tertiary"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/market/${h.tradingSymbol}`}
                  className="font-medium text-primary hover:underline"
                >
                  {h.tradingSymbol}
                </Link>
                <span className="ml-1 text-xs text-text-muted">
                  {h.exchange}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{h.quantity}</td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(h.averagePrice)}
              </td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(h.ltp)}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(h.currentValue)}
              </td>
              <td
                className={`px-4 py-3 text-right font-medium ${h.pnl >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatCurrency(h.pnl)}
                <span className="ml-1 text-xs">
                  ({formatPercent(h.pnlPercent)})
                </span>
              </td>
              <td
                className={`px-4 py-3 text-right text-xs ${h.dayChange >= 0 ? "text-profit" : "text-loss"}`}
              >
                {formatPercent(h.dayChangePercent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
