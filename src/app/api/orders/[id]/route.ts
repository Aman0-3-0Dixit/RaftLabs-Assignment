import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import { getOrder, updateOrderStatus } from "@/lib/handlers/orders-handler";
import { errorResponse } from "@/lib/handlers/respond";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const order = await getOrder(getRepository(), params.id);
    return NextResponse.json({ order });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const order = await updateOrderStatus(getRepository(), params.id, body);
    return NextResponse.json({ order });
  } catch (err) {
    return errorResponse(err);
  }
}
