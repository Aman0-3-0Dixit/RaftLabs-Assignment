import { notFound } from "next/navigation";
import { getRepository } from "@/lib/db";
import { getOrder, HandlerError } from "@/lib/handlers/orders-handler";
import { toOrderDTO } from "@/lib/order-dto";
import { OrderStatusTicket } from "@/components/OrderStatusTicket";

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: { id: string } }) {
  try {
    const order = await getOrder(getRepository(), params.id);
    return (
      <div>
        <OrderStatusTicket order={toOrderDTO(order)} />
      </div>
    );
  } catch (err) {
    if (err instanceof HandlerError && err.status === 404) notFound();
    throw err;
  }
}
