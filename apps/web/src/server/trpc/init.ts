import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { isAuthenticated } from "~/server/groww/client";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const authMiddleware = t.middleware(async ({ next }) => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Please login first",
    });
  }
  return next();
});

export const protectedProcedure = t.procedure.use(authMiddleware);
