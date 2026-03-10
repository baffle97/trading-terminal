import { z } from "zod";
import { router, protectedProcedure } from "../init";
import {
  placeOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  modifyOrder,
} from "~/server/groww/orders";
import { getRequiredMargin } from "~/server/groww/portfolio";

export const ordersRouter = router({
  list: protectedProcedure.query(async () => {
    return getOrders();
  }),

  detail: protectedProcedure
    .input(
      z.object({
        growwOrderId: z.string(),
        segment: z.string().default("CASH"),
      })
    )
    .query(async ({ input }) => {
      return getOrderDetail(input.growwOrderId, input.segment);
    }),

  place: protectedProcedure
    .input(
      z.object({
        tradingSymbol: z.string(),
        exchange: z.string().default("NSE"),
        transactionType: z.enum(["BUY", "SELL"]),
        orderType: z.enum(["MARKET", "LIMIT", "SL", "SLM"]),
        product: z.enum(["CNC", "MIS"]).default("CNC"),
        quantity: z.number().int().positive(),
        price: z.number().positive().optional(),
        triggerPrice: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return placeOrder(input);
    }),

  modify: protectedProcedure
    .input(
      z.object({
        growwOrderId: z.string(),
        orderType: z.enum(["MARKET", "LIMIT", "SL", "SLM"]),
        segment: z.string().default("CASH"),
        quantity: z.number().int().positive().optional(),
        price: z.number().positive().optional(),
        triggerPrice: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return modifyOrder(input);
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        growwOrderId: z.string(),
        segment: z.string().default("CASH"),
      })
    )
    .mutation(async ({ input }) => {
      return cancelOrder(input.growwOrderId, input.segment);
    }),

  requiredMargin: protectedProcedure
    .input(
      z.object({
        tradingSymbol: z.string(),
        transactionType: z.enum(["BUY", "SELL"]),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        orderType: z.enum(["MARKET", "LIMIT", "SL", "SLM"]),
        product: z.enum(["CNC", "MIS"]).default("CNC"),
        exchange: z.string().default("NSE"),
      })
    )
    .query(async ({ input }) => {
      return getRequiredMargin(input);
    }),
});
