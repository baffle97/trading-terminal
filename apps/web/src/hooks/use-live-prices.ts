"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMarketStore, type LivePrice } from "~/stores/market";

/**
 * Subscribe to live price updates for a list of symbols.
 *
 * Returns a map of symbol → LivePrice that updates in real-time via SSE.
 * Automatically subscribes on mount and unsubscribes on unmount.
 * Multiple components subscribing to the same symbol share one SSE connection.
 */
export function useLivePrices(symbols: string[]): Record<string, LivePrice> {
  const subscribe = useMarketStore((s) => s.subscribe);
  const unsubscribe = useMarketStore((s) => s.unsubscribe);
  const allPrices = useMarketStore((s) => s.prices);

  // Stable reference for the symbols array to avoid re-subscribing on every render
  const symbolsKey = symbols.join(",");
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  useEffect(() => {
    const syms = symbolsKey.split(",").filter(Boolean);
    if (syms.length === 0) return;

    subscribe(syms);
    return () => unsubscribe(syms);
  }, [symbolsKey, subscribe, unsubscribe]);

  // Return only the prices for requested symbols
  return useMemo(() => {
    const result: Record<string, LivePrice> = {};
    for (const symbol of symbolsRef.current) {
      if (allPrices[symbol]) {
        result[symbol] = allPrices[symbol];
      }
    }
    return result;
  }, [allPrices]);
}

/**
 * Subscribe to a single symbol's live price.
 * Convenience wrapper around useLivePrices.
 */
export function useLivePrice(symbol: string): LivePrice | undefined {
  const prices = useLivePrices([symbol]);
  return prices[symbol];
}
