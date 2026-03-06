import { z } from "zod";
import { router, protectedProcedure } from "../init";
import {
  getQuote,
  getBatchLTP,
  getBatchOHLC,
  getHistoricalCandles,
  getOptionChain,
  getGreeks,
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
    .input(z.object({ symbols: z.array(z.string()) }))
    .query(async ({ input }) => {
      return getBatchLTP(input.symbols);
    }),

  batchOhlc: protectedProcedure
    .input(z.object({ symbols: z.array(z.string()) }))
    .query(async ({ input }) => {
      return getBatchOHLC(input.symbols);
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

  optionChain: protectedProcedure
    .input(
      z.object({
        exchange: z.string().default("NSE"),
        underlying: z.string(),
        expiryDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getOptionChain(input.exchange, input.underlying, input.expiryDate);
    }),

  greeks: protectedProcedure
    .input(
      z.object({
        exchange: z.string().default("NSE"),
        underlying: z.string(),
        tradingSymbol: z.string(),
        expiry: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getGreeks(
        input.exchange,
        input.underlying,
        input.tradingSymbol,
        input.expiry
      );
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const results = await searchInstruments(input.query);
      if (results.length > 0) return results;
      return getMockInstruments(input.query);
    }),
});
