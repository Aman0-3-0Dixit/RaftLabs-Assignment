import type { Order } from "@/lib/repositories/types";

export interface OrderDTO {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  status: Order["status"];
  statusChangedAt: string;
  items: { id: string; menuItemName: string; quantity: number; unitPriceCents: number }[];
  createdAt: string;
}

export function toOrderDTO(order: Order): OrderDTO {
  return {
    id: order.id,
    customerName: order.customerName,
    address: order.address,
    phone: order.phone,
    status: order.status,
    statusChangedAt: order.statusChangedAt.toISOString(),
    items: order.items.map((i) => ({
      id: i.id,
      menuItemName: i.menuItemName,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}
