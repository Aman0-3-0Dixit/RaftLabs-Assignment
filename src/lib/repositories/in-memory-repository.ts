import type {
  MenuItem,
  NewOrderItemInput,
  Order,
  OrderRepository,
} from "./types";
import { TRANSITIONS, type OrderStatus } from "@/lib/order-status/engine";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export class InMemoryOrderRepository implements OrderRepository {
  private menuItems: MenuItem[];
  private orders: Map<string, Order> = new Map();

  constructor(seedMenuItems: MenuItem[]) {
    this.menuItems = seedMenuItems;
  }

  async listMenuItems(): Promise<MenuItem[]> {
    return this.menuItems;
  }

  async getMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    const set = new Set(ids);
    return this.menuItems.filter((m) => set.has(m.id));
  }

  async createOrder(input: {
    customerName: string;
    address: string;
    phone: string;
    items: NewOrderItemInput[];
  }): Promise<Order> {
    const now = new Date();
    const initialStatus: OrderStatus = "RECEIVED";
    const items = input.items.map((i) => {
      const menuItem = this.menuItems.find((m) => m.id === i.menuItemId);
      if (!menuItem) {
        throw new Error(`Unknown menu item: ${i.menuItemId}`);
      }
      return {
        id: nextId("item"),
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: i.quantity,
        unitPriceCents: menuItem.priceCents, // price snapshot at order time
      };
    });

    const order: Order = {
      id: nextId("order"),
      customerName: input.customerName,
      address: input.address,
      phone: input.phone,
      status: initialStatus,
      statusChangedAt: now,
      nextEligibleAt: new Date(
        now.getTime() + TRANSITIONS[initialStatus].durationSeconds * 1000
      ),
      items,
      createdAt: now,
    };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async saveOrderStatus(
    id: string,
    next: { status: OrderStatus; statusChangedAt: Date; nextEligibleAt: Date }
  ): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order not found: ${id}`);
    const updated: Order = { ...order, ...next };
    this.orders.set(id, updated);
    return updated;
  }
}
