import type { OrderStatus } from "@/lib/order-status/engine";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  status: OrderStatus;
  statusChangedAt: Date;
  nextEligibleAt: Date;
  items: OrderItem[];
  createdAt: Date;
}

export interface NewOrderItemInput {
  menuItemId: string;
  quantity: number;
}

/**
 * Data-access boundary. API routes depend on this interface, not on
 * Prisma directly, so the core request-handling logic (validation,
 * pricing, status transitions) can be unit tested with an in-memory fake
 * and never needs a live database in CI.
 */
export interface OrderRepository {
  listMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByIds(ids: string[]): Promise<MenuItem[]>;
  createOrder(input: {
    customerName: string;
    address: string;
    phone: string;
    items: NewOrderItemInput[];
  }): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
  saveOrderStatus(
    id: string,
    next: { status: OrderStatus; statusChangedAt: Date; nextEligibleAt: Date }
  ): Promise<Order>;
}
