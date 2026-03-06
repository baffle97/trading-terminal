# GrowwTrade Pro — Architecture & Implementation Plan

**Personal Trading Platform powered by Groww API + LLM Agents**

---

## Executive Summary

A self-hosted web application that wraps the Groww Trading API into a personal trading terminal with live market data, order execution, portfolio management, and historical analysis. Phase 2 extends the platform with LLM-powered agents for portfolio analysis, daily trade suggestions, and auto-order execution.

**Key Decisions Captured:**
- Auth: API Key + TOTP
- Segment: Equity (CASH) only
- Database: Supabase (hosted Postgres + Realtime + Edge Functions)
- Deployment: Self-hosted VPS
- Notifications: Telegram + WhatsApp + In-app
- Real-time: WebSocket LiveFeed from Groww SDK
- LLM: Multi-provider (Claude, OpenAI, open-source) via abstraction layer
- Single user, no multi-tenancy overhead

---

## Tech Stack

### Frontend
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | React-based, SSR for fast loads, API routes as lightweight BFF, excellent DX |
| Styling | **Tailwind CSS 4** | Utility-first, fast iteration, great for dashboards |
| Charts | **Lightweight Charts (TradingView)** | Purpose-built for financial charts, candlesticks, volume, indicators |
| State | **Zustand** | Minimal boilerplate, perfect for single-user app |
| Data Fetching | **TanStack Query v5** | Caching, background refetch, WebSocket integration |
| UI Components | **shadcn/ui** | Copy-paste components, full control, Tailwind-native |
| Icons | **Lucide React** | Clean, consistent icon set |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | **Node.js 22 (LTS)** | Native Groww SDK support (`growwapi` npm package) |
| API Layer | **Next.js API Routes + tRPC** | Type-safe API, co-located with frontend, no separate server |
| Groww SDK | **`growwapi` (npm)** | Official Node.js SDK — handles auth, orders, live feed, instruments |
| WebSocket | **Groww LiveFeed (via SDK)** | Native WebSocket streaming for real-time prices |
| Task Scheduling | **BullMQ + Redis** | Cron jobs for token refresh, agent triggers, daily summaries |

### Data & Infrastructure
| Layer | Choice | Why |
|-------|--------|-----|
| Database | **Supabase** (hosted Postgres) | Free tier is generous, Realtime subscriptions, Row Level Security, Edge Functions |
| Cache | **Redis (Upstash or self-hosted)** | Rate limit tracking, session cache, BullMQ backend |
| Deployment | **VPS (Ubuntu) + Docker Compose** | Single `docker compose up`, everything self-contained |
| Reverse Proxy | **Caddy** | Auto HTTPS, simple config, perfect for single-service |
| Monitoring | **Better Stack or Grafana Loki** | Log aggregation, uptime monitoring |

