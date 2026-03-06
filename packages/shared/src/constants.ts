export const EXCHANGES = ["NSE", "BSE"] as const;
export type Exchange = (typeof EXCHANGES)[number];

export const ORDER_TYPES = ["MARKET", "LIMIT", "SL", "SLM"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "OPEN",
  "COMPLETE",
  "CANCELLED",
  "REJECTED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRODUCTS = ["CNC", "MIS"] as const;
export type Product = (typeof PRODUCTS)[number];

export const TRANSACTION_TYPES = ["BUY", "SELL"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const MARKET_HOURS = {
  open: { hour: 9, minute: 15 },
  close: { hour: 15, minute: 30 },
  timezone: "Asia/Kolkata",
} as const;
