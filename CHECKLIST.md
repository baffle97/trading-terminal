# GrowwTrade Pro — Build Checklist

Last updated: 2026-03-11

Legend: ✅ Done · ⚠️ Partial · ❌ Not started

---

## Phase 1 — Trading Terminal

### Sprint 1 · Foundation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Next.js 15 + Tailwind + tRPC monorepo scaffold | ✅ | pnpm workspaces: apps/web, apps/backend, packages/shared |
| 1.2 | Supabase project + schema migration | ✅ | 6 tables: instruments, watchlists, watchlist_items, orders, portfolio_snapshots, notifications |
| 1.3 | Upstash Redis client | ✅ | `src/lib/redis.ts` |
| 1.4 | Groww API auth — direct token login | ✅ | `src/server/groww/client.ts` · `loginWithAccessToken` |
| 1.5 | Groww API auth — API key + secret (approval) | ✅ | `loginWithApiKeySecret` |
| 1.6 | Groww API auth — API key + TOTP | ✅ | `loginWithTotp` using `otplib` |
| 1.7 | Token cache in Redis (23h TTL) | ✅ | `groww:access_token` key |
| 1.8 | `protectedProcedure` tRPC middleware | ✅ | `src/server/trpc/init.ts` |
| 1.9 | Login page (3-tab UI) | ✅ | `src/app/login/page.tsx` |
| 1.10 | `AppShell` auth guard | ✅ | `src/components/layout/app-shell.tsx` |
| 1.11 | Logout (clears Redis, redirects) | ✅ | `src/server/trpc/procedures/auth.ts` |
| 1.12 | Instrument search (Supabase full-text, no mock) | ✅ | Mock fallback removed; 300ms debounce added; real DB only |
| 1.13 | Instrument CSV sync job | ✅ | `scripts/sync-instruments.ts` — downloads Groww CSV, upserts 11,494 CASH instruments; `pnpm sync:instruments` |
| 1.14 | Token refresh cron job (BullMQ) | ❌ | BullMQ not installed; token refresh is manual via login UI |
| 1.15 | shadcn/ui installed + configured | ✅ | Zinc dark theme, Geist font, sonner toast, button component |

---

### Sprint 2 · Market Data & Search

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Stock search (Command-K palette) | ✅ | `src/components/stock/stock-search.tsx` · `/` shortcut triggers modal · 300ms debounce · real DB |
| 2.2 | Market overview page (NIFTY 50 + SENSEX tabs) | ✅ | Tab switcher with all 50 NIFTY / 30 SENSEX stocks, live via SSE |
| 2.3 | Real LTP — batch API (≤50, auto-chunked) | ✅ | `getBatchLTP` batches into groups of 50 |
| 2.4 | Real OHLC batch API | ✅ | `getBatchOHLC` · used for real change % across all pages |
| 2.5 | Real change values (no more Math.random) | ✅ | Fixed on Dashboard, Market, Watchlist — all use OHLC close as prev |
| 2.6 | Stock detail page | ✅ | `src/app/market/[symbol]/page.tsx` |
| 2.7 | Full quote (LTP, OHLC, depth, circuits, vol) | ✅ | `getQuote` maps all fields including depth + circuit limits |
| 2.8 | Market depth table | ✅ | `src/components/stock/market-depth.tsx` |
| 2.9 | Historical candlestick charts (1D–5Y) | ✅ | TradingView Lightweight Charts · 6 timeframes |
| 2.10 | Option chain API | ✅ | `getOptionChain` + `market.optionChain` tRPC procedure |
| 2.11 | Greeks API | ✅ | `getGreeks` + `market.greeks` tRPC procedure |
| 2.12 | Auto-refresh — SSE live feed | ✅ | Replaced 3-5s polling with server-side 1s poll → SSE push to all clients |
| 2.13 | Gainers / Losers section on market page | ✅ | Top 5 gainers + top 5 losers cards with real OHLC change data |
| 2.14 | Index summary + chart on market page | ✅ | LineChart component, avg change %, advancers/decliners count |
| 2.15 | Market Ticker in header | ❌ | Architecture shows scrolling indices ticker; not built |
| 2.16 | SSE LiveFeed bridge | ✅ | `live-feed.ts` singleton → `/api/live-feed` SSE route → `useMarketStore` Zustand → `useLivePrices` hook; replaces per-client polling |

