import { router, protectedProcedure } from "../init";
import {
  getHoldings,
  getMargin,
  getPortfolioSummary,
} from "~/server/groww/portfolio";

export const portfolioRouter = router({
  holdings: protectedProcedure.query(async () => {
    return getHoldings();
  }),

  margin: protectedProcedure.query(async () => {
    return getMargin();
  }),

  summary: protectedProcedure.query(async () => {
    return getPortfolioSummary();
  }),
});
