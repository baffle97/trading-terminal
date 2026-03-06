import { router, publicProcedure } from "../init";
import {
  getHoldings,
  getMargin,
  getPortfolioSummary,
} from "~/server/groww/portfolio";

export const portfolioRouter = router({
  holdings: publicProcedure.query(async () => {
    return getHoldings();
  }),

  margin: publicProcedure.query(async () => {
    return getMargin();
  }),

  summary: publicProcedure.query(async () => {
    return getPortfolioSummary();
  }),
});
