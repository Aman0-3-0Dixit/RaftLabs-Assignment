import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { InMemoryOrderRepository } from "@/lib/repositories/in-memory-repository";
import { MENU_SEED } from "@/lib/seed-data";

let repo: InMemoryOrderRepository;

vi.mock("@/lib/db", () => ({
  getRepository: () => repo,
}));

function decode(chunk: Uint8Array) {
  return new TextDecoder().decode(chunk);
}

/** Parses raw `event: x\ndata: y\n\n` SSE text into structured objects. */
function parseSSEEvents(text: string) {
  return text
    .split("\n\n")
    .filter((block) => block.trim().length > 0 && !block.startsWith(":"))
    .map((block) => {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      return {
        event: eventLine?.replace("event:", "").trim(),
        data: dataLine ? JSON.parse(dataLine.replace("data:", "").trim()) : undefined,
      };
    });
}

async function readAllChunks(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  let text = "";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decode(value);
  }
  return text;
}

beforeEach(() => {
  repo = new InMemoryOrderRepository(MENU_SEED);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/orders/[id]/stream", () => {
  it("emits an error event and closes when the order does not exist", async () => {
    const { GET } = await import("@/app/api/orders/[id]/stream/route");
    const req = new Request("http://localhost/api/orders/nope/stream");
    const res = await GET(req, { params: { id: "nope" } });

    const text = await readAllChunks(res.body!);
    const events = parseSSEEvents(text);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("error");
    expect(events[0].data.message).toMatch(/not found/i);
  });

  it("emits exactly one status event and closes immediately for an already-terminal order", async () => {
    const order = await repo.createOrder({
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });
    await repo.saveOrderStatus(order.id, {
      status: "DELIVERED",
      statusChangedAt: new Date(),
      nextEligibleAt: new Date(),
    });

    const { GET } = await import("@/app/api/orders/[id]/stream/route");
    const req = new Request(`http://localhost/api/orders/${order.id}/stream`);
    const res = await GET(req, { params: { id: order.id } });

    const text = await readAllChunks(res.body!);
    const events = parseSSEEvents(text);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("status");
    expect(events[0].data.status).toBe("DELIVERED");
  });

  it("pushes the current status for a non-terminal order without closing the stream", async () => {
    const order = await repo.createOrder({
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });

    const { GET } = await import("@/app/api/orders/[id]/stream/route");
    const req = new Request(`http://localhost/api/orders/${order.id}/stream`);
    const res = await GET(req, { params: { id: order.id } });

    const reader = res.body!.getReader();
    const { value, done } = await reader.read();

    expect(done).toBe(false); // stream stays open for a non-terminal order
    const events = parseSSEEvents(decode(value!));
    expect(events[0].event).toBe("status");
    expect(events[0].data.status).toBe("RECEIVED");

    await reader.cancel();
  });

  it("sets SSE response headers", async () => {
    const order = await repo.createOrder({
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });
    await repo.saveOrderStatus(order.id, {
      status: "CANCELLED",
      statusChangedAt: new Date(),
      nextEligibleAt: new Date(),
    });

    const { GET } = await import("@/app/api/orders/[id]/stream/route");
    const req = new Request(`http://localhost/api/orders/${order.id}/stream`);
    const res = await GET(req, { params: { id: order.id } });

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toContain("no-cache");
  });
});