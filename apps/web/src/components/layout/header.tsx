"use client";

import { Search, Bell } from "lucide-react";
import { useState } from "react";
import { StockSearch } from "~/components/stock/stock-search";
import { isMarketOpen } from "~/lib/utils";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const marketOpen = isMarketOpen();

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface-secondary px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-text-muted"
          >
            <Search className="h-4 w-4" />
            <span>Search stocks...</span>
            <kbd className="ml-4 rounded border border-border px-1.5 py-0.5 text-xs">
              /
            </kbd>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${marketOpen ? "bg-profit" : "bg-loss"}`}
            />
            <span className="text-xs text-text-secondary">
              Market {marketOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      {searchOpen && <StockSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
