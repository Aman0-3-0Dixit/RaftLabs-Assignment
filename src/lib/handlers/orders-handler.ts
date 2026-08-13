import { createOrderSchema, cancelOrderSchema } from "@/lib/validations";
import type { OrderRepository, Order } from "@/lib/repositories/types";
import { computeCurrentStatus, canCancel } from "@/lib/order-status/engine";

export class HandlerError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Recomputes and persists the order's live status before returning it. */
export async function withLiveStatus(
  repo: OrderRepository,
  order: Order,
  now: Date = new Date()
): Promise<Order> {
  const result = computeCurrentStatus(
    { status: order.status, statusChangedAt: order.statusChangedAt, nextEligibleAt: order.nextEligibleAt },
    now
  );
  if (!result.changed) return order;
  return repo.saveOrderStatus(order.id, {
    status: result.status,
    statusChangedAt: result.statusChangedAt,
    nextEligibleAt: result.nextEligibleAt,
  });
}

export async function createOrder(repo: OrderRepository, rawInput: unknown) {
  const parsed = createOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new HandlerError(400, "Invalid order details", parsed.error.flatten());
  }
  const input = parsed.data;

  // Validate every item actually exists on the menu before creating
  // anything — never trust client-supplied prices or item identity.
  const menuItems = await repo.getMenuItemsByIds(input.items.map((i) => i.menuItemId));
  const menuIds = new Set(menuItems.map((m) => m.id));
  const unknown = input.items.filter((i) => !menuIds.has(i.menuItemId));
  if (unknown.length > 0) {
    throw new HandlerError(400, "Cart contains items that are no longer on the menu", {
      unknownItemIds: unknown.map((i) => i.menuItemId),
    });
  }
  const unavailable = menuItems.filter((m) => !m.isAvailable);
  if (unavailable.length > 0) {
    throw new HandlerError(400, "Cart contains items that are currently unavailable", {
      unavailableItemIds: unavailable.map((m) => m.id),
    });
  }

  const order = await repo.createOrder({
    customerName: input.customerName,
    address: input.address,
    phone: input.phone,
    items: input.items,
  });
  return order;
}

export async function getOrder(repo: OrderRepository, id: string) {
  if (!id) throw new HandlerError(400, "Order id is required");
  const order = await repo.getOrderById(id);
  if (!order) throw new HandlerError(404, "Order not found");
  return withLiveStatus(repo, order);
}

export async function listOrders(repo: OrderRepository) {
  const orders = await repo.listOrders();
  return Promise.all(orders.map((o) => withLiveStatus(repo, o)));
}

export async function updateOrderStatus(repo: OrderRepository, id: string, rawInput: unknown) {
  const parsed = cancelOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new HandlerError(400, "Invalid status update", parsed.error.flatten());
  }
  const order = await getOrder(repo, id); // live status first, so we cancel from the true current state
  if (!canCancel(order.status)) {
    throw new HandlerError(
      409,
      `Order cannot be cancelled once it is ${order.status.replace(/_/g, " ").toLowerCase()}`
    );
  }
  const now = new Date();
  return repo.saveOrderStatus(id, {
    status: "CANCELLED",
    statusChangedAt: now,
    nextEligibleAt: now,
  });
}
