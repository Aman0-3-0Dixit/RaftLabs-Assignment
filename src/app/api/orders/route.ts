import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import { createOrder, listOrders } from "@/lib/handlers/orders-handler";
import { errorResponse } from "@/lib/handlers/respond";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = await createOrder(getRepository(), body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET() {
  try {
    const orders = await listOrders(getRepository());
    return NextResponse.json({ orders });
  } catch (err) {
    return errorResponse(err);
  }
}
