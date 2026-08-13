import { describe, it, expect, beforeEach, vi } from "vitest";
import { InMemoryOrderRepository } from "@/lib/repositories/in-memory-repository";
import { MENU_SEED } from "@/lib/seed-data";
import {
  createOrder,
  getOrder,
  updateOrderStatus,
  HandlerError,
} from "../orders-handler";

describe("createOrder", () => {
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository(MENU_SEED);
  });

  it("creates an order and snapshots the current menu price per item", async () => {
    const order = await createOrder(repo, {
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 2 }],
    });
    expect(order.status).toBe("RECEIVED");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].unitPriceCents).toBe(1299);
    expect(order.items[0].quantity).toBe(2);
  });

  it("rejects a payload with a missing customer name", async () => {
    await expect(
      createOrder(repo, {
        customerName: "",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [{ menuItemId: "menu_margherita", quantity: 1 }],
      })
    ).rejects.toBeInstanceOf(HandlerError);
  });

  it("rejects an empty cart", async () => {
    await expect(
      createOrder(repo, {
        customerName: "Aman Sharma",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a cart referencing a menu item that doesn't exist", async () => {
    await expect(
      createOrder(repo, {
        customerName: "Aman Sharma",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [{ menuItemId: "menu_does_not_exist", quantity: 1 }],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an unavailable menu item", async () => {
    const repoWithUnavailable = new InMemoryOrderRepository([
      { ...MENU_SEED[0], isAvailable: false },
    ]);
    await expect(
      createOrder(repoWithUnavailable, {
        customerName: "Aman Sharma",
        address: "221B Residency Rd, Indore",
        phone: "+91 98765 43210",
        items: [{ menuItemId: MENU_SEED[0].id, quantity: 1 }],
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("getOrder", () => {
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository(MENU_SEED);
    vi.useRealTimers();
  });

  it("throws 404 for an unknown order id", async () => {
    await expect(getOrder(repo, "nope")).rejects.toMatchObject({ status: 404 });
  });

  it("advances and persists the live status based on elapsed time", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const order = await createOrder(repo, {
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });
    expect(order.status).toBe("RECEIVED");

    // Jump forward past the RECEIVED -> CONFIRMED threshold.
    vi.setSystemTime(new Date("2026-01-01T00:00:10.000Z"));
    const refreshed = await getOrder(repo, order.id);
    expect(refreshed.status).not.toBe("RECEIVED");
    vi.useRealTimers();
  });
});

describe("updateOrderStatus (cancellation)", () => {
  let repo: InMemoryOrderRepository;

  beforeEach(() => {
    repo = new InMemoryOrderRepository(MENU_SEED);
  });

  it("cancels a freshly placed order", async () => {
    const order = await createOrder(repo, {
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });
    const cancelled = await updateOrderStatus(repo, order.id, { action: "cancel" });
    expect(cancelled.status).toBe("CANCELLED");
  });

  it("refuses to cancel an order that has already been delivered", async () => {
    const order = await createOrder(repo, {
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
    await expect(
      updateOrderStatus(repo, order.id, { action: "cancel" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a malformed status update body", async () => {
    const order = await createOrder(repo, {
      customerName: "Aman Sharma",
      address: "221B Residency Rd, Indore",
      phone: "+91 98765 43210",
      items: [{ menuItemId: "menu_margherita", quantity: 1 }],
    });
    await expect(
      updateOrderStatus(repo, order.id, { action: "not-a-real-action" })
    ).rejects.toMatchObject({ status: 400 });
  });
});
