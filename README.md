# GrowwTrade Pro

Personal trading terminal powered by the Groww API. Self-hosted web application with live market data, order execution, portfolio management, and historical analysis.

**Status:** Phase 1 (Trading Terminal) — Mock data layer, ready for Groww API integration.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router, Turbopack) | 15.1.0 |
| UI | Tailwind CSS 4, Lucide Icons | 4.0.0 |
| Charts | TradingView Lightweight Charts | 4.2.0 |
| API Layer | tRPC 11 + Zod validation | 11.0.0 |
| Data Fetching | TanStack React Query 5 | 5.64.0 |
| State | Zustand 5 | 5.0.0 |
| Database | Supabase (hosted PostgreSQL) | 2.49.0 |
| Cache | Upstash Redis (serverless) | 1.34.0 |
| Auth (Groww) | TOTP via `otplib` + API Key | 12.0.1 |
| Code Quality | Biome (lint + format) | 2.4.4 |
| Language | TypeScript 5 (strict mode) | 5.8.0 |
| Package Manager | pnpm 10 (workspaces) | 10.17.1 |
| Deployment | Vercel | - |

---

## Monorepo Structure

```
growwtrade-pro/
├── apps/
│   ├── web/            @growwtrade/web      Next.js 15 frontend + API routes
│   └── backend/        @growwtrade/backend  Supabase config, migrations, edge functions
├── packages/
│   └── shared/         @growwtrade/shared   DB types (auto-generated) + shared constants
├── package.json        Root scripts + workspace config
├── pnpm-workspace.yaml Workspace: apps/* + packages/*
├── tsconfig.base.json  Shared TypeScript config (ES2022, strict, bundler resolution)
└── biome.json          Linter/formatter: double quotes, 2-space indent, semicolons
```

### Workspace Packages

