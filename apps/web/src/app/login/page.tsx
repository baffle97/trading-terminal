"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/lib/trpc";

type AuthMethod = "token" | "secret" | "totp";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("token");
  const [token, setToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");

  const loginWithToken = trpc.auth.loginWithToken.useMutation({
    onSuccess: () => router.replace("/"),
    onError: (err) => setError(err.message),
  });

  const loginWithSecret = trpc.auth.loginWithApiKeySecret.useMutation({
    onSuccess: () => router.replace("/"),
    onError: (err) => setError(err.message),
  });

  const loginWithTotp = trpc.auth.loginWithTotp.useMutation({
    onSuccess: () => router.replace("/"),
    onError: (err) => setError(err.message),
  });

  const isPending =
    loginWithToken.isPending ||
    loginWithSecret.isPending ||
    loginWithTotp.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (method === "token") {
      loginWithToken.mutate({ token });
    } else if (method === "secret") {
      loginWithSecret.mutate({ apiKey, secret });
    } else {
      loginWithTotp.mutate({ apiKey, totp });
    }
  }

  const tabs: { key: AuthMethod; label: string }[] = [
    { key: "token", label: "Access Token" },
    { key: "secret", label: "API Key + Secret" },
    { key: "totp", label: "API Key + TOTP" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            G
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            GrowwTrade Pro
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Login with your Groww API credentials
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-secondary p-6">
          <div className="mb-6 flex gap-1 rounded-lg bg-surface-tertiary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMethod(tab.key);
                  setError("");
                }}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  method === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === "token" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your Groww access token"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Generate from your Groww API dashboard. Expires daily at 6 AM.
                </p>
              </div>
            )}

            {(method === "secret" || method === "totp") && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Your Groww API key"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                />
              </div>
            )}

            {method === "secret" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  API Secret
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Your Groww API secret"
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Requires daily approval on Groww Cloud API Keys page.
                </p>
              </div>
            )}

            {method === "totp" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  TOTP Code
                </label>
                <input
                  type="text"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value)}
                  placeholder="6-digit TOTP code"
                  maxLength={8}
                  required
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary"
                />
                <p className="mt-1.5 text-xs text-text-muted">
                  Requires daily approval on Groww Cloud API Keys page.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-loss/10 px-3 py-2 text-sm text-loss">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Manage your API keys at{" "}
          <span className="text-primary">Groww Cloud API Keys</span> page
        </p>
      </div>
    </div>
  );
}
