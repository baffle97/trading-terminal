import { growwFetch } from "./client";
import { createServiceClient } from "~/lib/supabase";

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
  growwOrderId: string;
  status: string;
  remark: string | null;
}

export interface Order {
  growwOrderId: string;
  tradingSymbol: string;
  status: string;
  remark: string | null;
  quantity: number;
  price: number | null;
  triggerPrice: number | null;
  filledQuantity: number;
  remainingQuantity: number;
  averageFillPrice: number | null;
  orderType: string;
  transactionType: string;
  segment: string;
  product: string;
  exchange: string;
  validity: string;
  createdAt: string;
  orderReferenceId: string | null;
}

interface GrowwPlaceOrderResponse {
  groww_order_id: string;
  order_status: string;
  order_reference_id?: string;
  remark?: string;
}

interface GrowwOrderListResponse {
  order_list: GrowwOrderRaw[];
}

interface GrowwOrderRaw {
  groww_order_id: string;
  trading_symbol: string;
  order_status: string;
  remark?: string;
  quantity: number;
  price?: number;
  trigger_price?: number;
  filled_quantity?: number;
  remaining_quantity?: number;
  average_fill_price?: number;
  order_type: string;
  transaction_type: string;
  segment: string;
  product: string;
  exchange: string;
  validity?: string;
  created_at: string;
  order_reference_id?: string;
}

function mapOrder(raw: GrowwOrderRaw): Order {
  return {
    growwOrderId: raw.groww_order_id,
    tradingSymbol: raw.trading_symbol,
    status: raw.order_status,
    remark: raw.remark ?? null,
    quantity: raw.quantity,
    price: raw.price ?? null,
    triggerPrice: raw.trigger_price ?? null,
    filledQuantity: raw.filled_quantity ?? 0,
    remainingQuantity: raw.remaining_quantity ?? 0,
    averageFillPrice: raw.average_fill_price ?? null,
    orderType: raw.order_type,
    transactionType: raw.transaction_type,
    segment: raw.segment,
    product: raw.product,
    exchange: raw.exchange,
    validity: raw.validity ?? "DAY",
    createdAt: raw.created_at,
    orderReferenceId: raw.order_reference_id ?? null,
  };
}

function generateOrderRefId(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GT-${ts}-${rand}`;
}

export async function placeOrder(
  input: PlaceOrderInput
): Promise<OrderResponse> {
  const payload = await growwFetch<GrowwPlaceOrderResponse>(
    "/v1/order/create",
    {
      method: "POST",
      body: JSON.stringify({
        trading_symbol: input.tradingSymbol,
        quantity: input.quantity,
        price: input.price ?? 0,
        trigger_price: input.triggerPrice ?? 0,
        validity: "DAY",
        exchange: input.exchange,
        segment: "CASH",
        product: input.product,
        order_type: input.orderType,
        transaction_type: input.transactionType,
        order_reference_id: generateOrderRefId(),
      }),
    }
  );

  // Sync to Supabase for historical tracking (Phase 2 agent orders)
  try {
    const supabase = createServiceClient();
    await supabase.from("orders").insert({
      trading_symbol: input.tradingSymbol,
      exchange: input.exchange,
      transaction_type: input.transactionType,
      order_type: input.orderType,
      product: input.product,
      quantity: input.quantity,
      price: input.price ?? null,
      trigger_price: input.triggerPrice ?? null,
      groww_order_id: payload.groww_order_id,
      status: payload.order_status,
      filled_quantity: 0,
      average_fill_price: null,
    });
  } catch {
    // Supabase sync is best-effort; order already placed on Groww
  }

  return {
    growwOrderId: payload.groww_order_id,
    status: payload.order_status,
    remark: payload.remark ?? null,
  };
}

export async function getOrders(
  segment: string = "CASH"
): Promise<Order[]> {
  const params = new URLSearchParams({
    segment,
    page: "0",
    page_size: "100",
  });

  const payload = await growwFetch<GrowwOrderListResponse>(
    `/v1/order/list?${params}`
  );

  return (payload.order_list ?? []).map(mapOrder);
}

export async function getOrderDetail(
  growwOrderId: string,
  segment: string = "CASH"
): Promise<Order> {
  const params = new URLSearchParams({ segment });

  const payload = await growwFetch<GrowwOrderRaw>(
    `/v1/order/detail/${growwOrderId}?${params}`
  );

  return mapOrder(payload);
}

export interface ModifyOrderInput {
  growwOrderId: string;
  orderType: "MARKET" | "LIMIT" | "SL" | "SLM";
  segment?: string;
  quantity?: number;
  price?: number;
  triggerPrice?: number;
}

export async function modifyOrder(
  input: ModifyOrderInput
): Promise<{ growwOrderId: string; status: string }> {
  const payload = await growwFetch<{
    groww_order_id: string;
    order_status: string;
  }>("/v1/order/modify", {
    method: "POST",
    body: JSON.stringify({
      groww_order_id: input.growwOrderId,
      order_type: input.orderType,
      segment: input.segment ?? "CASH",
      ...(input.quantity != null && { quantity: input.quantity }),
      ...(input.price != null && { price: input.price }),
      ...(input.triggerPrice != null && { trigger_price: input.triggerPrice }),
    }),
  });

  // Sync to Supabase
  try {
    const supabase = createServiceClient();
    const update: Record<string, unknown> = {
      status: payload.order_status,
      updated_at: new Date().toISOString(),
    };
    if (input.quantity != null) update.quantity = input.quantity;
    if (input.price != null) update.price = input.price;
    if (input.triggerPrice != null) update.trigger_price = input.triggerPrice;
    await supabase
      .from("orders")
      .update(update)
      .eq("groww_order_id", input.growwOrderId);
  } catch {
    // Best-effort sync
  }

  return {
    growwOrderId: payload.groww_order_id,
    status: payload.order_status,
  };
}

export async function cancelOrder(
  growwOrderId: string,
  segment: string = "CASH"
): Promise<{ growwOrderId: string; status: string }> {
  const payload = await growwFetch<{
    groww_order_id: string;
    order_status: string;
  }>("/v1/order/cancel", {
    method: "POST",
    body: JSON.stringify({
      segment,
      groww_order_id: growwOrderId,
    }),
  });

  // Sync cancellation to Supabase
  try {
    const supabase = createServiceClient();
    await supabase
      .from("orders")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("groww_order_id", growwOrderId);
  } catch {
    // Best-effort sync
  }

  return {
    growwOrderId: payload.groww_order_id,
    status: payload.order_status,
  };
}
