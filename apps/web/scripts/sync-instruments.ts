/**
 * Groww instruments CSV sync script
 * Downloads the master CSV and upserts CASH segment instruments into Supabase.
 *
 * Run: pnpm --filter @growwtrade/web sync:instruments
 */

import { createClient } from "@supabase/supabase-js";

const CSV_URL = "https://growwapi-assets.groww.in/instruments/instrument.csv";
const BATCH_SIZE = 500;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CsvRow {
  exchange: string;
  exchange_token: number;
  trading_symbol: string;
  groww_symbol: string;
  name: string | null;
  instrument_type: string | null;
  segment: string;
  series: string | null;
  isin: string | null;
  lot_size: number;
  tick_size: number | null;
  is_reserved: boolean;
  buy_allowed: boolean;
  sell_allowed: boolean;
  updated_at: string;
}

function parseBoolean(val: string): boolean {
  return val === "1" || val.toLowerCase() === "true";
}

function parseRow(headers: string[], cols: string[]): CsvRow | null {
  const get = (key: string) => cols[headers.indexOf(key)]?.trim() ?? "";

  const segment = get("segment");
  if (segment !== "CASH") return null;

  const exchange_token = parseInt(get("exchange_token"), 10);
  if (isNaN(exchange_token)) return null;

  return {
    exchange: get("exchange"),
    exchange_token,
    trading_symbol: get("trading_symbol"),
    groww_symbol: get("groww_symbol"),
    name: get("name") || null,
    instrument_type: get("instrument_type") || null,
    segment,
    series: get("series") || null,
    isin: get("isin") || null,
    lot_size: parseInt(get("lot_size"), 10) || 1,
    tick_size: parseFloat(get("tick_size")) || null,
    is_reserved: parseBoolean(get("is_reserved")),
    buy_allowed: parseBoolean(get("buy_allowed")),
    sell_allowed: parseBoolean(get("sell_allowed")),
    updated_at: new Date().toISOString(),
  };
}

async function upsertBatch(batch: CsvRow[]): Promise<void> {
  const { error } = await supabase.from("instruments").upsert(batch, {
    onConflict: "exchange,trading_symbol",
  });
  if (error) throw new Error(`Upsert failed: ${error.message}`);
}

async function main() {
  console.log("Downloading instruments CSV...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);

  const text = await res.text();
  const lines = text.split("\n");

  const headers = lines[0].split(",").map((h) => h.trim());
  console.log(`CSV loaded — ${lines.length - 1} total rows`);

  const batch: CsvRow[] = [];
  let synced = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    const row = parseRow(headers, cols);

    if (!row) {
      skipped++;
      continue;
    }

    batch.push(row);

    if (batch.length === BATCH_SIZE) {
      await upsertBatch(batch);
      synced += batch.length;
      process.stdout.write(`\rSynced ${synced} rows...`);
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch);
    synced += batch.length;
  }

  console.log(`\nDone. Synced ${synced} CASH instruments, skipped ${skipped} non-CASH rows.`);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
