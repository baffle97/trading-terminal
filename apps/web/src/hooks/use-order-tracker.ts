"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { trpc } from "~/lib/trpc";

const TERMINAL_STATUSES = new Set([
  "EXECUTED",
  "COMPLETED",
  "DELIVERY_AWAITED",
  "CANCELLED",
  "REJECTED",
  "FAILED",
]);

const POLL_INTERVAL = 2000;
const MAX_POLLS = 150; // 5 minutes max (150 * 2s)

export interface TrackedOrder {
  growwOrderId: string;
  tradingSymbol: string;
  transactionType: string;
  status: string;
  filledQuantity: number;
  quantity: number;
  averageFillPrice: number | null;
  remark: string | null;
  isTerminal: boolean;
  isSuccess: boolean;
}

export function useOrderTracker() {
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const pollCountsRef = useRef<Map<string, number>>(new Map());
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const utils = trpc.useUtils();

  const updateOrder = useCallback((orderId: string, data: TrackedOrder) => {
    setTrackedOrders((prev) => {
      const idx = prev.findIndex((o) => o.growwOrderId === orderId);
      if (idx === -1) return [...prev, data];
      const next = [...prev];
      next[idx] = data;
      return next;
    });
  }, []);

  const stopPolling = useCallback((orderId: string) => {
    const interval = intervalsRef.current.get(orderId);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(orderId);
    }
    pollCountsRef.current.delete(orderId);
  }, []);

  const trackOrder = useCallback(
    (orderId: string, tradingSymbol: string, transactionType: string, quantity: number) => {
      // Initialize with pending state
      const initial: TrackedOrder = {
        growwOrderId: orderId,
        tradingSymbol,
        transactionType,
        status: "NEW",
        filledQuantity: 0,
        quantity,
        averageFillPrice: null,
        remark: null,
        isTerminal: false,
        isSuccess: false,
      };
      updateOrder(orderId, initial);
      pollCountsRef.current.set(orderId, 0);

      const poll = async () => {
        const count = (pollCountsRef.current.get(orderId) ?? 0) + 1;
        pollCountsRef.current.set(orderId, count);

        if (count > MAX_POLLS) {
          stopPolling(orderId);
          return;
        }

        try {
          const detail = await utils.orders.detail.fetch({
            growwOrderId: orderId,
          });

          const isTerminal = TERMINAL_STATUSES.has(detail.status);
          const isSuccess = ["EXECUTED", "COMPLETED", "DELIVERY_AWAITED"].includes(detail.status);

          updateOrder(orderId, {
            growwOrderId: orderId,
            tradingSymbol: detail.tradingSymbol,
            transactionType: detail.transactionType,
            status: detail.status,
            filledQuantity: detail.filledQuantity,
            quantity: detail.quantity,
            averageFillPrice: detail.averageFillPrice,
            remark: detail.remark,
            isTerminal,
            isSuccess,
          });

          if (isTerminal) {
            stopPolling(orderId);
            // Refresh the orders list and portfolio
            utils.orders.list.invalidate();
            if (isSuccess) {
              utils.portfolio.summary.invalidate();
              utils.portfolio.holdings.invalidate();
              utils.portfolio.margin.invalidate();
            }
          }
        } catch {
          // Silently retry on next interval
        }
      };

      // Poll immediately, then every 2s
      poll();
      const interval = setInterval(poll, POLL_INTERVAL);
      intervalsRef.current.set(orderId, interval);
    },
    [utils, updateOrder, stopPolling]
  );

  const dismissOrder = useCallback(
    (orderId: string) => {
      stopPolling(orderId);
      setTrackedOrders((prev) => prev.filter((o) => o.growwOrderId !== orderId));
    },
    [stopPolling]
  );

  const dismissAll = useCallback(() => {
    for (const orderId of intervalsRef.current.keys()) {
      stopPolling(orderId);
    }
    setTrackedOrders([]);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const interval of intervalsRef.current.values()) {
        clearInterval(interval);
      }
    };
  }, []);

  return {
    trackedOrders,
    trackOrder,
    dismissOrder,
    dismissAll,
  };
}
