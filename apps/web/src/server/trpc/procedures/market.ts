import { z } from "zod";
import { router, protectedProcedure } from "../init";
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
  quote: protectedProcedure
    .input(z.object({ tradingSymbol: z.string() }))
    .query(async ({ input }) => {
      return getQuote(input.tradingSymbol);
    }),

  batchLtp: protectedProcedure
    .input(z.object({ symbols: z.array(z.string()).max(50) }))
    .query(async ({ input }) => {
      return getBatchLTP(input.symbols);
    }),

  historicalCandles: protectedProcedure
    .input(
      z.object({
        tradingSymbol: z.string(),
        timeframe: z.string().default("1d"),
      })
    )
    .query(async ({ input }) => {
      return getHistoricalCandles(input.tradingSymbol, input.timeframe);
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      // Try DB first, fall back to mock instruments
      const results = await searchInstruments(input.query);
      if (results.length > 0) return results;
      return getMockInstruments(input.query);
    }),
});
