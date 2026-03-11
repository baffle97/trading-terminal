"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StockDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Stock detail error:", error);
  }, [error]);

  const isNotFound =
    error.message?.includes("not found") ||
    error.message?.includes("Invalid") ||
    error.message?.includes("No data");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-4 max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-loss/10">
          <AlertTriangle className="size-7 text-loss" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          {isNotFound ? "Stock not found" : "Failed to load stock data"}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {isNotFound
            ? "This symbol may be invalid or not available on NSE."
            : error.message || "Could not fetch data for this stock. Please try again."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="size-3.5" />
            Retry
          </button>
          <Link
            href="/market"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
          >
            <ArrowLeft className="size-3.5" />
            Back to Market
          </Link>
        </div>
      </div>
    </div>
  );
}
