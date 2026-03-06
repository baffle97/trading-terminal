import { create } from "zustand";

interface LivePrice {
  ltp: number;
  change: number;
  changePercent: number;
  updatedAt: number;
}

interface MarketStore {
  prices: Record<string, LivePrice>;
  setPrice: (symbol: string, price: LivePrice) => void;
  setPrices: (prices: Record<string, LivePrice>) => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  prices: {},
  setPrice: (symbol, price) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: price },
    })),
  setPrices: (prices) =>
    set((state) => ({
      prices: { ...state.prices, ...prices },
    })),
}));
