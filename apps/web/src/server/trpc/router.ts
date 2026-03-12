import { router } from "./init";
import { authRouter } from "./procedures/auth";
import { marketRouter } from "./procedures/market";
import { ordersRouter } from "./procedures/orders";
import { portfolioRouter } from "./procedures/portfolio";
import { snapshotsRouter } from "./procedures/snapshots";

export const appRouter = router({
  auth: authRouter,
  market: marketRouter,
  orders: ordersRouter,
  portfolio: portfolioRouter,
  snapshots: snapshotsRouter,
});

export type AppRouter = typeof appRouter;
