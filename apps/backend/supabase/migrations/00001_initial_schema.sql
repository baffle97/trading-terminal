-- Core instrument cache (refreshed daily from Groww CSV)
CREATE TABLE instruments (
    id BIGSERIAL PRIMARY KEY,
    exchange TEXT NOT NULL,
    exchange_token INTEGER NOT NULL,
    trading_symbol TEXT NOT NULL,
    groww_symbol TEXT NOT NULL,
    name TEXT,
    instrument_type TEXT,
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
    transaction_type TEXT NOT NULL,
    order_type TEXT NOT NULL,
    product TEXT DEFAULT 'CNC',
    quantity INTEGER NOT NULL,
    price NUMERIC,
    trigger_price NUMERIC,
    status TEXT,
    filled_quantity INTEGER DEFAULT 0,
    average_fill_price NUMERIC,
    order_source TEXT DEFAULT 'MANUAL',
    agent_reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily portfolio snapshots for P&L tracking
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    holdings JSONB NOT NULL,
    total_invested NUMERIC,
    total_current NUMERIC,
    day_pnl NUMERIC,
    overall_pnl NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
