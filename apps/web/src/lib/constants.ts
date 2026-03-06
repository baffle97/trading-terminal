export const NIFTY_50 = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "HINDUNILVR",
  "ITC",
  "SBIN",
  "BHARTIARTL",
  "KOTAKBANK",
  "LT",
  "AXISBANK",
  "WIPRO",
  "ASIANPAINT",
  "HCLTECH",
  "MARUTI",
  "ULTRACEMCO",
  "TITAN",
  "BAJFINANCE",
  "SUNPHARMA",
] as const;

export const INDICES = [
  { symbol: "NIFTY 50", exchange: "NSE" },
  { symbol: "NIFTY BANK", exchange: "NSE" },
  { symbol: "SENSEX", exchange: "BSE" },
] as const;

export const CHART_TIMEFRAMES = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
] as const;
