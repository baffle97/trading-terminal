// TODO: Replace all mock implementations with actual Groww API calls

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

// Mock: Replace with GET /v1/holdings?segment=CASH
export async function getHoldings(): Promise<Holding[]> {
  return [
    mockHolding("RELIANCE", 10, 2380.5, 2450.0),
    mockHolding("TCS", 5, 3750.0, 3890.0),
    mockHolding("HDFCBANK", 15, 1590.0, 1620.0),
    mockHolding("INFY", 20, 1520.0, 1580.0),
    mockHolding("ITC", 50, 420.0, 440.0),
    mockHolding("SBIN", 25, 760.0, 780.0),
    mockHolding("WIPRO", 30, 460.0, 480.0),
    mockHolding("BHARTIARTL", 8, 1580.0, 1650.0),
  ];
}

// Mock: Replace with GET /v1/margin?segment=CASH
export async function getMargin(): Promise<MarginInfo> {
  return {
    availableMargin: 245000,
    usedMargin: 155000,
    totalMargin: 400000,
  };
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const holdings = await getHoldings();

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalCurrent = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const overallPnl = totalCurrent - totalInvested;
  const dayPnl = holdings.reduce((sum, h) => sum + h.dayChange * h.quantity, 0);

  return {
    totalInvested,
    totalCurrent,
    overallPnl,
    overallPnlPercent: (overallPnl / totalInvested) * 100,
    dayPnl,
    dayPnlPercent: (dayPnl / totalCurrent) * 100,
    holdings,
  };
}

function mockHolding(
  symbol: string,
  qty: number,
  avgPrice: number,
  ltp: number
): Holding {
  const invested = qty * avgPrice;
  const currentValue = qty * ltp;
  const pnl = currentValue - invested;
  const dayMove = (Math.random() - 0.45) * ltp * 0.02;

  return {
    tradingSymbol: symbol,
    exchange: "NSE",
    quantity: qty,
    averagePrice: avgPrice,
    ltp,
    invested,
    currentValue,
    pnl,
    pnlPercent: (pnl / invested) * 100,
    dayChange: dayMove,
    dayChangePercent: (dayMove / ltp) * 100,
  };
}
