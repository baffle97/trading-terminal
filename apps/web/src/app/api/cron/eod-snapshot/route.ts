import { NextResponse } from "next/server";
import { isAuthenticated } from "~/server/groww/client";
import { getPortfolioSummary } from "~/server/groww/portfolio";
import { createServiceClient } from "~/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check Groww token is available
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json(
      { error: "Groww token expired. Login required before snapshot." },
      { status: 503 }
    );
  }

  try {
    // 3. Fetch portfolio data
    const summary = await getPortfolioSummary();

    // 4. Build snapshot date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const snapshotDate = istDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // 5. Build holdings payload
    const holdingsPayload = summary.holdings.map((h) => ({
      tradingSymbol: h.tradingSymbol,
      exchange: h.exchange,
      quantity: h.quantity,
      averagePrice: h.averagePrice,
      ltp: h.ltp,
      invested: h.invested,
      currentValue: h.currentValue,
      pnl: h.pnl,
      pnlPercent: h.pnlPercent,
      dayChange: h.dayChange,
      dayChangePercent: h.dayChangePercent,
    }));

    // 6. Upsert into Supabase (idempotent on snapshot_date)
    const supabase = createServiceClient();
    const { error } = await supabase.from("portfolio_snapshots").upsert(
      {
        snapshot_date: snapshotDate,
        holdings: holdingsPayload,
        total_invested: summary.totalInvested,
        total_current: summary.totalCurrent,
        day_pnl: summary.dayPnl,
        overall_pnl: summary.overallPnl,
      },
      { onConflict: "snapshot_date" }
    );

    if (error) {
      return NextResponse.json(
        { error: `Supabase upsert failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshot_date: snapshotDate,
      holdings_count: summary.holdings.length,
      total_invested: summary.totalInvested,
      total_current: summary.totalCurrent,
      overall_pnl: summary.overallPnl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Snapshot failed: ${message}` },
      { status: 500 }
    );
  }
}
