// TODO: Replace with actual Groww instrument CSV sync + API lookup
// GET /v1/instruments/{symbol}

import { createServiceClient } from "~/lib/supabase";

export interface Instrument {
  tradingSymbol: string;
  exchange: string;
  name: string;
  instrumentType: string;
  isin: string | null;
}

// Search instruments from Supabase (full-text search on name + symbol)
export async function searchInstruments(
  query: string
): Promise<Instrument[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("instruments")
    .select("trading_symbol, exchange, name, instrument_type, isin")
    .or(`trading_symbol.ilike.%${query}%,name.ilike.%${query}%`)
    .eq("segment", "CASH")
    .limit(20);

  if (error) throw new Error(`Instrument search failed: ${error.message}`);

  const rows = (data ?? []) as Array<{
    trading_symbol: string;
    exchange: string;
    name: string | null;
    instrument_type: string | null;
    isin: string | null;
  }>;

  return rows.map((row) => ({
    tradingSymbol: row.trading_symbol,
    exchange: row.exchange,
    name: row.name ?? row.trading_symbol,
    instrumentType: row.instrument_type ?? "EQ",
    isin: row.isin,
  }));
}

// Mock instruments for when DB is empty (dev convenience)
export function getMockInstruments(query: string): Instrument[] {
  const all: Instrument[] = [
    { tradingSymbol: "RELIANCE", exchange: "NSE", name: "Reliance Industries", instrumentType: "EQ", isin: "INE002A01018" },
    { tradingSymbol: "TCS", exchange: "NSE", name: "Tata Consultancy Services", instrumentType: "EQ", isin: "INE467B01029" },
    { tradingSymbol: "HDFCBANK", exchange: "NSE", name: "HDFC Bank", instrumentType: "EQ", isin: "INE040A01034" },
    { tradingSymbol: "INFY", exchange: "NSE", name: "Infosys", instrumentType: "EQ", isin: "INE009A01021" },
    { tradingSymbol: "ICICIBANK", exchange: "NSE", name: "ICICI Bank", instrumentType: "EQ", isin: "INE090A01021" },
    { tradingSymbol: "HINDUNILVR", exchange: "NSE", name: "Hindustan Unilever", instrumentType: "EQ", isin: "INE030A01027" },
    { tradingSymbol: "ITC", exchange: "NSE", name: "ITC", instrumentType: "EQ", isin: "INE154A01025" },
    { tradingSymbol: "SBIN", exchange: "NSE", name: "State Bank of India", instrumentType: "EQ", isin: "INE062A01020" },
    { tradingSymbol: "BHARTIARTL", exchange: "NSE", name: "Bharti Airtel", instrumentType: "EQ", isin: "INE397D01024" },
    { tradingSymbol: "KOTAKBANK", exchange: "NSE", name: "Kotak Mahindra Bank", instrumentType: "EQ", isin: "INE237A01028" },
    { tradingSymbol: "LT", exchange: "NSE", name: "Larsen & Toubro", instrumentType: "EQ", isin: "INE018A01030" },
    { tradingSymbol: "AXISBANK", exchange: "NSE", name: "Axis Bank", instrumentType: "EQ", isin: "INE238A01034" },
    { tradingSymbol: "WIPRO", exchange: "NSE", name: "Wipro", instrumentType: "EQ", isin: "INE075A01022" },
    { tradingSymbol: "ASIANPAINT", exchange: "NSE", name: "Asian Paints", instrumentType: "EQ", isin: "INE021A01026" },
    { tradingSymbol: "HCLTECH", exchange: "NSE", name: "HCL Technologies", instrumentType: "EQ", isin: "INE860A01027" },
    { tradingSymbol: "MARUTI", exchange: "NSE", name: "Maruti Suzuki", instrumentType: "EQ", isin: "INE585B01010" },
    { tradingSymbol: "TITAN", exchange: "NSE", name: "Titan Company", instrumentType: "EQ", isin: "INE280A01028" },
    { tradingSymbol: "BAJFINANCE", exchange: "NSE", name: "Bajaj Finance", instrumentType: "EQ", isin: "INE296A01024" },
    { tradingSymbol: "SUNPHARMA", exchange: "NSE", name: "Sun Pharmaceutical", instrumentType: "EQ", isin: "INE044A01036" },
    { tradingSymbol: "ULTRACEMCO", exchange: "NSE", name: "UltraTech Cement", instrumentType: "EQ", isin: "INE481G01011" },
  ];

  const q = query.toLowerCase();
  return all.filter(
    (i) =>
      i.tradingSymbol.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q)
  );
}
