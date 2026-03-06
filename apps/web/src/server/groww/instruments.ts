import { createServiceClient } from "~/lib/supabase";

export interface Instrument {
  tradingSymbol: string;
  exchange: string;
  name: string;
  instrumentType: string;
  isin: string | null;
}

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
