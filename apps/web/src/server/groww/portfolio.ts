import { growwFetch } from "./client";
import { getBatchLTP } from "./market-data";

export interface Holding {
  tradingSymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  ltp: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrent: number;
  overallPnl: number;
  overallPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  holdings: Holding[];
}

export interface MarginInfo {
  availableMargin: number;
  usedMargin: number;
  totalMargin: number;
}

interface GrowwHoldingsPayload {
  holdings: {
    isin: string;
    trading_symbol: string;
    quantity: number;
    average_price: number;
    pledge_quantity?: number;
    demat_locked_quantity?: number;
    t1_quantity?: number;
    demat_free_quantity?: number;
  }[];
}

interface GrowwMarginPayload {
  clear_cash: number;
  net_margin_used: number;
  brokerage_and_charges?: number;
  collateral_used?: number;
  collateral_available?: number;
  adhoc_margin?: number;
  equity_margin_details?: {
    net_equity_margin_used?: number;
    cnc_margin_used?: number;
    mis_margin_used?: number;
    cnc_balance_available?: number;
    mis_balance_available?: number;
  };
}

export async function getHoldings(): Promise<Holding[]> {
  const payload =
    await growwFetch<GrowwHoldingsPayload>("/v1/holdings/user");

  const rawHoldings = payload.holdings ?? [];
  if (rawHoldings.length === 0) return [];

  const symbols = rawHoldings.map((h) => h.trading_symbol);
  const ltpMap = await getBatchLTP(symbols);

  return rawHoldings.map((h) => {
    const ltp = ltpMap[h.trading_symbol] ?? h.average_price;
    const invested = h.quantity * h.average_price;
    const currentValue = h.quantity * ltp;
    const pnl = currentValue - invested;

    return {
      tradingSymbol: h.trading_symbol,
      exchange: "NSE",
      quantity: h.quantity,
      averagePrice: h.average_price,
      ltp,
      invested,
      currentValue,
      pnl,
      pnlPercent: invested > 0 ? (pnl / invested) * 100 : 0,
      dayChange: 0,
      dayChangePercent: 0,
    };
  });
}

export async function getMargin(): Promise<MarginInfo> {
  const payload = await growwFetch<GrowwMarginPayload>(
    "/v1/margins/detail/user"
  );

  const availableMargin = payload.clear_cash ?? 0;
  const usedMargin = payload.net_margin_used ?? 0;

  return {
    availableMargin,
    usedMargin,
    totalMargin: availableMargin + usedMargin,
  };
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const holdings = await getHoldings();

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalCurrent = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const overallPnl = totalCurrent - totalInvested;
  const dayPnl = holdings.reduce(
    (sum, h) => sum + h.dayChange * h.quantity,
    0
  );

  return {
    totalInvested,
    totalCurrent,
    overallPnl,
    overallPnlPercent:
      totalInvested > 0 ? (overallPnl / totalInvested) * 100 : 0,
    dayPnl,
    dayPnlPercent: totalCurrent > 0 ? (dayPnl / totalCurrent) * 100 : 0,
    holdings,
  };
}
