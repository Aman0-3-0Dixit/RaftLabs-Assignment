"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CartDrawer } from "./CartDrawer";

export function Header() {
  const [isCartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rail-paper/10 bg-rail-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="font-display text-xl font-black uppercase tracking-tight text-rail-paper"
          >
            Order<span className="text-rail-chili">Rail</span>
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${totalItems} item${
              totalItems === 1 ? "" : "s"
            }`}
            className="relative rounded-md bg-rail-paper/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-rail-paper transition hover:bg-rail-paper/20"
          >
            Cart

            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rail-chili font-mono text-[11px] font-bold text-rail-paper">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}