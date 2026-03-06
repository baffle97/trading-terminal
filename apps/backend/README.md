# @growwtrade/backend

Supabase backend for GrowwTrade Pro. Contains the PostgreSQL database schema, migrations, and project configuration. All data persistence for the trading platform flows through this Supabase project.

---

## Architecture

```
apps/backend/
├── supabase/
│   ├── config.toml                         Supabase project config (project ID)
│   └── migrations/
│       └── 00001_initial_schema.sql        Initial schema (6 tables)
└── package.json                            Scripts for dev, types, migrate
```

This package is intentionally minimal — it holds the database schema and provides scripts to:
1. Run Supabase locally (for development)
2. Push migrations to the remote project
3. Generate TypeScript types from the live schema

The generated types are output to `packages/shared/src/db.types.ts` and consumed by `@growwtrade/web`.

---

## Database Schema

**Project ID:** `cifsknoqvaehwlpykoqq`
**Provider:** Supabase (hosted PostgreSQL)

### Entity Relationship

```
instruments                    watchlists
├── id (PK, BIGSERIAL)         ├── id (PK, UUID)
├── exchange                   ├── name
├── exchange_token             ├── sort_order
├── trading_symbol (UNIQUE*)   └── created_at
├── groww_symbol                       │
├── name                               │ 1:N
├── instrument_type                    ▼
├── segment                    watchlist_items
├── series                     ├── id (PK, UUID)
├── isin                       ├── watchlist_id (FK → watchlists.id, CASCADE)
├── lot_size                   ├── trading_symbol
├── tick_size                  ├── exchange
├── is_reserved                └── added_at
├── buy_allowed                       UNIQUE(watchlist_id, trading_symbol)
├── sell_allowed
└── updated_at
    * UNIQUE(exchange, trading_symbol)
    * GIN index on (name || trading_symbol) for full-text search


orders                         portfolio_snapshots
├── id (PK, UUID)              ├── id (PK, UUID)
├── groww_order_id (UNIQUE)    ├── snapshot_date (UNIQUE, DATE)
├── trading_symbol             ├── holdings (JSONB)
├── exchange                   ├── total_invested
├── transaction_type           ├── total_current
├── order_type                 ├── day_pnl
├── product                    ├── overall_pnl
├── quantity                   └── created_at
├── price
├── trigger_price
├── status                     notifications
├── filled_quantity            ├── id (PK, UUID)
├── average_fill_price         ├── channel
├── order_source               ├── title
├── agent_reasoning            ├── body
├── created_at                 ├── metadata (JSONB)
└── updated_at                 ├── read (BOOLEAN)
                               └── sent_at
```

### Table Details

#### `instruments`
Stock master data cache. Designed to be populated daily from the Groww instrument CSV download.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | BIGSERIAL | auto | Primary key |
| `exchange` | TEXT | — | NSE or BSE |
| `exchange_token` | INTEGER | — | Groww's internal exchange token |
| `trading_symbol` | TEXT | — | e.g. RELIANCE, TCS |
| `groww_symbol` | TEXT | — | e.g. NSE-RELIANCE |
| `name` | TEXT | NULL | Full company name |
| `instrument_type` | TEXT | NULL | EQ for equity |
| `segment` | TEXT | 'CASH' | Only CASH segment supported (Phase 1) |
| `series` | TEXT | NULL | e.g. EQ, BE |
| `isin` | TEXT | NULL | International Securities Identification Number |
| `lot_size` | INTEGER | 1 | Minimum tradeable quantity |
| `tick_size` | NUMERIC | NULL | Minimum price movement |
| `is_reserved` | BOOLEAN | FALSE | If stock is in ASM/GSM |
| `buy_allowed` | BOOLEAN | TRUE | Trading permission |
| `sell_allowed` | BOOLEAN | TRUE | Trading permission |

