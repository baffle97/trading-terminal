// TODO: Replace all mock implementations with actual Groww API calls

import { createServiceClient } from "~/lib/supabase";
import type { Database } from "@growwtrade/shared";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export interface PlaceOrderInput {
  tradingSymbol: string;
  exchange: string;
  transactionType: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "SL" | "SLM";
  product: "CNC" | "MIS";
  quantity: number;
  price?: number;
  triggerPrice?: number;
}

export interface OrderResponse {
  orderId: string;
  growwOrderId: string;
  status: string;
}

// Mock: Replace with POST /v1/order/create
export async function placeOrder(
  input: PlaceOrderInput
): Promise<OrderResponse> {
  const supabase = createServiceClient();
  const mockGrowwOrderId = `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const { data, error } = await supabase
    .from("orders")
    .insert({
      trading_symbol: input.tradingSymbol,
      exchange: input.exchange,
      transaction_type: input.transactionType,
      order_type: input.orderType,
      product: input.product,
      quantity: input.quantity,
      price: input.price ?? null,
      trigger_price: input.triggerPrice ?? null,
      groww_order_id: mockGrowwOrderId,
      status: "COMPLETE", // Mock: always succeeds
      filled_quantity: input.quantity,
      average_fill_price: input.price ?? 100, // Mock price
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to store order: ${error.message}`);

  return {
    orderId: data.id,
    growwOrderId: mockGrowwOrderId,
    status: "COMPLETE",
  };
}

// Mock: Replace with GET /v1/order/list?segment=CASH
export async function getOrders(): Promise<OrderRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
  return data as OrderRow[];
}

// Mock: Replace with GET /v1/order/detail/{id}?segment=CASH
export async function getOrderDetail(orderId: string): Promise<OrderRow> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) throw new Error(`Failed to fetch order: ${error.message}`);
  return data as OrderRow;
}

// Mock: Replace with DELETE /v1/order/cancel/{id}
export async function cancelOrder(orderId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(`Failed to cancel order: ${error.message}`);
  return { success: true };
}
