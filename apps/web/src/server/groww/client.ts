// TODO: Replace mock with actual Groww SDK
// import GrowwAPI from "growwapi";
//
// const groww = new GrowwAPI({
//   apiKey: process.env.GROWW_API_KEY!,
// });

import { redis } from "~/lib/redis";

// Mock Groww client for development
// Replace with actual `growwapi` SDK when ready to go live

export async function getAccessToken(): Promise<string> {
  // Check Redis cache first
  const cached = await redis.get<string>("groww:access_token");
  if (cached) return cached;

  // TODO: Replace with actual TOTP auth flow
  // import { authenticator } from "otplib";
  // const totp = authenticator.generate(process.env.GROWW_TOTP_SECRET!);
  // const response = await groww.token.getAccessToken({
  //   key_type: "totp",
  //   totp,
  // });
  // await redis.set("groww:access_token", response.token, { ex: 82800 }); // 23 hours
  // return response.token;

  const mockToken = "mock_access_token_dev";
  await redis.set("groww:access_token", mockToken, { ex: 82800 });
  return mockToken;
}

export async function growwFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();

  // TODO: Replace with actual Groww API base URL
  // const baseUrl = "https://api.groww.in";
  const baseUrl = "https://mock.groww.local";

  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