**Indexes:**
- `UNIQUE(exchange, trading_symbol)` — prevents duplicates across exchanges
- `GIN(to_tsvector('english', name || ' ' || trading_symbol))` — full-text search for stock search feature

#### `watchlists` + `watchlist_items`
User-created watchlists with ordered stock lists. Items cascade-delete when a watchlist is removed.

#### `orders`
Local order history. Each order may have a `groww_order_id` linking it to the Groww API.

| Key Fields | Description |
|-----------|-------------|
| `transaction_type` | BUY or SELL |
| `order_type` | MARKET, LIMIT, SL (stop-loss), SLM (stop-loss market) |
| `product` | CNC (delivery) or MIS (intraday) |
| `status` | OPEN, COMPLETE, CANCELLED, REJECTED |
| `order_source` | MANUAL (user-placed) or AGENT (Phase 2 auto-trading) |
| `agent_reasoning` | Phase 2: LLM explanation for why agent placed this order |

#### `portfolio_snapshots`
End-of-day snapshots for tracking portfolio performance over time. The `holdings` JSONB column stores the full holdings array (quantity, avg price, current price per stock) for that day.

#### `notifications`
Log of all notifications sent through any channel (in-app, Telegram, WhatsApp).

---

## How Data Flows

### Write Path (Order Placed)
```
User places order in UI
    → tRPC mutation validates input (Zod)
    → server/groww/orders.ts calls Groww API (TODO: currently mocked)
    → Order persisted to `orders` table via Supabase service client
    → Order appears in /orders page via tRPC query
```

### Read Path (Stock Search)
```
User types in search bar
    → tRPC query calls server/groww/instruments.ts
    → Supabase query: instruments WHERE trading_symbol ILIKE '%query%' OR name ILIKE '%query%'
    → If no results: falls back to hardcoded mock instruments (dev convenience)
    → Results rendered in StockSearch modal
```

### Snapshot Path (EOD, TODO)
```
Vercel Cron at 3:35 PM IST (after market close)
    → Fetch holdings from Groww API
    → Calculate total invested, current value, day P&L
    → INSERT into portfolio_snapshots with snapshot_date = today
    → Used by portfolio page to show historical performance
```

---

## Commands

```bash
# Start local Supabase (requires Docker running)
pnpm dev

# Push migrations to remote Supabase project
pnpm migrate

# Generate TypeScript types from live schema
# Output: packages/shared/src/db.types.ts
pnpm types
```

### Adding a New Migration

```bash
cd apps/backend

# Create a new migration file
npx supabase migration new <migration_name>
# This creates: supabase/migrations/<timestamp>_<migration_name>.sql

# Write your SQL in the new file, then push:
pnpm migrate

# Regenerate types after schema changes:
cd ../..
pnpm types
```

---

## Supabase Project Config

```toml
# supabase/config.toml
project_id = "cifsknoqvaehwlpykoqq"
```

The web app connects to this project using:
- `NEXT_PUBLIC_SUPABASE_URL` — public REST endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anonymous key (client-side, RLS applies)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-side only, bypasses RLS)

---

## Type Generation Pipeline

```
Supabase PostgreSQL schema
    │
    ▼
supabase gen types typescript --project-id cifsknoqvaehwlpykoqq
    │
    ▼
packages/shared/src/db.types.ts    (auto-generated, never edit manually)
    │
    ▼
@growwtrade/web imports Database type
    │
    ├── createClient<Database>()     fully typed Supabase queries
    ├── supabase.from("orders")      autocomplete on column names
    └── OrderRow type                used in tRPC procedures + UI
```

Run `pnpm types` from the monorepo root whenever you change the database schema.

---

## Future Tables (Phase 2)

These tables are defined in the architecture doc but not yet created:

| Table | Purpose |
|-------|---------|
| `agent_logs` | LLM agent activity log (provider, model, tokens, cost) |
| `agent_suggestions` | Buy/sell/hold suggestions with confidence scores |

To add them, create a new migration: `npx supabase migration new add_agent_tables`
