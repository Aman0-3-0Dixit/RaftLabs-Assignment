"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { createOrderSchema } from "@/lib/validations";
import { formatPrice } from "@/lib/format";

export function CheckoutForm() {
  const router = useRouter();
  const { lines, totalCents, clearCart } = useCart();
  const [form, setForm] = useState({ customerName: "", address: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const payload = {
      ...form,
      items: lines.map((l) => ({ menuItemId: l.menuItem.id, quantity: l.quantity })),
    };
    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) errors[String(issue.path[0])] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong placing your order.");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch {
      setSubmitError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <p className="text-rail-paper/70">
        Your cart is empty. Add something from the menu before checking out.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_320px]" noValidate>
      <div className="ticket-notch flex flex-col gap-4 rounded-b-lg bg-rail-paper p-5 text-rail-ink shadow-ticket">
        <div>
          <label htmlFor="customerName" className="mb-1 block text-xs font-bold uppercase tracking-wide">
            Full name
          </label>
          <input
            id="customerName"
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            aria-invalid={!!fieldErrors.customerName}
            aria-describedby={fieldErrors.customerName ? "customerName-error" : undefined}
            className="w-full rounded-md border border-rail-ink/20 bg-white px-3 py-2 text-sm focus:border-rail-chili"
            placeholder="Aman Sharma"
          />
          {fieldErrors.customerName && (
            <p id="customerName-error" className="mt-1 text-xs text-rail-chili-dark">
              {fieldErrors.customerName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-xs font-bold uppercase tracking-wide">
            Delivery address
          </label>
          <textarea
            id="address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            aria-invalid={!!fieldErrors.address}
            aria-describedby={fieldErrors.address ? "address-error" : undefined}
            rows={3}
            className="w-full rounded-md border border-rail-ink/20 bg-white px-3 py-2 text-sm focus:border-rail-chili"
            placeholder="221B Residency Road, Indore, MP"
          />
          {fieldErrors.address && (
            <p id="address-error" className="mt-1 text-xs text-rail-chili-dark">
              {fieldErrors.address}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-bold uppercase tracking-wide">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            aria-invalid={!!fieldErrors.phone}
            aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
            className="w-full rounded-md border border-rail-ink/20 bg-white px-3 py-2 text-sm focus:border-rail-chili"
            placeholder="+91 98765 43210"
          />
          {fieldErrors.phone && (
            <p id="phone-error" className="mt-1 text-xs text-rail-chili-dark">
              {fieldErrors.phone}
            </p>
          )}
        </div>

        {submitError && (
          <p role="alert" className="rounded-md bg-rail-chili/10 p-2 text-sm text-rail-chili-dark">
            {submitError}
          </p>
        )}
      </div>

      <div className="ticket-notch flex h-fit flex-col gap-3 rounded-b-lg bg-rail-paper p-5 text-rail-ink shadow-ticket">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide">Order Summary</h3>
        <ul className="flex flex-col gap-1 text-sm">
          {lines.map((l) => (
            <li key={l.menuItem.id} className="flex justify-between gap-2">
              <span className="truncate">
                {l.quantity} × {l.menuItem.name}
              </span>
              <span className="font-mono">{formatPrice(l.quantity * l.menuItem.priceCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-rail-ink/10 pt-2 text-sm font-bold">
          <span>Total</span>
          <span className="font-mono">{formatPrice(totalCents)}</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-rail-chili py-3 text-sm font-bold uppercase tracking-wide text-rail-paper transition hover:bg-rail-chili-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </form>
  );
}
