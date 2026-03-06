"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { trpc } from "~/lib/trpc";

interface StockSearchProps {
  onClose: () => void;
}

export function StockSearch({ onClose }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results } = trpc.market.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1 }
  );

  useEffect(() => {
    inputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSelect(symbol: string) {
    router.push(`/market/${symbol}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-24">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-secondary shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks by name or symbol..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {results && results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.map((r) => (
              <li key={`${r.exchange}-${r.tradingSymbol}`}>
                <button
                  onClick={() => handleSelect(r.tradingSymbol)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-tertiary"
                >
                  <div>
                    <span className="text-sm font-medium text-text-primary">
                      {r.tradingSymbol}
                    </span>
                    <span className="ml-2 text-xs text-text-muted">
                      {r.exchange}
                    </span>
                    <p className="text-xs text-text-secondary">{r.name}</p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {r.instrumentType}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 1 && results?.length === 0 && (
          <p className="p-4 text-center text-sm text-text-muted">
            No results found
          </p>
        )}
      </div>
    </div>
  );
}
