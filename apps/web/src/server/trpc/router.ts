import { router } from "./init";
import { marketRouter } from "./procedures/market";
import { ordersRouter } from "./procedures/orders";
import { portfolioRouter } from "./procedures/portfolio";

export const appRouter = router({
  market: marketRouter,
  orders: ordersRouter,
  portfolio: portfolioRouter,
});

export type AppRouter = typeof appRouter;
