import { describe, it, expect, vi, beforeEach } from "vitest";
import { InMemoryOrderRepository } from "@/lib/repositories/in-memory-repository";
import { MENU_SEED } from "@/lib/seed-data";

let repo: InMemoryOrderRepository;

vi.mock("@/lib/db", () => ({
  getRepository: () => repo,
}));

describe("API routes", () => {
  beforeEach(() => {
    repo = new InMemoryOrderRepository(MENU_SEED);
    vi.resetModules();
  });

  it("GET /api/menu returns the seeded menu items", async () => {
    const { GET } = await import("@/app/api/menu/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
  });

  it("POST /api/orders creates an order and returns 201", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Aman Sharma",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [{ menuItemId: "menu_margherita", quantity: 1 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.order.status).toBe("RECEIVED");
  });

  it("POST /api/orders returns 400 for an invalid payload", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const req = new Request("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({ customerName: "", address: "", phone: "", items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("GET /api/orders/[id] returns 404 for an unknown order", async () => {
    const { GET } = await import("@/app/api/orders/[id]/route");
    const req = new Request("http://localhost/api/orders/nope");
    const res = await GET(req, { params: { id: "nope" } });
    expect(res.status).toBe(404);
  });

  it("PATCH /api/orders/[id] cancels a cancellable order", async () => {
    const { POST } = await import("@/app/api/orders/route");
    const createReq = new Request("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Aman Sharma",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [{ menuItemId: "menu_margherita", quantity: 1 }],
      }),
    });
    const createRes = await POST(createReq);
    const { order } = await createRes.json();

    const { PATCH } = await import("@/app/api/orders/[id]/route");
    const patchReq = new Request(`http://localhost/api/orders/${order.id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel" }),
    });
    const res = await PATCH(patchReq, { params: { id: order.id } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe("CANCELLED");
  });
});
