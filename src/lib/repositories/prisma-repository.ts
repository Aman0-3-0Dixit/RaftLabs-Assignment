import { PrismaClient } from "@prisma/client";
import type {
  MenuItem,
  NewOrderItemInput,
  Order,
  OrderRepository,
} from "./types";
import { TRANSITIONS, type OrderStatus } from "@/lib/order-status/engine";

function toDomainOrder(order: {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  status: string;
  statusChangedAt: Date;
  nextEligibleAt: Date;
  createdAt: Date;
  items: {
    id: string;
    menuItemId: string;
    quantity: number;
    unitPriceCents: number;
    menuItem: { name: string };
  }[];
}): Order {
  return {
    id: order.id,
    customerName: order.customerName,
    address: order.address,
    phone: order.phone,
    status: order.status as OrderStatus,
    statusChangedAt: order.statusChangedAt,
    nextEligibleAt: order.nextEligibleAt,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      menuItemName: i.menuItem.name,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
  };
}

const ORDER_INCLUDE = { items: { include: { menuItem: true } } } as const;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async listMenuItems(): Promise<MenuItem[]> {
    const items = await this.prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { category: "asc" },
    });
    return items;
  }

  async getMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({ where: { id: { in: ids } } });
  }

  async createOrder(input: {
    customerName: string;
    address: string;
    phone: string;
    items: NewOrderItemInput[];
  }): Promise<Order> {
    const menuItems = await this.getMenuItemsByIds(
      input.items.map((i) => i.menuItemId)
    );
    const byId = new Map(menuItems.map((m) => [m.id, m]));

    const initialStatus: OrderStatus = "RECEIVED";
    const now = new Date();

    const order = await this.prisma.order.create({
      data: {
        customerName: input.customerName,
        address: input.address,
        phone: input.phone,
        status: initialStatus,
        statusChangedAt: now,
        nextEligibleAt: new Date(
          now.getTime() + TRANSITIONS[initialStatus].durationSeconds * 1000
        ),
        items: {
          create: input.items.map((i) => {
            const menuItem = byId.get(i.menuItemId);
            if (!menuItem) {
              throw new Error(`Unknown menu item: ${i.menuItemId}`);
            }
            return {
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              unitPriceCents: menuItem.priceCents, // price snapshot
            };
          }),
        },
      },
      include: ORDER_INCLUDE,
    });

    return toDomainOrder(order);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    return order ? toDomainOrder(order) : null;
  }

  async listOrders(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(toDomainOrder);
  }

  async saveOrderStatus(
    id: string,
    next: { status: OrderStatus; statusChangedAt: Date; nextEligibleAt: Date }
  ): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: next,
      include: ORDER_INCLUDE,
    });
    return toDomainOrder(order);
  }
}
