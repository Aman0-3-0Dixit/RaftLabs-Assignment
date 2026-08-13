import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import { errorResponse } from "@/lib/handlers/respond";

export async function GET() {
  try {
    const items = await getRepository().listMenuItems();
    return NextResponse.json({ items });
  } catch (err) {
    return errorResponse(err);
  }
}
