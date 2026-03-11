"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  const isAuthError =
    error.message?.includes("login") ||
    error.message?.includes("UNAUTHORIZED") ||
    error.message?.includes("authenticated");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-4 max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-loss/10">
          <AlertTriangle className="size-7 text-loss" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          {isAuthError ? "Session expired" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {isAuthError
            ? "Your session has expired. Please log in again."
            : error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          {isAuthError ? (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Log in
            </Link>
          ) : (
            <>
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RotateCcw className="size-3.5" />
                Try again
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
              >
                <Home className="size-3.5" />
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
