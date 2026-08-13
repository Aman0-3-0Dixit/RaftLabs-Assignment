"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lines, totalCents, setQuantity, removeItem } = useCart();

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm transform flex-col bg-rail-paper text-rail-ink shadow-ticket transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-rail-ink/10 p-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">Your Order</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded p-1 text-xl leading-none hover:bg-rail-ink/10"
          >
            ×
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <p className="mt-8 text-center text-sm text-rail-ink/60">
              Your cart is empty — add something from the menu.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li
                  key={line.menuItem.id}
                  className="flex items-center gap-3 rounded-lg border border-rail-ink/10 p-2"
                >
                  <Image
                    src={line.menuItem.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 flex-shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{line.menuItem.name}</p>
                    <p className="font-mono text-xs text-rail-ink/60">
                      {formatPrice(line.menuItem.priceCents)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${line.menuItem.name}`}
                      onClick={() => setQuantity(line.menuItem.id, line.quantity - 1)}
                      className="h-7 w-7 rounded bg-rail-ink/10 text-sm font-bold hover:bg-rail-ink/20"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-mono text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${line.menuItem.name}`}
                      onClick={() => setQuantity(line.menuItem.id, line.quantity + 1)}
                      className="h-7 w-7 rounded bg-rail-ink/10 text-sm font-bold hover:bg-rail-ink/20"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${line.menuItem.name} from cart`}
                    onClick={() => removeItem(line.menuItem.id)}
                    className="text-rail-chili-dark hover:text-rail-chili"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-rail-ink/10 p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(totalCents)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={lines.length === 0 ? (e) => e.preventDefault() : onClose}
            aria-disabled={lines.length === 0}
            className={`block rounded-md py-3 text-center text-sm font-bold uppercase tracking-wide transition ${
              lines.length === 0
                ? "cursor-not-allowed bg-rail-ink/20 text-rail-ink/40"
                : "bg-rail-chili text-rail-paper hover:bg-rail-chili-dark"
            }`}
          >
            Proceed to Checkout
          </Link>
        </div>
      </aside>
    </>
  );
}