---

### Sprint 3 · Trading

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Order form — MARKET + LIMIT | ✅ | `src/components/order/order-form.tsx` |
| 3.2 | Order form — SL + SL-M types | ✅ | MKT / LMT / SL / SL-M tabs with animated trigger price input |
| 3.3 | Place order (Groww API + Supabase sync) | ✅ | `placeOrder` with `order_reference_id` generation |
| 3.4 | Order list (today's orders from Groww) | ✅ | `getOrders` |
| 3.5 | Order detail | ✅ | `getOrderDetail` + detail view in order action modal |
| 3.6 | Cancel order (Groww + Supabase sync) | ✅ | `cancelOrder` with confirmation step in modal |
| 3.7 | Modify order (Groww + Supabase sync) | ✅ | `modifyOrder` — change qty, price, trigger price, order type |
| 3.8 | Order action modal | ✅ | Click order row → modal with Modify / Cancel / View Details flows |
| 3.9 | Cancel confirmation step | ✅ | Warning UI with order summary before confirming cancel |
| 3.10 | Modify order form | ✅ | Update order type, qty, price, trigger price with validation |
| 3.11 | Order form — CNC/MIS product toggle | ✅ | Delivery vs Intraday selector in order form |
| 3.12 | Order statuses mapped to Groww API | ✅ | All 12 statuses: NEW, ACKED, TRIGGER_PENDING, APPROVED, EXECUTED, etc. |
| 3.13 | Margin check before order placement | ✅ | Available margin + required margin shown in order form; blocks order if insufficient |
| 3.14 | Order status polling post-placement | ✅ | `useOrderTracker` hook polls `/v1/order/detail/{id}` every 2s; `OrderStatusTracker` component shows live progress with fill bar; auto-invalidates portfolio/margin on terminal state |
| 3.15 | Toast notifications (sonner) | ✅ | Replaced all `alert()` calls with `sonner` toasts (success/error) |
| 3.16 | Orders page — 5s refetch polling | ✅ | `refetchInterval: 5000` on `orders.list` query |
| 3.17 | Order form UI revamp | ✅ | Animated BUY/SELL toggle, Loader2 spinner, lucide icons, shadcn patterns |
| 3.18 | Success state after modify/cancel | ✅ | Animated checkmark + success message in modal |

---

### Sprint 4 · Portfolio & Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Holdings page with live P&L | ✅ | `src/app/portfolio/page.tsx` + `HoldingsTable` |
| 4.2 | Portfolio page — live refresh | ✅ | 30s tRPC refresh (live prices handled by SSE) |
| 4.3 | Positions page (intraday) | ❌ | `/v1/positions/user` documented; no service fn or page |
| 4.4 | Positions tRPC procedure | ❌ | Not in `portfolio.ts` procedures |
| 4.5 | Watchlist page — Supabase CRUD | ❌ | Hardcoded 8 symbols; no create/delete/reorder watchlist |
| 4.6 | Watchlist — add/remove stocks | ❌ | "Add Stock" button is a no-op |
| 4.7 | Watchlist — fix Math.random change values | ✅ | Uses OHLC close as prev, same as market/dashboard |
| 4.8 | Watchlist — live prices via SSE | ✅ | `useLivePrices` hook replaces polling |
| 4.9 | Keyboard shortcut — `/` open search | ⚠️ | Header shows `/` hint but keydown listener not wired globally |
| 4.10 | Keyboard shortcuts — `B` buy, `S` sell, `Esc` | ❌ | Not implemented |
| 4.11 | Mobile responsive layout | ✅ | Sidebar hidden on mobile, slide-in drawer with backdrop; hamburger in header; auto-close on nav; responsive padding/text |
| 4.12 | Error boundaries (`error.tsx` pages) | ✅ | `global-error.tsx` (root), `error.tsx` (app shell, detects auth errors), `market/[symbol]/error.tsx` (stock-specific) |
| 4.13 | Loading skeletons — portfolio/orders | ⚠️ | Market page has skeletons; portfolio/orders are basic |
| 4.14 | EOD portfolio snapshot job | ✅ | API route `/api/cron/eod-snapshot` + Vercel cron (3:35 PM IST weekdays) + `snapshots` tRPC router |
| 4.15 | Notification bell (in-app) | ❌ | Bell icon in header is a dummy button |
| 4.16 | `useMarketStore` wired to SSE LiveFeed | ✅ | Zustand store manages SSE EventSource, ref-counted subscriptions, auto-reconnect with exponential backoff |
| 4.17 | `useWatchlistStore` connected to Supabase | ❌ | Store only tracks activeWatchlistId; no DB sync |

---

## Phase 2 — LLM Agent Copilot (Future)

| # | Task | Status |
|---|------|--------|
| 5.1 | LLM provider abstraction (Claude / OpenAI / Ollama) | ❌ |
| 5.2 | Portfolio Analyzer agent (EOD, 3:35 PM IST) | ❌ |
| 5.3 | Daily Suggester agent (pre-market, 8:30 AM IST) | ❌ |
| 5.4 | Order Executor agent (event-driven on approval) | ❌ |
| 5.5 | Telegram Bot notifications | ❌ |
| 5.6 | WhatsApp Cloud API notifications | ❌ |
| 5.7 | Agent safety controls (max order value, kill switch, etc.) | ❌ |
| 5.8 | `agent_logs` + `agent_suggestions` Supabase tables | ❌ |
| 5.9 | Agents dashboard page | ❌ |
| 5.10 | Suggestions review/approve page | ❌ |

---

## Priority Queue — What to Build Next

Ordered by user priority. All are Phase 1 items.

### 🔴 Sprint A — Core Trading Reliability

| Priority | Task | Status |
|----------|------|--------|
| ~~P1~~ | ~~**Order status polling post-placement**~~ | ✅ Done — `useOrderTracker` + `OrderStatusTracker` with 2s poll |
| ~~P2~~ | ~~**Error boundaries (`error.tsx`)**~~ | ✅ Done — `global-error.tsx`, `error.tsx`, `market/[symbol]/error.tsx` |
| ~~P3~~ | ~~**Mobile responsive sidebar**~~ | ✅ Done — drawer with backdrop, hamburger toggle, auto-close on route change |
| ~~P4~~ | ~~**Loading skeletons (portfolio, orders, stock detail)**~~ | ✅ Done — skeletons for all pages |

### 🟡 Sprint B — Infrastructure & Data

| Priority | Task | Why |
|----------|------|-----|
| P5 | **Token refresh cron job** | Eliminates manual daily login |
| ~~P6~~ | ~~**EOD portfolio snapshot job**~~ | ✅ Done — API route + Vercel cron + tRPC queries |
| P7 | **Market Ticker in header** | Scrolling index prices at a glance |
| P8 | **Notification bell (wire up Supabase)** | Bell icon is a dummy |

### 🟢 Sprint C — Nice-to-Have Polish

| Priority | Task | Why |
|----------|------|-----|
| P9 | **Keyboard shortcuts (`/`, `B`, `S`, `Esc`)** | DX improvement |
| P10 | **Watchlist Supabase CRUD** | Hardcoded symbols; "Add Stock" is a no-op |
| P11 | **Positions page (intraday)** | `/v1/positions/user` endpoint available |
| P12 | **Docker Compose** | Deployment readiness — defer until self-hosting needed |

---

## Tech Debt

| Item | File | Issue | Status |
|------|------|-------|--------|
| `NIFTY_50` constant expanded to full 50 stocks | `src/lib/constants.ts` | Was 20, now 50 | ✅ Resolved |
| `SENSEX_30` constant added | `src/lib/constants.ts` | New constant for Sensex stocks | ✅ Resolved |
| shadcn/ui installed + configured | `components.json` | Zinc theme, dark mode, sonner toast | ✅ Resolved |
| `useMarketStore` wired to SSE | `src/stores/market.ts` | Manages SSE connection + live prices | ✅ Resolved |
| `useWatchlistStore` is minimal | `src/stores/watchlist.ts` | Only tracks `activeWatchlistId`; needs Supabase CRUD | Open |
| BullMQ not installed | `package.json` | Architecture calls for BullMQ for scheduled jobs; not added | Open |
| No `docker-compose.yml` | root | Architecture includes full Docker Compose setup | Open |
