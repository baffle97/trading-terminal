import crypto from "crypto";
import { redis } from "~/lib/redis";

const GROWW_BASE_URL = "https://api.groww.in";
const TOKEN_CACHE_KEY = "groww:access_token";
const TOKEN_TTL = 82800; // 23 hours

export class GrowwAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowwAuthError";
  }
}

export class GrowwApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "GrowwApiError";
    this.code = code;
  }
}

export async function getAccessToken(): Promise<string> {
  const cached = await redis.get<string>(TOKEN_CACHE_KEY);
  if (!cached) {
    throw new GrowwAuthError("Not authenticated. Please login first.");
  }
  return cached;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await redis.get<string>(TOKEN_CACHE_KEY);
  return !!token;
}

export async function loginWithAccessToken(token: string): Promise<void> {
  const res = await fetch(`${GROWW_BASE_URL}/v1/user/detail`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-API-VERSION": "1.0",
    },
  });
  const data = await res.json();
  if (data.status !== "SUCCESS") {
    throw new GrowwAuthError(data.error?.message ?? "Invalid access token");
  }
  await redis.set(TOKEN_CACHE_KEY, token, { ex: TOKEN_TTL });
}

export async function loginWithApiKeySecret(
  apiKey: string,
  secret: string
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const checksum = generateChecksum(secret, timestamp);

  const res = await fetch(`${GROWW_BASE_URL}/v1/token/api/access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key_type: "approval",
      checksum,
      timestamp,
    }),
  });

  const data = await res.json();
  if (!data.token) {
    throw new GrowwAuthError(data.error?.message ?? "Login failed. Raw: " + JSON.stringify(data));
  }
  await redis.set(TOKEN_CACHE_KEY, data.token, { ex: TOKEN_TTL });
}

export async function loginWithTotp(
  apiKey: string,
  totp: string
): Promise<void> {
  const res = await fetch(`${GROWW_BASE_URL}/v1/token/api/access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key_type: "totp",
      totp,
    }),
  });

  const data = await res.json();
  if (!data.token) {
    throw new GrowwAuthError(data.error?.message ?? "Login failed. Raw: " + JSON.stringify(data));
  }
  await redis.set(TOKEN_CACHE_KEY, data.token, { ex: TOKEN_TTL });
}

export async function logout(): Promise<void> {
  await redis.del(TOKEN_CACHE_KEY);
}

function generateChecksum(secret: string, timestamp: string): string {
  return crypto
    .createHash("sha256")
    .update(secret + timestamp)
    .digest("hex");
}

export async function growwFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${GROWW_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-VERSION": "1.0",
      ...options.headers,
    },
  });

  const data = await res.json();

  if (data.status === "FAILURE") {
    throw new GrowwApiError(
      data.error?.message ?? "API request failed",
      data.error?.code
    );
  }

  return data.payload as T;
}
