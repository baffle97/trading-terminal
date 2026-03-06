import { z } from "zod";
import { router, publicProcedure } from "../init";
import {
  isAuthenticated,
  loginWithAccessToken,
  loginWithApiKeySecret,
  loginWithTotp,
  logout,
} from "~/server/groww/client";

export const authRouter = router({
  session: publicProcedure.query(async () => {
    const authenticated = await isAuthenticated();
    return { authenticated };
  }),

  loginWithToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await loginWithAccessToken(input.token);
      return { success: true };
    }),

  loginWithApiKeySecret: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        secret: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      await loginWithApiKeySecret(input.apiKey, input.secret);
      return { success: true };
    }),

  loginWithTotp: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        totp: z.string().min(4).max(8),
      })
    )
    .mutation(async ({ input }) => {
      await loginWithTotp(input.apiKey, input.totp);
      return { success: true };
    }),

  logout: publicProcedure.mutation(async () => {
    await logout();
    return { success: true };
  }),
});
