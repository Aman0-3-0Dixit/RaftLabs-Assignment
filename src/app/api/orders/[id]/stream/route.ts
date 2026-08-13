import { getRepository } from "@/lib/db";
import { withLiveStatus } from "@/lib/handlers/orders-handler";
import { isTerminal } from "@/lib/order-status/engine";

// Vercel Fluid Compute gives enough headroom on Hobby for a short order
// lifecycle to stream fully. This is intentionally capped, not unlimited —
// see the safety cutoff below.
export const maxDuration = 60;

const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_EVERY_MS = 15000;
const MAX_STREAM_MS = 55000; // stay under maxDuration with margin

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder();
  const orderId = params.id;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", close);

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const startedAt = Date.now();
      let lastHeartbeat = startedAt;
      let lastStatus: string | null = null;

      try {
        while (!closed) {
          const order = await getRepository().getOrderById(orderId);
          if (!order) {
            send("error", { message: "Order not found" });
            close();
            break;
          }

          const withStatus = await withLiveStatus(getRepository(), order);

          if (withStatus.status !== lastStatus) {
            lastStatus = withStatus.status;
            send("status", {
              status: withStatus.status,
              statusChangedAt: withStatus.statusChangedAt,
            });
          }

          if (isTerminal(withStatus.status)) {
            close();
            break;
          }

          if (Date.now() - startedAt > MAX_STREAM_MS) {
            // Client will reconnect automatically (EventSource does this
            // natively), picking up right where the computed status left off.
            close();
            break;
          }

          if (Date.now() - lastHeartbeat > HEARTBEAT_EVERY_MS) {
            lastHeartbeat = Date.now();
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }

          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        }
      } catch (err) {
        console.error("SSE stream error:", err);
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
