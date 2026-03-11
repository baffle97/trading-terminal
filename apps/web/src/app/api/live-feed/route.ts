import { liveFeed, type TickData } from "~/server/groww/live-feed";
import { isAuthenticated } from "~/server/groww/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Auth check
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse requested symbols from query params
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get("symbols");
  if (!symbolsParam) {
    return new Response("Missing symbols parameter", { status: 400 });
  }

  const symbols = symbolsParam.split(",").filter(Boolean);
  if (symbols.length === 0) {
    return new Response("No symbols provided", { status: 400 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ symbols })}\n\n`)
      );

      const listener = (symbol: string, tick: TickData) => {
        if (closed) return;
        try {
          const data = JSON.stringify({ symbol, ...tick });
          controller.enqueue(encoder.encode(`event: tick\ndata: ${data}\n\n`));
        } catch {
          // Stream closed
        }
      };

      unsubscribe = liveFeed.subscribe(symbols, listener);

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Cleanup on abort (client disconnect)
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        unsubscribe?.();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      closed = true;
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
