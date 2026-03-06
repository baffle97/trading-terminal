# @growwtrade/web

Next.js 15 frontend and API layer for GrowwTrade Pro. This package contains all UI pages, tRPC API routes, the Groww service integration layer, and client-side state management.

---

## Architecture

```
src/
├── app/                    Next.js App Router (pages + API routes)
│   ├── api/trpc/[trpc]/    tRPC HTTP handler (GET + POST)
│   ├── page.tsx             Dashboard
│   ├── market/              Market overview + stock detail
│   ├── orders/              Order book
│   ├── portfolio/           Holdings + P&L
│   └── watchlist/           Tracked stocks
│
├── components/             React components (all "use client")
│   ├── charts/              CandlestickChart (TradingView Lightweight Charts)
│   ├── layout/              Sidebar, Header (with search trigger + market status)
│   ├── order/               OrderForm (BUY/SELL, MARKET/LIMIT)
│   ├── portfolio/           HoldingsTable, PnlSummary
│   └── stock/               StockCard, StockSearch (Command-K modal)
│
├── server/                 Server-side only (never sent to browser)
│   ├── trpc/                tRPC router + procedures
│   │   ├── init.ts          Router factory + publicProcedure
│   │   ├── context.ts       Request context (extensible for auth)
│   │   ├── router.ts        Root router (market + orders + portfolio)
│   │   └── procedures/      Individual procedure files
│   └── groww/               Groww API service layer
│       ├── client.ts        Auth + HTTP client (token cached in Redis)
│       ├── market-data.ts   Quotes, LTP, historical candles
│       ├── orders.ts        Place, list, cancel orders (persisted to Supabase)
│       ├── portfolio.ts     Holdings, margin, portfolio summary
│       └── instruments.ts   Stock search (Supabase full-text + mock fallback)
│
├── lib/                    Shared utilities
│   ├── supabase.ts          Supabase client (browser) + service client (server)
│   ├── redis.ts             Upstash Redis client
│   ├── trpc.ts              tRPC React hooks (createTRPCReact)
│   ├── trpc-provider.tsx    TRPCProvider + QueryClientProvider wrapper
│   ├── utils.ts             cn(), formatCurrency(), formatPercent(), isMarketOpen()
│   └── constants.ts         NIFTY_50 symbols, INDICES, CHART_TIMEFRAMES
│
├── stores/                 Zustand state stores
│   ├── market.ts            Live price cache (symbol → { ltp, change, changePercent })
│   ├── watchlist.ts         Active watchlist selection
│   └── notifications.ts     In-app notification queue + unread count
│
└── app/globals.css         Tailwind CSS 4 theme (dark mode trading terminal)
```

---

## Data Flow

### How a page loads data

```
1. Page component calls tRPC hook
   e.g. trpc.market.quote.useQuery({ tradingSymbol: "RELIANCE" })

2. TanStack Query sends request to /api/trpc/market.quote

3. tRPC procedure validates input with Zod schema

4. Procedure calls Groww service function
   e.g. getQuote("RELIANCE") from server/groww/market-data.ts

5. Service function either:
   a. Calls Groww REST API (live mode, TODO)
   b. Returns mock data (current dev mode)

6. Response flows back through tRPC → React Query → component render
```

### How an order is placed

```
1. User fills OrderForm component (symbol, qty, type, price)
2. Form calls trpc.orders.place.useMutation()
3. tRPC validates: tradingSymbol, transactionType, orderType, quantity, price
4. server/groww/orders.ts:
   a. (TODO) Calls Groww POST /v1/order/create
   b. Persists order to Supabase `orders` table
   c. Returns { orderId, growwOrderId, status }
5. UI shows success toast, order appears in /orders page
```

---

## tRPC API Reference

All procedures are under `/api/trpc/*`. The root router combines three sub-routers:

### `market.*`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `market.quote` | query | `{ tradingSymbol: string }` | `Quote` (ltp, open, high, low, close, volume, change, changePercent) |
| `market.batchLtp` | query | `{ symbols: string[] }` (max 50) | `Record<string, number>` |
| `market.historicalCandles` | query | `{ tradingSymbol: string, timeframe?: string }` | `CandleData[]` (time, OHLC, volume) |
| `market.search` | query | `{ query: string }` (min 1 char) | `Instrument[]` (tradingSymbol, exchange, name, instrumentType, isin) |

### `orders.*`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `orders.list` | query | none | `OrderRow[]` (from Supabase) |
| `orders.detail` | query | `{ orderId: UUID }` | `OrderRow` |
| `orders.place` | mutation | `{ tradingSymbol, exchange?, transactionType, orderType, product?, quantity, price?, triggerPrice? }` | `{ orderId, growwOrderId, status }` |
| `orders.cancel` | mutation | `{ orderId: UUID }` | `{ success: boolean }` |

### `portfolio.*`

| Procedure | Type | Input | Returns |
|-----------|------|-------|---------|
| `portfolio.holdings` | query | none | `Holding[]` (symbol, qty, avgPrice, ltp, pnl, dayChange) |
| `portfolio.margin` | query | none | `{ availableMargin, usedMargin, totalMargin }` |
| `portfolio.summary` | query | none | `PortfolioSummary` (totals + holdings array) |

---

## Component Reference

### Layout

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `components/layout/sidebar.tsx` | Fixed left nav with 5 routes (Dashboard, Market, Orders, Portfolio, Watchlist). Active state highlighted with primary color. |
| `Header` | `components/layout/header.tsx` | Top bar with search trigger (opens StockSearch modal), market open/closed indicator (green/red dot), notification bell. |