### Phase 2 Additions
| Layer | Choice | Why |
|-------|--------|-----|
| LLM Abstraction | **LiteLLM or Vercel AI SDK** | Unified interface for Claude/OpenAI/Ollama/Groq |
| Agent Framework | **LangGraph or custom** | Stateful agent workflows with tool calling |
| Notifications | **Telegram Bot API + WhatsApp Cloud API** | Direct message delivery |
| Local Models | **Ollama** (optional) | Run Llama/Mistral locally on VPS for cost savings |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPS (Docker Compose)                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js 15 Application                      │   │
│  │                                                          │   │
│  │   ┌─────────────┐    ┌──────────────┐   ┌────────────┐  │   │
│  │   │  React UI   │    │  API Routes  │   │   tRPC     │  │   │
│  │   │  (App Router│◄──►│  /api/*      │◄──►│  Router    │  │   │
│  │   │   + SSR)    │    │              │   │            │  │   │
│  │   └──────┬──────┘    └──────┬───────┘   └─────┬──────┘  │   │
│  │          │                  │                  │          │   │
│  │          │    ┌─────────────▼──────────────────▼───┐      │   │
│  │          │    │      Groww Service Layer           │      │   │
│  │          │    │  ┌──────────┐  ┌───────────────┐   │      │   │
│  │          │    │  │ growwapi │  │  LiveFeed WS  │   │      │   │
│  │          │    │  │  (SDK)   │  │  (Real-time)  │   │      │   │
│  │          │    │  └────┬─────┘  └───────┬───────┘   │      │   │
│  │          │    └───────┼────────────────┼───────────┘      │   │
│  └──────────┼────────────┼────────────────┼──────────────────┘   │
│             │            │                │                      │
│  ┌──────────▼────┐  ┌────▼────┐   ┌──────▼──────┐               │
│  │    Redis      │  │  Groww  │   │   Groww WS  │               │
│  │  (BullMQ +   │  │  REST   │   │   Server    │               │
│  │   Cache)      │  │  API    │   │             │               │
│  └───────────────┘  └─────────┘   └─────────────┘               │
│                                                                 │
│  ┌──────────────────────────────────┐  (Phase 2)                │
│  │        Agent Orchestrator        │                           │
│  │  ┌────────┐ ┌────────┐ ┌──────┐ │                           │
│  │  │ Claude │ │ OpenAI │ │Ollama│ │                           │
│  │  └────────┘ └────────┘ └──────┘ │                           │
│  │  ┌─────────────────────────────┐ │                           │
│  │  │   Telegram / WhatsApp Bot   │ │                           │
│  │  └─────────────────────────────┘ │                           │
│  └──────────────────────────────────┘                           │
│                                                                 │
│  ┌───────────────┐                                              │
│  │    Caddy       │ ◄── HTTPS :443                              │
│  │ (Reverse Proxy)│                                             │
│  └───────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │    Supabase       │
    │  (Cloud Hosted)   │
    │  ┌──────────────┐ │
    │  │  PostgreSQL   │ │
    │  │  Realtime     │ │
    │  │  Auth (opt.)  │ │
    │  │  Storage      │ │
    │  └──────────────┘ │
    └──────────────────┘
```

---

## Supabase Database Schema

```sql
-- Core instrument cache (refreshed daily from Groww CSV)
CREATE TABLE instruments (
    id BIGSERIAL PRIMARY KEY,
    exchange TEXT NOT NULL,             -- NSE, BSE
    exchange_token INTEGER NOT NULL,
    trading_symbol TEXT NOT NULL,        -- RELIANCE, TCS
    groww_symbol TEXT NOT NULL,          -- NSE-RELIANCE
    name TEXT,                          -- Reliance Industries
    instrument_type TEXT,               -- EQ
    segment TEXT DEFAULT 'CASH',
    series TEXT,
    isin TEXT,
    lot_size INTEGER DEFAULT 1,
    tick_size NUMERIC,
    is_reserved BOOLEAN DEFAULT FALSE,
    buy_allowed BOOLEAN DEFAULT TRUE,
    sell_allowed BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exchange, trading_symbol)
);
CREATE INDEX idx_instruments_search ON instruments 
    USING GIN (to_tsvector('english', name || ' ' || trading_symbol));

-- Personal watchlists
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    trading_symbol TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(watchlist_id, trading_symbol)
);

-- Order history (synced from Groww + local enrichment)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groww_order_id TEXT UNIQUE,
    trading_symbol TEXT NOT NULL,
    exchange TEXT DEFAULT 'NSE',
    transaction_type TEXT NOT NULL,      -- BUY, SELL
    order_type TEXT NOT NULL,            -- MARKET, LIMIT, SL, SLM
    product TEXT DEFAULT 'CNC',
    quantity INTEGER NOT NULL,
    price NUMERIC,
    trigger_price NUMERIC,
    status TEXT,                         -- OPEN, COMPLETE, CANCELLED, REJECTED
    filled_quantity INTEGER DEFAULT 0,
    average_fill_price NUMERIC,
    order_source TEXT DEFAULT 'MANUAL',  -- MANUAL, AGENT
    agent_reasoning TEXT,                -- Phase 2: why agent placed this
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily portfolio snapshots for P&L tracking
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    holdings JSONB NOT NULL,            -- full holdings dump
    total_invested NUMERIC,
    total_current NUMERIC,
    day_pnl NUMERIC,
    overall_pnl NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Agent activity log
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type TEXT NOT NULL,           -- ANALYZER, SUGGESTER, EXECUTOR
    llm_provider TEXT,                  -- claude, openai, ollama
    model TEXT,
    input_summary TEXT,
    output_summary TEXT,
    action_taken TEXT,                  -- SUGGEST, EXECUTE, ALERT
    order_id UUID REFERENCES orders(id),
    tokens_used INTEGER,
    cost_estimate NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Agent suggestions
CREATE TABLE agent_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_log_id UUID REFERENCES agent_logs(id),
    trading_symbol TEXT NOT NULL,
    action TEXT NOT NULL,               -- BUY, SELL, HOLD, WATCH
    reasoning TEXT NOT NULL,
    confidence NUMERIC,                 -- 0-1
    target_price NUMERIC,
    stop_loss NUMERIC,
    status TEXT DEFAULT 'PENDING',      -- PENDING, ACCEPTED, REJECTED, EXPIRED, EXECUTED
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences & log
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,              -- TELEGRAM, WHATSAPP, IN_APP
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Project Structure

```
growwtrade-pro/
├── docker-compose.yml
├── Caddyfile
├── .env.local
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout + providers
│   │   ├── page.tsx                  # Dashboard (home)
│   │   ├── market/
│   │   │   ├── page.tsx              # Market overview / search
│   │   │   └── [symbol]/
│   │   │       └── page.tsx          # Individual stock page
│   │   ├── orders/
│   │   │   └── page.tsx              # Order book + history
│   │   ├── portfolio/
│   │   │   └── page.tsx              # Holdings + positions + P&L
│   │   ├── watchlist/
│   │   │   └── page.tsx              # Watchlists management
│   │   └── agents/                   # Phase 2
│   │       ├── page.tsx              # Agent dashboard
│   │       └── suggestions/
│   │           └── page.tsx          # Review/approve suggestions
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── charts/
│   │   │   ├── CandlestickChart.tsx  # TradingView Lightweight Charts
│   │   │   ├── PortfolioChart.tsx
│   │   │   └── MiniSparkline.tsx
│   │   ├── order/
│   │   │   ├── OrderForm.tsx         # Buy/Sell form
│   │   │   ├── OrderBook.tsx
│   │   │   └── QuickTrade.tsx        # One-click trade widget
│   │   ├── stock/
│   │   │   ├── StockCard.tsx
│   │   │   ├── StockDetail.tsx
│   │   │   ├── MarketDepth.tsx
│   │   │   └── StockSearch.tsx       # Command-K style search
│   │   ├── portfolio/
│   │   │   ├── HoldingsTable.tsx
│   │   │   ├── PositionsTable.tsx
│   │   │   └── PnLSummary.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MarketTicker.tsx      # Scrolling price ticker
│   │   │   └── NotificationBell.tsx
│   │   └── agents/                   # Phase 2
│   │       ├── SuggestionCard.tsx
│   │       ├── AgentStatus.tsx
│   │       └── AgentChat.tsx
│   │
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── router.ts            # Root tRPC router
│   │   │   ├── context.ts
│   │   │   └── procedures/
│   │   │       ├── instruments.ts
│   │   │       ├── orders.ts
│   │   │       ├── portfolio.ts
│   │   │       ├── market.ts
│   │   │       └── agents.ts        # Phase 2
│   │   │
│   │   ├── groww/
│   │   │   ├── client.ts            # GrowwAPI singleton + token management
│   │   │   ├── instruments.ts       # Instrument search/lookup
│   │   │   ├── orders.ts            # Order CRUD operations
│   │   │   ├── portfolio.ts         # Holdings + positions
│   │   │   ├── market-data.ts       # LTP, OHLC, quotes
│   │   │   ├── historical.ts        # Candlestick data
│   │   │   └── live-feed.ts         # WebSocket manager
│   │   │
│   │   ├── agents/                   # Phase 2
│   │   │   ├── orchestrator.ts       # Agent lifecycle manager
│   │   │   ├── providers/
│   │   │   │   ├── base.ts           # LLM provider interface
│   │   │   │   ├── claude.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── ollama.ts
│   │   │   ├── tools/                # Agent tool definitions
│   │   │   │   ├── market-data.ts
│   │   │   │   ├── place-order.ts
│   │   │   │   └── portfolio-read.ts
│   │   │   └── agents/
│   │   │       ├── portfolio-analyzer.ts
│   │   │       ├── daily-suggester.ts
│   │   │       └── order-executor.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── telegram.ts
│   │   │   ├── whatsapp.ts
│   │   │   └── in-app.ts
│   │   │
│   │   └── jobs/
│   │       ├── token-refresh.ts      # Daily TOTP auth
│   │       ├── instrument-sync.ts    # Daily CSV refresh
│   │       ├── portfolio-snapshot.ts # EOD snapshot
│   │       └── agent-scheduler.ts    # Phase 2
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── redis.ts                 # Redis/Upstash client
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useGrowwLiveFeed.ts      # WebSocket hook
│   │   ├── useStockSearch.ts
│   │   ├── useOrders.ts
│   │   └── usePortfolio.ts
│   │
│   └── stores/
│       ├── market.ts                # Zustand: live prices
│       ├── watchlist.ts
│       └── notifications.ts
│
├── scripts/
│   ├── seed-instruments.ts          # Initial instrument DB load
│   └── setup-supabase.sql           # Schema migration
│
└── Dockerfile
```

---

## Core Flows

### 1. Authentication Flow (API Key + TOTP)

```
App Start
    │
    ▼
BullMQ Cron (daily 6:05 AM IST)
    │
    ├─► Read API_KEY from env
    ├─► Generate TOTP code (from secret in env, using `otplib`)
    ├─► POST /v1/token/api/access
    │       { key_type: "totp", totp: "<code>" }
    ├─► Store token in Redis (TTL: 23 hours)
    └─► All subsequent API calls read token from Redis

    Fallback: Manual token entry via UI settings page
```

**Key detail:** The TOTP secret needs to be stored in `.env`. You'll use `otplib` to generate the 6-digit code programmatically, so no manual authenticator app interaction needed daily.

### 2. Live Market Data Flow

```
Browser                    Next.js Server              Groww
   │                           │                         │
   ├── Subscribe(symbols) ───► │                         │
   │                           ├── LiveFeed.connect() ──►│
   │                           ├── LiveFeed.subscribe() ►│
   │                           │                         │
   │                           │ ◄── WS: price tick ─────┤
   │                           │                         │
   │   ◄── SSE/WS push ───────┤    (fan out to client)  │
   │                           │                         │
   │   Update Zustand store    │                         │
   │   Re-render price UI      │                         │
```

The server acts as a WebSocket bridge: it maintains one Groww LiveFeed connection and fans out to the browser via Server-Sent Events (SSE) or a lightweight WS from Next.js.

### 3. Order Execution Flow

```
User clicks BUY            
    │
    ▼
OrderForm validates ──► tRPC mutation: orders.place
    │
    ▼
Server-side:
    ├─► Check margin (GET /v1/margin/calculate)
    ├─► Place order (POST /v1/order/create)
    │       { trading_symbol, quantity, order_type, price, ... }
    ├─► Store in Supabase orders table
    ├─► Return groww_order_id
    │
    ▼
Client:
    ├─► Show success toast
    ├─► Poll order status every 2s until COMPLETE/REJECTED
    └─► Update portfolio view
```

### 4. Stock Detail Page Data Assembly

```
/market/RELIANCE
    │
    ├─► Instrument lookup (local DB / Groww instrument API)
    ├─► Live quote (LTP + OHLC + market depth)
    ├─► Historical candles (1D, 1W, 1M, 3M, 1Y, 5Y)
    ├─► Your positions in this stock (if any)
    ├─► Your order history for this stock
    └─► Agent suggestions for this stock (Phase 2)
```

---

## Phase 1 Implementation Roadmap

### Sprint 1 (Week 1-2): Foundation
- [ ] Project scaffolding: Next.js 15 + Tailwind + shadcn/ui + tRPC
- [ ] Docker Compose setup (Next.js + Redis + Caddy)
- [ ] Supabase project creation + schema migration
- [ ] Groww SDK integration + TOTP auth flow
- [ ] Token refresh cron job (BullMQ)
- [ ] Instrument CSV sync job + full-text search

### Sprint 2 (Week 3-4): Market Data & Search
- [ ] Stock search (Command-K palette, fuzzy search on instruments table)
- [ ] Stock detail page with TradingView Lightweight Charts
- [ ] Live price feed (Groww WebSocket → SSE to browser)
- [ ] Market overview page (indices, top gainers/losers)
- [ ] Historical candlestick charts (1D to 5Y timeframes)

### Sprint 3 (Week 5-6): Trading
- [ ] Order form (Market, Limit, SL, SL-M)
- [ ] Order book page (open, completed, cancelled)
- [ ] Order status polling + real-time updates
- [ ] Margin check before order placement
- [ ] Quick trade widget (one-click from stock page)

### Sprint 4 (Week 7-8): Portfolio & Polish
- [ ] Holdings page with live P&L
- [ ] Positions page (intraday)
- [ ] Portfolio value chart (daily snapshots)
- [ ] Watchlists (create, reorder, add/remove stocks)
- [ ] Market ticker in header
- [ ] Keyboard shortcuts (/, B for buy, S for sell, Esc)
- [ ] Error handling, loading states, empty states
- [ ] Mobile responsive layout

---

## Phase 2: LLM Agent Architecture

### Agent Design Pattern

```
                    ┌─────────────────────┐
                    │  Agent Orchestrator  │
                    │  (BullMQ Scheduler)  │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
  ┌───────────────┐   ┌───────────────┐    ┌────────────────┐
  │   Portfolio    │   │    Daily      │    │     Order      │
  │   Analyzer     │   │   Suggester   │    │   Executor     │
  │                │   │               │    │                │
  │ Reads:         │   │ Reads:        │    │ Reads:         │
  │ - Holdings     │   │ - Analysis    │    │ - Approved     │
  │ - Positions    │   │ - Market data │    │   suggestions  │
  │ - Market data  │   │ - News (web)  │    │ - Margin       │
  │                │   │ - Technicals  │    │                │
  │ Outputs:       │   │               │    │ Executes:      │
  │ - Risk report  │   │ Outputs:      │    │ - Place order  │
  │ - Sector split │   │ - Buy/Sell    │    │ - Log action   │
  │ - Alerts       │   │   suggestions │    │ - Notify user  │
  └───────┬────────┘   └───────┬───────┘    └───────┬────────┘
          │                    │                     │
          └────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   LLM Router        │
                    │   (LiteLLM / AI SDK)│
                    │                     │
                    │   Claude ←→ Analysis│
                    │   GPT ←→ Summarize  │
                    │   Ollama ←→ Triage  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Notification Hub   │
                    │                     │
                    │  Telegram Bot API   │
                    │  WhatsApp Cloud API │
                    │  Supabase Realtime  │
                    │  (in-app push)      │
                    └─────────────────────┘
```

### Agent Details

**Portfolio Analyzer** (runs EOD, 3:35 PM IST after market close)
- Fetches current holdings + day's positions from Groww
- Calculates sector allocation, concentration risk, beta exposure
- Compares against previous snapshot for drift detection
- Sends daily portfolio health card via Telegram

**Daily Suggester** (runs pre-market, 8:30 AM IST)
- Reads portfolio analysis + watchlist stocks
- Fetches pre-market data, overnight news, technical indicators
- Generates 3-5 actionable suggestions with confidence scores
- Pushes to in-app + Telegram for review

**Order Executor** (event-driven, triggered on suggestion approval)
- User approves suggestion in-app or via Telegram reply
- Validates margin availability
- Places order via Groww API
- Monitors fill status
- Reports execution back to all channels

### LLM Provider Abstraction

```typescript
// src/server/agents/providers/base.ts
interface LLMProvider {
    name: string;
    chat(messages: Message[], tools?: Tool[]): Promise<Response>;
    estimateCost(tokens: number): number;
}

// Router picks provider based on task type + cost
const ROUTING_CONFIG = {
    'portfolio-analysis': { provider: 'claude', model: 'claude-sonnet-4-5-20250929' },
    'daily-suggestions':  { provider: 'openai', model: 'gpt-4o' },
    'quick-triage':       { provider: 'ollama', model: 'llama3.1:8b' },
    'order-confirmation': { provider: 'claude', model: 'claude-haiku-4-5-20251001' },
};
```

### Safety Controls for Auto-Execution

```
┌──────────────────────────────────────────┐
│          Order Execution Guards           │
│                                          │
│  1. Max order value: ₹X per trade        │
│  2. Max daily exposure: ₹Y total         │
│  3. Require human approval above limits  │
│  4. No F&O (CASH segment only)           │
│  5. Kill switch: disable all agents      │
│  6. Cool-down: min 5 min between orders  │
│  7. Market hours only (9:15-3:30 IST)    │
│  8. All actions logged to agent_logs     │
└──────────────────────────────────────────┘
```

---

## Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.local
    depends_on:
      - redis
    restart: unless-stopped
    volumes:
      - app-data:/app/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    depends_on:
      - app
    restart: unless-stopped

  # Phase 2 (uncomment when ready)
  # ollama:
  #   image: ollama/ollama
  #   ports:
  #     - "11434:11434"
  #   volumes:
  #     - ollama-data:/root/.ollama
  #   deploy:
  #     resources:
  #       reservations:
  #         memory: 4G

volumes:
  app-data:
  redis-data:
  caddy-data:
  # ollama-data:
```

---

## Environment Variables

```bash
# .env.local

# Groww API
GROWW_API_KEY=your_api_key_here
GROWW_TOTP_SECRET=your_totp_base32_secret    # For programmatic TOTP generation

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Redis
REDIS_URL=redis://redis:6379

# Phase 2: LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OLLAMA_BASE_URL=http://ollama:11434

# Phase 2: Notifications
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=your_chat_id
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

---

## Key API Endpoints Mapping

| Feature | Groww API Endpoint | Method |
|---------|-------------------|--------|
| Get all instruments | Download CSV + `/v1/instruments/{symbol}` | GET |
| Live quote | `/v1/market/quote?trading_symbol=X&segment=CASH` | GET |
| LTP (batch) | `/v1/market/ltp?trading_symbols=X,Y,Z` | GET |
| OHLC | `/v1/market/ohlc?trading_symbol=X` | GET |
| Historical candles | `/v1/historical/candles` | GET |
| Place order | `/v1/order/create` | POST |
| Modify order | `/v1/order/modify/{id}` | PUT |
| Cancel order | `/v1/order/cancel/{id}` | DELETE |
| Order details | `/v1/order/detail/{id}?segment=CASH` | GET |
| Order list | `/v1/order/list?segment=CASH` | GET |
| Holdings | `/v1/holdings?segment=CASH` | GET |
| Positions | `/v1/positions?segment=CASH` | GET |
| Margin | `/v1/margin?segment=CASH` | GET |
| Calculate margin | `/v1/margin/calculate` | POST |
| WebSocket feed | `LiveFeed.connect()` via SDK | WS |

---

## Rate Limit Strategy

Groww enforces these limits:

| Type | Per Second | Per Minute |
|------|-----------|------------|
| Orders | 10 | 250 |
| Live Data | 10 | 300 |
| Non Trading | 20 | 500 |

**Mitigation approach:**
- Redis-based sliding window counter per API category
- TanStack Query `staleTime` set to 5s for live data (reduces redundant calls)
- Batch LTP calls (up to 50 symbols per request)
- WebSocket LiveFeed for real-time prices (doesn't count against REST limits)
- Queue order operations through BullMQ with rate limiter

---

## VPS Recommendations

For a single-user trading app with Phase 2 agents:

| Spec | Minimum | Recommended (with Ollama) |
|------|---------|---------------------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 24.04 | Ubuntu 24.04 |
| Providers | Hetzner, DigitalOcean, AWS Lightsail | Hetzner (best value for EU/IN) |

**Estimated monthly cost:** ₹800-2000/mo for VPS + ₹499 Groww API + Supabase free tier = ~₹1300-2500/mo total (Phase 1).

---

## Getting Started (First Commands)

```bash
# 1. Create project
npx create-next-app@latest growwtrade-pro --typescript --tailwind --app --src-dir

# 2. Install core dependencies
cd growwtrade-pro
npm install growwapi @supabase/supabase-js @trpc/server @trpc/client @trpc/next
npm install zustand @tanstack/react-query otplib bullmq ioredis
npm install lightweight-charts lucide-react
npx shadcn@latest init

# 3. Install dev dependencies
npm install -D @types/node typescript

# 4. Set up Docker
# Copy docker-compose.yml and Caddyfile from this document

# 5. Run locally
docker compose up redis -d    # Start Redis
npm run dev                    # Start Next.js dev server
```

---

*Document generated for GrowwTrade Pro — a personal trading platform.*
*Phase 1: Trading terminal. Phase 2: AI-powered trading copilot.*
