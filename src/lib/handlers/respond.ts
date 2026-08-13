import { NextResponse } from "next/server";
import { HandlerError } from "./orders-handler";

export function errorResponse(err: unknown) {
  if (err instanceof HandlerError) {
    return NextResponse.json(
      { error: err.message, details: err.details ?? null },
      { status: err.status }
    );
  }
  console.error("Unexpected error:", err);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