### Charts

| Component | Props | Description |
|-----------|-------|-------------|
| `CandlestickChart` | `data: CandleData[], height?: number` | TradingView Lightweight Charts wrapper. Renders candlestick series + volume histogram. Dark theme. Auto-resizes on window resize. Cleanup on unmount. |

### Trading

| Component | Props | Description |
|-----------|-------|-------------|
| `OrderForm` | `tradingSymbol: string, ltp: number` | BUY/SELL toggle, MARKET/LIMIT type selector, quantity input, price input (for LIMIT), estimated value display. Calls `trpc.orders.place` on submit. |
| `StockSearch` | `onClose: () => void` | Full-screen modal with search input. Calls `trpc.market.search` on keystrokes. Navigate to `/market/[symbol]` on selection. Opens with `/` key, closes with `Esc`. |
| `StockCard` | `tradingSymbol, name?, ltp, change, changePercent` | Clickable card showing stock price and change. Links to `/market/[symbol]`. Green/red coloring based on change direction. |

### Portfolio

| Component | Props | Description |
|-----------|-------|-------------|
| `PnlSummary` | `totalInvested, totalCurrent, overallPnl, overallPnlPercent, dayPnl, dayPnlPercent` | 4-card grid showing invested, current value, overall P&L, and day P&L. Green/red coloring on P&L cards. |
| `HoldingsTable` | `holdings: Holding[]` | Full-width table with columns: Stock, Qty, Avg Price, LTP, Current Value, P&L, Day Change. Each stock links to its detail page. |

---

## Zustand Stores

| Store | File | State | Purpose |
|-------|------|-------|---------|
| `useMarketStore` | `stores/market.ts` | `prices: Record<string, LivePrice>` | Cache for live/real-time prices. Updated via WebSocket feed (Phase 2) or polling. |
| `useWatchlistStore` | `stores/watchlist.ts` | `activeWatchlistId: string | null` | Tracks which watchlist tab is active. |
| `useNotificationStore` | `stores/notifications.ts` | `notifications: Notification[], unreadCount: number` | In-app notification queue with read/unread tracking. |

---

## Styling

Dark-themed trading terminal defined in `globals.css` using Tailwind CSS 4 `@theme`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-profit` | `#22c55e` | Positive P&L, BUY buttons, up candles |
| `--color-loss` | `#ef4444` | Negative P&L, SELL buttons, down candles |
| `--color-primary` | `#6366f1` | Active nav items, buttons, chart timeframe selector |
| `--color-surface` | `#0f0f12` | Page background |
| `--color-surface-secondary` | `#1a1a22` | Cards, sidebar, header |
| `--color-surface-tertiary` | `#25252f` | Hover states, inactive buttons |
| `--color-border` | `#2a2a36` | All borders, grid lines, chart axes |
| `--color-text-primary` | `#f0f0f5` | Main text |
| `--color-text-secondary` | `#9090a0` | Subtitles, labels |
| `--color-text-muted` | `#606070` | Placeholder text, disabled states |

---

## Groww Service Layer — Integration Guide

All Groww API integration lives in `src/server/groww/`. Every function is currently mocked and marked with TODO comments showing the exact API endpoint to replace.

### Replacing Mocks with Live API

**Step 1: `client.ts` — Authentication**
```
Current:  Returns hardcoded "mock_access_token_dev"
Replace:  Use otplib to generate TOTP → POST /v1/token/api/access → cache token in Redis (23h TTL)
```

**Step 2: `market-data.ts` — Market Data**
```
getQuote()            → GET /v1/market/quote?trading_symbol=X&segment=CASH
getBatchLTP()         → GET /v1/market/ltp?trading_symbols=X,Y,Z
getHistoricalCandles()→ GET /v1/historical/candles
```

**Step 3: `orders.ts` — Order Execution**
```
placeOrder()   → POST /v1/order/create   (keep Supabase persistence)
getOrders()    → GET /v1/order/list?segment=CASH
getOrderDetail()→ GET /v1/order/detail/{id}?segment=CASH
cancelOrder()  → DELETE /v1/order/cancel/{id}
```

**Step 4: `portfolio.ts` — Portfolio Data**
```
getHoldings() → GET /v1/holdings?segment=CASH
getMargin()   → GET /v1/margin?segment=CASH
```

**Step 5: `instruments.ts` — Instrument Master**
```
Replace mock fallback with daily CSV download from Groww → bulk upsert into Supabase instruments table.
Use Vercel Cron to schedule daily sync at 6:00 AM IST.
```

---

## Commands

```bash
pnpm dev          # Next.js dev server with Turbopack (port 3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm typecheck    # TypeScript strict mode check
pnpm lint         # Biome lint check
pnpm format       # Biome auto-fix
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | Framework (App Router, API routes, SSR) |
| `@trpc/server` + `@trpc/react-query` | Type-safe API layer |
| `@tanstack/react-query` | Server state caching, background refetch |
| `@supabase/supabase-js` | Database client (browser + server) |
| `@upstash/redis` | Serverless Redis (token cache) |
| `lightweight-charts` | TradingView candlestick charts |
| `zustand` | Client state management |
| `zod` | Input validation in tRPC procedures |
| `superjson` | Serialization for tRPC (handles Dates, BigInts) |
| `otplib` | TOTP generation for Groww auth (Phase: live integration) |
| `lucide-react` | Icons |
| `clsx` + `tailwind-merge` | Conditional class merging (`cn()` utility) |
