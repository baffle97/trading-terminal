import { create } from "zustand";

export interface LivePrice {
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

interface MarketStore {
  prices: Record<string, LivePrice>;
  connected: boolean;
  error: string | null;

  // Internal state
  _eventSource: EventSource | null;
  _subscribedSymbols: Set<string>;
  _refCounts: Map<string, number>;
  _reconnectTimer: ReturnType<typeof setTimeout> | null;
  _reconnectAttempt: number;

  // Actions
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  _connect: () => void;
  _disconnect: () => void;
  _reconnect: () => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  prices: {},
  connected: false,
  error: null,

  _eventSource: null,
  _subscribedSymbols: new Set(),
  _refCounts: new Map(),
  _reconnectTimer: null,
  _reconnectAttempt: 0,

  subscribe: (symbols: string[]) => {
    const state = get();
    const refCounts = new Map(state._refCounts);
    let changed = false;

    for (const s of symbols) {
      const count = refCounts.get(s) ?? 0;
      refCounts.set(s, count + 1);
      if (count === 0) changed = true;
    }

    set({ _refCounts: refCounts });

    if (changed) {
      // Update subscribed symbols and reconnect with new set
      const subscribedSymbols = new Set<string>();
      for (const [sym, count] of refCounts) {
        if (count > 0) subscribedSymbols.add(sym);
      }
      set({ _subscribedSymbols: subscribedSymbols });
      get()._connect();
    }
  },

  unsubscribe: (symbols: string[]) => {
    const state = get();
    const refCounts = new Map(state._refCounts);
    let changed = false;

    for (const s of symbols) {
      const count = refCounts.get(s) ?? 0;
      if (count <= 1) {
        refCounts.delete(s);
        changed = true;
      } else {
        refCounts.set(s, count - 1);
      }
    }

    set({ _refCounts: refCounts });

    if (changed) {
      const subscribedSymbols = new Set<string>();
      for (const [sym, count] of refCounts) {
        if (count > 0) subscribedSymbols.add(sym);
      }
      set({ _subscribedSymbols: subscribedSymbols });

      if (subscribedSymbols.size === 0) {
        get()._disconnect();
      } else {
        get()._connect();
      }
    }
  },

  _connect: () => {
    const state = get();
    const symbols = [...state._subscribedSymbols];
    if (symbols.length === 0) return;

    // Close existing connection
    if (state._eventSource) {
      state._eventSource.close();
    }
    if (state._reconnectTimer) {
      clearTimeout(state._reconnectTimer);
    }

    const url = `/api/live-feed?symbols=${symbols.join(",")}`;
    const es = new EventSource(url);

    es.addEventListener("connected", () => {
      set({ connected: true, error: null, _reconnectAttempt: 0 });
    });

    es.addEventListener("tick", (event) => {
      try {
        const data = JSON.parse(event.data) as LivePrice & { symbol: string };
        const { symbol, ...tick } = data;
        set((state) => ({
          prices: { ...state.prices, [symbol]: tick },
        }));
      } catch {
        // malformed event
      }
    });

    es.onerror = () => {
      set({ connected: false, error: "Connection lost" });
      es.close();
      // Reconnect with exponential backoff
      get()._reconnect();
    };

    set({ _eventSource: es });
  },

  _disconnect: () => {
    const state = get();
    if (state._eventSource) {
      state._eventSource.close();
    }
    if (state._reconnectTimer) {
      clearTimeout(state._reconnectTimer);
    }
    set({
      _eventSource: null,
      connected: false,
      _reconnectTimer: null,
      _reconnectAttempt: 0,
    });
  },

  _reconnect: () => {
    const state = get();
    if (state._subscribedSymbols.size === 0) return;

    const attempt = state._reconnectAttempt;
    const delay = Math.min(1000 * 2 ** attempt, 30_000); // max 30s

    const timer = setTimeout(() => {
      set({ _reconnectAttempt: attempt + 1 });
      get()._connect();
    }, delay);

    set({ _reconnectTimer: timer });
  },
}));
