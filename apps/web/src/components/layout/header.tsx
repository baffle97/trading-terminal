"use client";

import { Search, Bell, Menu } from "lucide-react";
import { useState } from "react";
import { StockSearch } from "~/components/stock/stock-search";
import { isMarketOpen } from "~/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const marketOpen = isMarketOpen();

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface-secondary px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-text-muted"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search stocks...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="ml-2 hidden rounded border border-border px-1.5 py-0.5 text-xs sm:inline-block">
              /
            </kbd>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${marketOpen ? "bg-profit" : "bg-loss"}`}
            />
            <span className="hidden text-xs text-text-secondary sm:inline">
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
