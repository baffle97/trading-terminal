import { growwFetch } from "./client";

export interface Quote {
  tradingSymbol: string;
  exchange: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface QuotePayload {
  last_price: number;
  ohlc: { open: number; high: number; low: number; close: number } | string;
  volume: number;
  day_change: number;
  day_change_perc: number;
}

interface CandlesPayload {
  candles: [number, number, number, number, number, number][];
}

export async function getQuote(tradingSymbol: string): Promise<Quote> {
  const params = new URLSearchParams({
    exchange: "NSE",
    segment: "CASH",
    trading_symbol: tradingSymbol,
  });

  const payload = await growwFetch<QuotePayload>(
    `/v1/live-data/quote?${params}`
  );

  const ohlc = parseOHLC(payload.ohlc);

  return {
    tradingSymbol,
    exchange: "NSE",
    ltp: payload.last_price,
    open: ohlc.open,
    high: ohlc.high,
    low: ohlc.low,
    close: ohlc.close,
    volume: payload.volume,
    change: payload.day_change,
    changePercent: payload.day_change_perc,
  };
}

export async function getBatchLTP(
  symbols: string[]
): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  const BATCH_SIZE = 50;
  const result: Record<string, number> = {};

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const exchangeSymbols = batch.map((s) => `NSE_${s}`).join(",");
    const params = new URLSearchParams({
      segment: "CASH",
      exchange_symbols: exchangeSymbols,
    });

    const payload = await growwFetch<Record<string, number>>(
      `/v1/live-data/ltp?${params}`
    );

    for (const [key, value] of Object.entries(payload)) {
      const symbol = key.replace(/^(NSE|BSE)_/, "");
      result[symbol] = value;
    }
  }

  return result;
}

const TIMEFRAME_CONFIG: Record<
  string,
  { daysBack: number; intervalMinutes: number }
> = {
  "1d": { daysBack: 1, intervalMinutes: 5 },
  "1w": { daysBack: 7, intervalMinutes: 15 },
  "1m": { daysBack: 30, intervalMinutes: 60 },
  "3m": { daysBack: 90, intervalMinutes: 1440 },
  "1y": { daysBack: 365, intervalMinutes: 1440 },
  "5y": { daysBack: 1825, intervalMinutes: 10080 },
};

export async function getHistoricalCandles(
  tradingSymbol: string,
  timeframe: string
): Promise<CandleData[]> {
  const config = TIMEFRAME_CONFIG[timeframe] ?? TIMEFRAME_CONFIG["1d"];

  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - config.daysBack * 86400;

  const params = new URLSearchParams({
    exchange: "NSE",
    segment: "CASH",
    trading_symbol: tradingSymbol,
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    interval_in_minutes: config.intervalMinutes.toString(),
  });

  const payload = await growwFetch<CandlesPayload>(
    `/v1/historical/candle/range?${params}`
  );

  return (payload.candles ?? []).map(
    ([time, open, high, low, close, volume]) => ({
      time,
      open,
      high,
      low,
      close,
      volume,
    })
  );
}

function parseOHLC(value: unknown): {
  open: number;
  high: number;
  low: number;
  close: number;
} {
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, number>;
    return {
      open: obj.open ?? 0,
      high: obj.high ?? 0,
      low: obj.low ?? 0,
      close: obj.close ?? 0,
    };
  }
  if (typeof value === "string") {
    const m = value.match(
      /open:\s*([\d.]+).*high:\s*([\d.]+).*low:\s*([\d.]+).*close:\s*([\d.]+)/
    );
    if (m) {
      return {
        open: parseFloat(m[1]),
        high: parseFloat(m[2]),
        low: parseFloat(m[3]),
        close: parseFloat(m[4]),
      };
    }
  }
  return { open: 0, high: 0, low: 0, close: 0 };
}
