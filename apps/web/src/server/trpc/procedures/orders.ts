import { z } from "zod";
import { router, protectedProcedure } from "../init";
import {
  placeOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
} from "~/server/groww/orders";

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
});
