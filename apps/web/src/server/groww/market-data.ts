// TODO: Replace all mock data with actual Groww API calls
// import { growwFetch } from "./client";

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

// Mock: Replace with GET /v1/market/quote?trading_symbol=X&segment=CASH
export async function getQuote(tradingSymbol: string): Promise<Quote> {
  const basePrice = getMockBasePrice(tradingSymbol);
  const change = (Math.random() - 0.5) * basePrice * 0.04;

  return {
    tradingSymbol,
    exchange: "NSE",
    ltp: basePrice + change,
    open: basePrice - basePrice * 0.005,
    high: basePrice + basePrice * 0.02,
    low: basePrice - basePrice * 0.015,
    close: basePrice,
    volume: Math.floor(Math.random() * 10000000),
    change,
    changePercent: (change / basePrice) * 100,
  };
}

// Mock: Replace with GET /v1/market/ltp?trading_symbols=X,Y,Z
export async function getBatchLTP(
  symbols: string[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const symbol of symbols) {
    const base = getMockBasePrice(symbol);
    result[symbol] = base + (Math.random() - 0.5) * base * 0.02;
  }
  return result;
}

// Mock: Replace with GET /v1/historical/candles
export async function getHistoricalCandles(
  tradingSymbol: string,
  _timeframe: string
): Promise<CandleData[]> {
  const basePrice = getMockBasePrice(tradingSymbol);
  const candles: CandleData[] = [];
  let price = basePrice * 0.85;

  for (let i = 100; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dayChange = (Math.random() - 0.48) * price * 0.03;
    const open = price;
    const close = price + dayChange;
    const high = Math.max(open, close) + Math.random() * price * 0.01;
    const low = Math.min(open, close) - Math.random() * price * 0.01;

    candles.push({
      time: Math.floor(date.getTime() / 1000),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000),
    });

    price = close;
  }

  return candles;
}

function getMockBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    RELIANCE: 2450.0,
    TCS: 3890.0,
    HDFCBANK: 1620.0,
    INFY: 1580.0,
    ICICIBANK: 1180.0,
    HINDUNILVR: 2340.0,
    ITC: 440.0,
    SBIN: 780.0,
    BHARTIARTL: 1650.0,
    KOTAKBANK: 1780.0,
    LT: 3450.0,
    AXISBANK: 1120.0,
    WIPRO: 480.0,
    ASIANPAINT: 2280.0,
    HCLTECH: 1720.0,
    MARUTI: 12500.0,
    ULTRACEMCO: 10200.0,
    TITAN: 3250.0,
    BAJFINANCE: 6800.0,
    SUNPHARMA: 1820.0,
  };
  return prices[symbol] ?? 500 + Math.random() * 2000;
}
