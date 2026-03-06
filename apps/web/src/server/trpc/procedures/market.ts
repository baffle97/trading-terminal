import { z } from "zod";
import { router, publicProcedure } from "../init";
import {
  getQuote,
  getBatchLTP,
  getHistoricalCandles,
} from "~/server/groww/market-data";
import {
  searchInstruments,
  getMockInstruments,
} from "~/server/groww/instruments";

export const marketRouter = router({
  quote: publicProcedure
    .input(z.object({ tradingSymbol: z.string() }))
    .query(async ({ input }) => {
      return getQuote(input.tradingSymbol);
    }),

  batchLtp: publicProcedure
    .input(z.object({ symbols: z.array(z.string()).max(50) }))
    .query(async ({ input }) => {
      return getBatchLTP(input.symbols);
    }),

  historicalCandles: publicProcedure
    .input(
      z.object({
        tradingSymbol: z.string(),
        timeframe: z.string().default("1d"),
      })
    )
    .query(async ({ input }) => {
      return getHistoricalCandles(input.tradingSymbol, input.timeframe);
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      // Try DB first, fall back to mock instruments
      const results = await searchInstruments(input.query);
      if (results.length > 0) return results;
      return getMockInstruments(input.query);
    }),
});
