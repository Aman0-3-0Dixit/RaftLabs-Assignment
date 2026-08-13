"use client";

import { useState } from "react";
import type { OrderDTO } from "@/lib/order-dto";
import type { OrderStatus } from "@/lib/order-status/engine";
import { canCancel } from "@/lib/order-status/engine";
import { useOrderStatusStream } from "@/hooks/useOrderStatusStream";
import { formatPrice, formatStatusLabel } from "@/lib/format";

const MAIN_STEPS: OrderStatus[] = [
  "RECEIVED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function mainStepIndex(status: OrderStatus): number {
  if (status === "DELAYED") return MAIN_STEPS.indexOf("PREPARING");
  return MAIN_STEPS.indexOf(status);
}

export function OrderStatusTicket({ order }: { order: OrderDTO }) {
  const { status, connection, setStatus } = useOrderStatusStream(order.id, order.status);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isVoided = status === "CANCELLED" || status === "FAILED_DELIVERY";
  const activeIndex = mainStepIndex(status);
  const totalCents = order.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? "Could not cancel this order.");
        return;
      }
      setStatus(data.order.status);
    } catch {
      setCancelError("Network error — please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="ticket-notch mx-auto max-w-lg rounded-b-lg bg-rail-paper p-6 text-rail-ink shadow-ticket">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-rail-ink/50">
            Order #{order.id.slice(-8)}
          </p>
          <h1 className="font-display text-xl font-black uppercase tracking-tight">
            {isVoided ? "Order Update" : "On its way"}
          </h1>
        </div>
        <ConnectionBadge connection={connection} />
      </div>

      {status === "DELAYED" && (
        <div className="mb-4 rounded-md bg-rail-mustard/20 px-3 py-2 text-sm text-rail-ink">
          Running a little behind — the kitchen is catching up. Thanks for your patience.
        </div>
      )}

      {isVoided ? (
        <div
          className={`mb-4 rounded-md border-2 border-dashed p-4 text-center ${
            status === "CANCELLED"
              ? "border-rail-chili text-rail-chili-dark"
              : "border-rail-mustard text-rail-ink"
          }`}
        >
          <p className="font-display text-lg font-bold uppercase tracking-wide">
            {status === "CANCELLED" ? "Order Cancelled" : "Delivery Attempt Failed"}
          </p>
          <p className="mt-1 text-sm text-rail-ink/70">
            {status === "CANCELLED"
              ? "This order was cancelled and will not be prepared."
              : "Our courier couldn't complete delivery. Our support team has been notified and will reach out shortly."}
          </p>
        </div>
      ) : (
        <ol className="mb-6 flex items-center" aria-label="Order progress">
          {MAIN_STEPS.map((step, i) => {
            const done = i < activeIndex || status === "DELIVERED" && i <= activeIndex;
            const active = i === activeIndex && status !== "DELIVERED";
            return (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-colors ${
                      done || i <= activeIndex
                        ? "border-rail-sage bg-rail-sage text-white"
                        : "border-rail-ink/20 bg-transparent text-rail-ink/40"
                    } ${active ? "animate-pulse ring-2 ring-rail-mustard" : ""}`}
                    aria-current={active ? "step" : undefined}
                  >
                    {i <= activeIndex ? "✓" : i + 1}
                  </div>
                  <span className="max-w-[70px] text-center text-[10px] font-semibold uppercase leading-tight text-rail-ink/70">
                    {formatStatusLabel(step)}
                  </span>
                </div>
                {i < MAIN_STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 ${
                      i < activeIndex ? "bg-rail-sage" : "bg-rail-ink/15"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="border-t border-dashed border-rail-ink/20 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rail-ink/50">
          {order.customerName} · {order.phone}
        </p>
        <ul className="mb-2 flex flex-col gap-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity} × {item.menuItemName}
              </span>
              <span className="font-mono">{formatPrice(item.quantity * item.unitPriceCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-rail-ink/10 pt-2 text-sm font-bold">
          <span>Total</span>
          <span className="font-mono">{formatPrice(totalCents)}</span>
        </div>
      </div>

      {canCancel(status) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full rounded-md border border-rail-chili px-3 py-2 text-xs font-bold uppercase tracking-wide text-rail-chili-dark transition hover:bg-rail-chili/10 disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel Order"}
          </button>
          {cancelError && <p className="mt-1 text-xs text-rail-chili-dark">{cancelError}</p>}
        </div>
      )}
    </div>
  );
}

function ConnectionBadge({ connection }: { connection: string }) {
  const label =
    connection === "live"
      ? "Live"
      : connection === "reconnecting"
      ? "Reconnecting…"
      : connection === "connecting"
      ? "Connecting…"
      : "Final";
  const dotColor =
    connection === "live" ? "bg-rail-sage" : connection === "closed" ? "bg-rail-ink/30" : "bg-rail-mustard";
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-rail-ink/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-rail-ink/60">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden />
      {label}
    </span>
  );
}