| Package | Path | Description |
|---------|------|-------------|
| `@growwtrade/web` | `apps/web` | Next.js 15 app — all UI, tRPC API routes, Groww service layer |
| `@growwtrade/backend` | `apps/backend` | Supabase project — migrations, config, type generation |
| `@growwtrade/shared` | `packages/shared` | Auto-generated Supabase DB types + shared constants (exchanges, order types, market hours) |

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project (project ID: `cifsknoqvaehwlpykoqq`)
- An [Upstash Redis](https://upstash.com) instance (free tier works)
- A Groww API key + TOTP secret (for live trading — not required for mock mode)

### Setup

```bash
# Clone and install
cd growwtrade-pro
pnpm install

# Configure environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local with your actual credentials

# Run database migration
cd apps/backend
npx supabase db push --project-ref cifsknoqvaehwlpykoqq

# Start development
cd ../..
pnpm dev:web          # http://localhost:3000
```

### Environment Variables

All env vars live in `apps/web/.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis auth token |
| `GROWW_API_KEY` | For live | Groww API key (mock works without this) |
| `GROWW_TOTP_SECRET` | For live | TOTP secret for programmatic auth |

---

## Development Commands

```bash
# Run
pnpm dev:web              # Start Next.js dev server (port 3000, Turbopack)
pnpm dev:backend          # Start local Supabase (requires Docker)

# Build
pnpm build                # Build all packages
pnpm build:web            # Build web app only

# Code Quality
pnpm typecheck            # Type-check all packages
pnpm lint                 # Lint all packages (Biome)
pnpm format               # Auto-fix formatting (Biome)

# Types
pnpm types                # Regenerate Supabase DB types into @growwtrade/shared

# Filter to specific package
pnpm --filter @growwtrade/web <command>
pnpm --filter @growwtrade/backend <command>
```

---

## Architecture Overview

```
Browser (React + Zustand)
    │
    ├── tRPC React Query hooks
    │
    ▼
Next.js API Routes (/api/trpc/*)
    │
    ├── tRPC Router
    │   ├── market.*      quotes, batch LTP, candles, search
    │   ├── orders.*      place, list, detail, cancel
    │   └── portfolio.*   holdings, margin, summary
    │
    ├── Groww Service Layer (src/server/groww/)
    │   ├── client.ts         API auth + token caching in Redis
    │   ├── market-data.ts    quotes, LTP, historical candles
    │   ├── orders.ts         order CRUD (persisted to Supabase)
    │   ├── portfolio.ts      holdings, margin, P&L calculations
    │   └── instruments.ts    stock search (Supabase full-text + mock fallback)
    │
    ▼
External Services
    ├── Groww REST API        market data, order execution (currently mocked)
    ├── Supabase PostgreSQL   orders, instruments, watchlists, snapshots
    └── Upstash Redis         token cache (23-hour TTL)
```

---

## Database Schema

6 tables in Supabase PostgreSQL (migration: `00001_initial_schema.sql`):

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `instruments` | Stock master data (daily CSV sync from Groww) | exchange, trading_symbol, name, isin, lot_size |
| `watchlists` | User-created watchlists | name, sort_order |
| `watchlist_items` | Stocks in a watchlist | watchlist_id (FK), trading_symbol |
| `orders` | Order history (synced from Groww + locally placed) | groww_order_id, transaction_type, order_type, status, filled_quantity |
| `portfolio_snapshots` | End-of-day portfolio snapshots | snapshot_date, holdings (JSONB), total_invested, day_pnl |
| `notifications` | Notification log | channel, title, body, read flag |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Portfolio summary, margin info, top stocks grid |
| `/market` | Market Overview | All Nifty 50 stocks with live prices |
| `/market/[symbol]` | Stock Detail | Candlestick chart, OHLC data, order form |
| `/orders` | Order Book | Order history table with status badges |
| `/portfolio` | Portfolio | P&L summary cards + holdings table |
| `/watchlist` | Watchlist | Tracked stocks with quick-add |

---

## Mock vs Live Mode

The entire Groww service layer (`src/server/groww/`) is mocked for development. Every mock function has a `// TODO: Replace with ...` comment referencing the exact Groww API endpoint to call.

| File | Mock Behavior | Live Replacement |
|------|--------------|-----------------|
| `client.ts` | Returns hardcoded token | TOTP auth via `otplib` + Redis cache |
| `market-data.ts` | Random prices around realistic base values | `GET /v1/market/quote`, `/v1/market/ltp`, `/v1/historical/candles` |
| `orders.ts` | Saves to Supabase with mock Groww order ID | `POST /v1/order/create`, `DELETE /v1/order/cancel/{id}` |
| `portfolio.ts` | 8 hardcoded holdings with calculated P&L | `GET /v1/holdings`, `GET /v1/margin` |
| `instruments.ts` | 20 Nifty 50 stocks as fallback | CSV download + `GET /v1/instruments/{symbol}` |

---

## Code Style

Enforced by Biome (config in `biome.json`):

- Double quotes, 2-space indent, 80-char line width
- Trailing commas (ES5), semicolons always
- Organize imports automatically
- Run `pnpm format` before committing

---

## Roadmap

### Phase 1 (Current)
- [x] Project scaffolding (monorepo, Next.js, tRPC, Supabase)
- [x] Dashboard, Market, Orders, Portfolio, Watchlist pages
- [x] Candlestick charts with TradingView Lightweight Charts
- [x] Order form (Market + Limit types)
- [x] Mock Groww service layer
- [ ] Groww API integration (replace mocks)
- [ ] WebSocket live price feed (Groww LiveFeed SDK)
- [ ] Instrument CSV sync job (Vercel Cron)
- [ ] Keyboard shortcuts (/, B, S, Esc)
- [ ] Mobile responsive layout

### Phase 2 (Future)
- [ ] LLM-powered portfolio analyzer (Claude)
- [ ] Daily trade suggestions agent
- [ ] Auto-order execution with safety controls
- [ ] Telegram + WhatsApp notifications
