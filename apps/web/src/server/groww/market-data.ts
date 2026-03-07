import { growwFetch } from "./client";
import { createServiceClient } from "~/lib/supabase";

export interface DepthEntry {
  price: number;
  quantity: number;
}

export interface MarketDepth {
  buy: DepthEntry[];
  sell: DepthEntry[];
}

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
  averagePrice: number;
  bidPrice: number;
  bidQuantity: number;
  askPrice: number;
  askQuantity: number;
  upperCircuit: number;
  lowerCircuit: number;
  depth: MarketDepth;
}

export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionContract {
  tradingSymbol: string;
  ltp: number;
  openInterest: number;
  volume: number;
  greeks?: Greeks;
}

export interface OptionStrike {
  CE?: OptionContract;
  PE?: OptionContract;
}

export interface OptionChain {
  underlyingLtp: number;
  strikes: Record<string, OptionStrike>;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  iv: number;
}

// --- Payload types from Groww API ---

interface QuotePayload {
  average_price?: number;
  last_price: number;
  bid_quantity?: number;
  bid_price?: number;
  ask_quantity?: number;
  ask_price?: number;
  day_change: number;
  day_change_perc: number;
  upper_circuit_limit?: number;
  lower_circuit_limit?: number;
  ohlc: { open: number; high: number; low: number; close: number } | string;
  volume: number;
  depth?: {
    buy?: { price: number; quantity: number }[];
    sell?: { price: number; quantity: number }[];
  };
}

interface OHLCPayload {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlesPayload {
  candles: [number, number, number, number, number, number][];
}

interface OptionChainPayload {
  underlying_ltp: number;
  strikes: Record<
    string,
    {
      CE?: {
        trading_symbol: string;
        ltp: number;
        open_interest: number;
        volume: number;
        greeks?: {
          delta: number;
          gamma: number;
          theta: number;
          vega: number;
          rho: number;
          iv: number;
        };
      };
      PE?: {
        trading_symbol: string;
        ltp: number;
        open_interest: number;
        volume: number;
        greeks?: {
          delta: number;
          gamma: number;
          theta: number;
          vega: number;
          rho: number;
          iv: number;
        };
      };
    }
  >;
}

interface GreeksPayload {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  iv: number;
}

// --- API Functions ---

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
  const buyDepth = (payload.depth?.buy ?? []).map((e) => ({
    price: e.price,
    quantity: e.quantity,
  }));
  const sellDepth = (payload.depth?.sell ?? []).map((e) => ({
    price: e.price,
    quantity: e.quantity,
  }));

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
    averagePrice: payload.average_price ?? 0,
    bidPrice: payload.bid_price ?? 0,
    bidQuantity: payload.bid_quantity ?? 0,
    askPrice: payload.ask_price ?? 0,
    askQuantity: payload.ask_quantity ?? 0,
    upperCircuit: payload.upper_circuit_limit ?? 0,
    lowerCircuit: payload.lower_circuit_limit ?? 0,
    depth: { buy: buyDepth, sell: sellDepth },
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

export async function getBatchOHLC(
  symbols: string[]
): Promise<Record<string, OHLCData>> {
  if (symbols.length === 0) return {};

  const BATCH_SIZE = 50;
  const result: Record<string, OHLCData> = {};

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const exchangeSymbols = batch.map((s) => `NSE_${s}`).join(",");
    const params = new URLSearchParams({
      segment: "CASH",
      exchange_symbols: exchangeSymbols,
    });

    const payload = await growwFetch<Record<string, OHLCPayload>>(
      `/v1/live-data/ohlc?${params}`
    );

    for (const [key, value] of Object.entries(payload)) {
      const symbol = key.replace(/^(NSE|BSE)_/, "");
      result[symbol] = {
        open: value.open,
        high: value.high,
        low: value.low,
        close: value.close,
      };
    }
  }

  return result;
}

const TIMEFRAME_CONFIG: Record<
  string,
  { daysBack: number; candleInterval: string }
> = {
  "1d": { daysBack: 1, candleInterval: "5minute" },
  "1w": { daysBack: 7, candleInterval: "15minute" },
  "1m": { daysBack: 30, candleInterval: "1hour" },
  "3m": { daysBack: 90, candleInterval: "1day" },
  "1y": { daysBack: 180, candleInterval: "1day" },
  "5y": { daysBack: 180, candleInterval: "1month" },
};

async function resolveGrowwSymbol(tradingSymbol: string): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("instruments")
    .select("groww_symbol")
    .eq("trading_symbol", tradingSymbol)
    .eq("segment", "CASH")
    .limit(1)
    .single();

  return data?.groww_symbol ?? tradingSymbol;
}

interface NewCandlesPayload {
  candles: [string, number, number, number, number, number, number | null][];
  closing_price?: number;
  start_time?: string;
  end_time?: string;
  interval_in_minutes?: number;
}

export async function getHistoricalCandles(
  tradingSymbol: string,
  timeframe: string
): Promise<CandleData[]> {
  const config = TIMEFRAME_CONFIG[timeframe] ?? TIMEFRAME_CONFIG["1d"];

  const growwSymbol = await resolveGrowwSymbol(tradingSymbol);

  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - config.daysBack * 86400;

  const params = new URLSearchParams({
    exchange: "NSE",
    segment: "CASH",
    groww_symbol: growwSymbol,
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    candle_interval: config.candleInterval,
  });

  const payload = await growwFetch<NewCandlesPayload>(
    `/v1/historical/candles?${params}`
  );

  return (payload.candles ?? []).map(
    ([timestamp, open, high, low, close, volume]) => ({
      time: Math.floor(new Date(timestamp).getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: volume ?? 0,
    })
  );
}

export async function getOptionChain(
  exchange: string,
  underlying: string,
  expiryDate: string
): Promise<OptionChain> {
  const payload = await growwFetch<OptionChainPayload>(
    `/v1/option-chain/exchange/${encodeURIComponent(exchange)}/underlying/${encodeURIComponent(underlying)}?expiry_date=${encodeURIComponent(expiryDate)}`
  );

  const strikes: Record<string, OptionStrike> = {};
  for (const [strike, data] of Object.entries(payload.strikes)) {
    const entry: OptionStrike = {};
    if (data.CE) {
      entry.CE = {
        tradingSymbol: data.CE.trading_symbol,
        ltp: data.CE.ltp,
        openInterest: data.CE.open_interest,
        volume: data.CE.volume,
        greeks: data.CE.greeks
          ? { ...data.CE.greeks }
          : undefined,
      };
    }
    if (data.PE) {
      entry.PE = {
        tradingSymbol: data.PE.trading_symbol,
        ltp: data.PE.ltp,
        openInterest: data.PE.open_interest,
        volume: data.PE.volume,
        greeks: data.PE.greeks
          ? { ...data.PE.greeks }
          : undefined,
      };
    }
    strikes[strike] = entry;
  }

  return {
    underlyingLtp: payload.underlying_ltp,
    strikes,
  };
}

export async function getGreeks(
  exchange: string,
  underlying: string,
  tradingSymbol: string,
  expiry: string
): Promise<Greeks> {
  const params = new URLSearchParams({
    exchange,
    underlying,
    trading_symbol: tradingSymbol,
    expiry,
  });

  const payload = await growwFetch<GreeksPayload>(
    `/v1/live-data/greeks?${params}`
  );

  return {
    delta: payload.delta,
    gamma: payload.gamma,
    theta: payload.theta,
    vega: payload.vega,
    rho: payload.rho,
    iv: payload.iv,
  };
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
