# GrowwTrade Pro — Build Checklist

Last updated: 2026-03-07

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
| 2.2 | Market overview page (NIFTY 50 + SENSEX tabs) | ✅ | Tab switcher with all 50 NIFTY / 30 SENSEX stocks, 5s polling |
| 2.3 | Real LTP — batch API (≤50, auto-chunked) | ✅ | `getBatchLTP` batches into groups of 50 |
| 2.4 | Real OHLC batch API | ✅ | `getBatchOHLC` · used for real change % across all pages |
| 2.5 | Real change values (no more Math.random) | ✅ | Fixed on Dashboard, Market, Watchlist — all use OHLC close as prev |
| 2.6 | Stock detail page | ✅ | `src/app/market/[symbol]/page.tsx` |
| 2.7 | Full quote (LTP, OHLC, depth, circuits, vol) | ✅ | `getQuote` maps all fields including depth + circuit limits |
| 2.8 | Market depth table | ✅ | `src/components/stock/market-depth.tsx` |
| 2.9 | Historical candlestick charts (1D–5Y) | ✅ | TradingView Lightweight Charts · 6 timeframes |
| 2.10 | Option chain API | ✅ | `getOptionChain` + `market.optionChain` tRPC procedure |
| 2.11 | Greeks API | ✅ | `getGreeks` + `market.greeks` tRPC procedure |
| 2.12 | Auto-refresh polling | ✅ | 3s on stock detail, 5s on market/dashboard/watchlist/portfolio/orders |
| 2.13 | Gainers / Losers section on market page | ✅ | Top 5 gainers + top 5 losers cards with real OHLC change data |
| 2.14 | Index summary + chart on market page | ✅ | LineChart component, avg change %, advancers/decliners count |
| 2.15 | Market Ticker in header | ❌ | Architecture shows scrolling indices ticker; not built |
| 2.16 | WebSocket LiveFeed → SSE bridge | ❌ | No `live-feed.ts`, no `/api/live-feed` SSE route, no `useGrowwLiveFeed.ts` hook |

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
| 3.14 | Order status polling post-placement | ❌ | After placement, orders page auto-refreshes at 5s but no per-order 2s poll |
| 3.15 | Toast notifications (sonner) | ✅ | Replaced all `alert()` calls with `sonner` toasts (success/error) |
| 3.16 | Orders page — 5s refetch polling | ✅ | `refetchInterval: 5000` on `orders.list` query |
| 3.17 | Order form UI revamp | ✅ | Animated BUY/SELL toggle, Loader2 spinner, lucide icons, shadcn patterns |
| 3.18 | Success state after modify/cancel | ✅ | Animated checkmark + success message in modal |

---

### Sprint 4 · Portfolio & Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Holdings page with live P&L | ✅ | `src/app/portfolio/page.tsx` + `HoldingsTable` |
| 4.2 | Portfolio page — live polling | ✅ | `refetchInterval: 5000` on `portfolio.summary` query |
| 4.3 | Positions page (intraday) | ❌ | `/v1/positions/user` documented; no service fn or page |
| 4.4 | Positions tRPC procedure | ❌ | Not in `portfolio.ts` procedures |
| 4.5 | Watchlist page — Supabase CRUD | ❌ | Hardcoded 8 symbols; no create/delete/reorder watchlist |
| 4.6 | Watchlist — add/remove stocks | ❌ | "Add Stock" button is a no-op |
| 4.7 | Watchlist — fix Math.random change values | ✅ | Uses OHLC close as prev, same as market/dashboard |
| 4.8 | Watchlist — polling | ✅ | `refetchInterval: 5000` on both LTP + OHLC queries |
| 4.9 | Keyboard shortcut — `/` open search | ⚠️ | Header shows `/` hint but keydown listener not wired globally |
| 4.10 | Keyboard shortcuts — `B` buy, `S` sell, `Esc` | ❌ | Not implemented |
| 4.11 | Mobile responsive layout | ❌ | Sidebar is always visible; no hamburger/drawer on mobile |
| 4.12 | Error boundaries (`error.tsx` pages) | ❌ | No error.tsx in any route; unhandled errors show blank page |
| 4.13 | Loading skeletons — portfolio/orders | ⚠️ | Market page has skeletons; portfolio/orders are basic |
| 4.14 | EOD portfolio snapshot job | ❌ | `portfolio_snapshots` table exists; no job writes to it |
| 4.15 | Notification bell (in-app) | ❌ | Bell icon in header is a dummy button |
| 4.16 | `useMarketStore` reserved for future WebSocket | ⚠️ | Zustand store exists, intentionally not wired — will be used with LiveFeed WS |
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

Ordered by impact vs effort. All are Phase 1 items.

### 🔴 High priority (core trading gaps)

| Priority | Task | Why |
|----------|------|-----|
| ~~P1~~ | ~~**Margin check before order**~~ | ✅ Done — available + required margin in order form, blocks if insufficient |
| P2 | **Watchlist Supabase CRUD** | Hardcoded symbols + "Add Stock" is a no-op — breaks core UX |

### 🟡 Medium priority (UX + reliability)

| Priority | Task | Why |
|----------|------|-----|
| P4 | **Order status polling post-placement** | Poll `/v1/order/detail/{id}` every 2s until terminal state |
| P5 | **Error boundaries (`error.tsx`)** | Unhandled errors show blank page; bad for production |
| P6 | **Mobile responsive sidebar** | Hamburger menu + drawer for small screens |
| P7 | **Keyboard shortcuts (B, S, Esc, /)** | DX improvement; `/` search hint shown but not wired |

### 🟢 Lower priority (polish, infrastructure)

| Priority | Task | Why |
|----------|------|-----|
| P8 | **Market Ticker in header** | Scrolling Nifty 50 / index prices |
| P9 | **EOD portfolio snapshot job** | Needed for Phase 2 portfolio analyzer agent |
| P10 | **WebSocket LiveFeed → SSE bridge** | True real-time; current polling is a workable interim |
| P11 | **Notification bell (in-app)** | Bell icon is a dummy; needs Supabase notifications table wiring |
| P12 | **Token refresh cron job** | Currently manual login; needs BullMQ or cron-based refresh |
| P13 | **Positions page (intraday)** | `/v1/positions/user` — `getPositions` + page; deprioritized for now |

---

## Tech Debt

| Item | File | Issue | Status |
|------|------|-------|--------|
| `NIFTY_50` constant expanded to full 50 stocks | `src/lib/constants.ts` | Was 20, now 50 | ✅ Resolved |
| `SENSEX_30` constant added | `src/lib/constants.ts` | New constant for Sensex stocks | ✅ Resolved |
| shadcn/ui installed + configured | `components.json` | Zinc theme, dark mode, sonner toast | ✅ Resolved |
| `useMarketStore` is orphaned | `src/stores/market.ts` | Kept intentionally for future WebSocket LiveFeed | Deferred |
| `useWatchlistStore` is minimal | `src/stores/watchlist.ts` | Only tracks `activeWatchlistId`; needs Supabase CRUD | Open |
| BullMQ not installed | `package.json` | Architecture calls for BullMQ for scheduled jobs; not added | Open |
| No `docker-compose.yml` | root | Architecture includes full Docker Compose setup | Open |
