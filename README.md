# GrowwTrade Pro

Personal trading terminal powered by the Groww API. Self-hosted web application with real-time market data via SSE, order execution with live status tracking, portfolio management, and historical analysis.

**Status:** Phase 1 (Trading Terminal) — Fully integrated with Groww API. Live market data, order placement/modify/cancel, portfolio P&L, and real-time price streaming all operational.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router, Turbopack) | 15.1.0 |
| UI | Tailwind CSS 4, Lucide Icons, shadcn/ui | 4.0.0 |
| Charts | TradingView Lightweight Charts | 4.2.0 |
| API Layer | tRPC 11 + Zod validation | 11.0.0 |
| Data Fetching | TanStack React Query 5 | 5.64.0 |
| State | Zustand 5 (SSE live prices) | 5.0.0 |
| Database | Supabase (hosted PostgreSQL) | 2.49.0 |
| Cache | Upstash Redis (serverless) | 1.34.0 |
| Auth (Groww) | TOTP via `otplib` + API Key | 12.0.1 |
| Code Quality | Biome (lint + format) | 2.4.4 |
| Language | TypeScript 5 (strict mode) | 5.8.0 |
| Package Manager | pnpm 10 (workspaces) | 10.17.1 |

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

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- An [Upstash Redis](https://upstash.com) instance (free tier works)
- A Groww API key + TOTP secret (for live trading)

### Setup

```bash
# Clone and install
cd growwtrade-pro
pnpm install

# Configure environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local with your actual credentials

# Sync instruments from Groww (downloads ~11k stocks)
pnpm --filter @growwtrade/web sync:instruments

# Start development
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
| `GROWW_API_KEY` | Yes | Groww API key |
| `GROWW_TOTP_SECRET` | Yes | TOTP secret for programmatic auth |

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

# Instruments
pnpm --filter @growwtrade/web sync:instruments  # Download Groww CSV, upsert 11k+ instruments
```

---

## Architecture Overview

```
Browser (React + Zustand)
    │
    ├── EventSource (/api/live-feed)     SSE stream of live prices
    │       │
    │       ▼
    │   Zustand useMarketStore           Ref-counted subscriptions, auto-reconnect
    │       │
    │       ▼
    │   useLivePrices() hook             Components get instant price updates
    │
    ├── tRPC React Query hooks           Request/response data (quotes, orders, portfolio)
    │
    ▼
Next.js API Routes
    │
    ├── /api/live-feed (SSE)
    │   └── LiveFeedManager (singleton)  1s server-side poll → fans out to all clients
    │
    ├── /api/trpc/* (tRPC Router)
    │   ├── auth.*          session, login (3 methods), logout
    │   ├── market.*        quotes, batch LTP/OHLC, candles, option chains, search
    │   ├── orders.*        place, list, detail, modify, cancel, required margin
    │   └── portfolio.*     holdings (enriched with LTP), margin, summary
    │
    ├── Groww Service Layer (src/server/groww/)
    │   ├── client.ts         API auth + token caching in Redis (23h TTL)
    │   ├── live-feed.ts      Singleton poller → SSE bridge
    │   ├── market-data.ts    quotes, LTP, OHLC, historical candles, option chains, greeks
    │   ├── orders.ts         order CRUD (Groww API + Supabase dual sync)
    │   ├── portfolio.ts      holdings, margin, P&L, required margin calculation
    │   └── instruments.ts    stock search (Supabase full-text)
    │
    ▼
External Services
    ├── Groww REST API        Live market data, order execution, portfolio data
    ├── Supabase PostgreSQL   Orders history, instruments, watchlists, snapshots
    └── Upstash Redis         Token cache (23h TTL), session management
```

---

## Features

### Authentication
- 3 login methods: Direct token, API key + secret, API key + TOTP
- Token cached in Redis with 23h TTL
- Protected tRPC middleware guards all trading routes

### Real-Time Market Data (SSE)
- Server-side `LiveFeedManager` singleton polls Groww API at 1s interval
- Fans out via Server-Sent Events to all connected browsers
- `useLivePrices(symbols)` hook with ref-counted subscriptions
- Zustand store with auto-reconnect and exponential backoff
- Single server connection regardless of number of browser tabs

### Trading
- Order types: Market, Limit, Stop-Loss, Stop-Loss Market
- Products: CNC (Delivery), MIS (Intraday)
- Pre-order margin check with visual indicator
- Post-placement order tracking (2s poll until terminal state)
- Live status tracker with fill progress bar
- Order modify and cancel with confirmation flows
- All 12 Groww order statuses mapped

### Portfolio
- Live holdings enriched with real-time LTP
- Overall P&L and day P&L calculations
- Margin overview (available, used, total)

### Market Analysis
- NIFTY 50 and SENSEX 30 index views
- Top gainers/losers sections
- Historical candlestick charts (1D, 1W, 1M, 3M, 1Y, 5Y)
- Full stock quotes with market depth (5-level bid/ask)
- Option chain and Greeks data (API ready)

### Search
- Command-K stock search with 300ms debounce
- Supabase full-text search across 11k+ instruments

---

## Database Schema

6 tables in Supabase PostgreSQL:

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `instruments` | Stock master data (CSV sync from Groww) | exchange, trading_symbol, name, isin, lot_size |
| `watchlists` | User-created watchlists | name, sort_order |
| `watchlist_items` | Stocks in a watchlist | watchlist_id (FK), trading_symbol |
| `orders` | Order history (dual-synced with Groww API) | groww_order_id, transaction_type, order_type, status, filled_quantity |
| `portfolio_snapshots` | End-of-day portfolio snapshots | snapshot_date, holdings (JSONB), total_invested, day_pnl |
| `notifications` | Notification log | channel, title, body, read flag |

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | 3-tab auth: direct token, API key + secret, API key + TOTP |
| `/` | Dashboard | Portfolio summary, margin info, top 10 stocks (live via SSE) |
| `/market` | Market Overview | NIFTY 50 / SENSEX tabs, gainers/losers, index chart (live via SSE) |
| `/market/[symbol]` | Stock Detail | Candlestick chart, OHLC, market depth, order form + live tracker |
| `/orders` | Order Book | Order history table with status badges, modify/cancel modal |
| `/portfolio` | Portfolio | P&L summary cards + holdings table |
| `/watchlist` | Watchlist | Tracked stocks with live prices (live via SSE) |

---

## Code Style

Enforced by Biome (config in `biome.json`):

- Double quotes, 2-space indent, 80-char line width
- Trailing commas (ES5), semicolons always
- Organize imports automatically
- Run `pnpm format` before committing

---

## Roadmap

### Phase 1 — Trading Terminal
- [x] Monorepo scaffolding (Next.js 15, tRPC 11, Supabase, Redis)
- [x] Groww API integration (auth, market data, orders, portfolio)
- [x] 3 login methods (token, API key + secret, API key + TOTP)
- [x] Dashboard, Market, Orders, Portfolio, Watchlist pages
- [x] Candlestick charts (TradingView Lightweight Charts, 6 timeframes)
- [x] Order form (Market, Limit, SL, SL-M) with margin check
- [x] Order modify, cancel, and status tracking
- [x] SSE live price feed (replaces polling)
- [x] Post-placement order tracking (2s poll with live UI)
- [x] Instrument CSV sync (11k+ stocks)
- [x] Stock search (Supabase full-text, Command-K)
- [ ] Error boundaries for all routes
- [ ] Mobile responsive sidebar
- [x] Loading skeletons for all pages
- [ ] Docker Compose for deployment
- [ ] Token refresh cron job
- [ ] EOD portfolio snapshot job

### Phase 2 — LLM Agent Copilot
- [ ] LLM provider abstraction (Claude / OpenAI / Ollama)
- [ ] Portfolio Analyzer agent (EOD analysis)
- [ ] Daily Suggester agent (pre-market)
- [ ] Order Executor agent (event-driven)
- [ ] Telegram + WhatsApp notifications
- [ ] Agent safety controls + dashboard
