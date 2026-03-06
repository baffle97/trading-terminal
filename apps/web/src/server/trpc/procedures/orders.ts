import { z } from "zod";
import { router, publicProcedure } from "../init";
import {
  placeOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
} from "~/server/groww/orders";

export const ordersRouter = router({
  list: publicProcedure.query(async () => {
    return getOrders();
  }),

  detail: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ input }) => {
      return getOrderDetail(input.orderId);
    }),

  place: publicProcedure
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

  cancel: publicProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return cancelOrder(input.orderId);
    }),
});
