import { getAccessToken } from "./client";
import { getBatchLTP, getBatchOHLC } from "./market-data";

export interface TickData {
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

type TickListener = (symbol: string, tick: TickData) => void;

/**
 * Server-side live market data feed.
 *
 * Since Groww doesn't expose a public WebSocket endpoint we can connect to
 * directly, this singleton polls the Groww REST API at a fast interval (1s)
 * and fans out tick updates to all connected SSE clients.
 *
 * This is a massive improvement over the previous approach where *every*
 * browser tab independently polled via tRPC every 3-5s, because:
 *   1. Single server-side poller regardless of how many clients are connected
 *   2. Only subscribed symbols are fetched
 *   3. SSE pushes updates instantly to all clients (no per-client polling)
 *   4. Server can batch up to 50 symbols per API call
 */
class LiveFeedManager {
  private subscriptions = new Map<string, Set<TickListener>>();
  private latestTicks = new Map<string, TickData>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs = 1000;
  private isPolling = false;

  subscribe(symbols: string[], listener: TickListener): () => void {
    for (const symbol of symbols) {
      if (!this.subscriptions.has(symbol)) {
        this.subscriptions.set(symbol, new Set());
      }
      this.subscriptions.get(symbol)!.add(listener);
    }

    this.ensurePolling();

    // Send latest cached ticks immediately so client doesn't wait for next poll
    for (const symbol of symbols) {
      const cached = this.latestTicks.get(symbol);
      if (cached) {
        listener(symbol, cached);
      }
    }

    return () => {
      for (const symbol of symbols) {
        const listeners = this.subscriptions.get(symbol);
        if (listeners) {
          listeners.delete(listener);
          if (listeners.size === 0) {
            this.subscriptions.delete(symbol);
          }
        }
      }
      if (this.subscriptions.size === 0) {
        this.stopPolling();
      }
    };
  }

  getLatestTick(symbol: string): TickData | undefined {
    return this.latestTicks.get(symbol);
  }

  private ensurePolling() {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.poll(), this.pollIntervalMs);
    // Fire immediately too
    this.poll();
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const symbols = [...this.subscriptions.keys()];
      if (symbols.length === 0) {
        this.isPolling = false;
        return;
      }

      // Check auth before polling
      try {
        await getAccessToken();
      } catch {
        this.isPolling = false;
        return;
      }

      const [ltpMap, ohlcMap] = await Promise.all([
        getBatchLTP(symbols),
        getBatchOHLC(symbols),
      ]);

      const now = Date.now();

      for (const symbol of symbols) {
        const ltp = ltpMap[symbol];
        if (ltp === undefined) continue;

        const ohlc = ohlcMap[symbol];
        const close = ohlc?.close ?? ltp;
        const change = ltp - close;
        const changePercent = close > 0 ? (change / close) * 100 : 0;

        const tick: TickData = {
          ltp,
          change,
          changePercent,
          open: ohlc?.open ?? 0,
          high: ohlc?.high ?? 0,
          low: ohlc?.low ?? 0,
          close,
          timestamp: now,
        };

        const prev = this.latestTicks.get(symbol);
        // Only notify if price actually changed
        if (!prev || prev.ltp !== tick.ltp || prev.close !== tick.close) {
          this.latestTicks.set(symbol, tick);
          const listeners = this.subscriptions.get(symbol);
          if (listeners) {
            for (const listener of listeners) {
              try {
                listener(symbol, tick);
              } catch {
                // don't let one bad listener kill the feed
              }
            }
          }
        } else {
          // Update timestamp even if price didn't change
          this.latestTicks.set(symbol, { ...prev, timestamp: now });
        }
      }
    } catch {
      // Swallow errors — next poll will retry
    } finally {
      this.isPolling = false;
    }
  }
}

// Singleton — survives across SSE connections
const globalForLiveFeed = globalThis as unknown as {
  liveFeed?: LiveFeedManager;
};

export const liveFeed =
  globalForLiveFeed.liveFeed ?? new LiveFeedManager();

if (process.env.NODE_ENV !== "production") {
  globalForLiveFeed.liveFeed = liveFeed;
}
