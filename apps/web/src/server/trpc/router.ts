import { router } from "./init";
import { authRouter } from "./procedures/auth";
import { marketRouter } from "./procedures/market";
import { ordersRouter } from "./procedures/orders";
import { portfolioRouter } from "./procedures/portfolio";

export const appRouter = router({
  auth: authRouter,
  market: marketRouter,
  orders: ordersRouter,
  portfolio: portfolioRouter,
});

export type AppRouter = typeof appRouter;
