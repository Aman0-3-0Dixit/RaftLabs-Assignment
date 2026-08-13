"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuItem } from "@/lib/repositories/types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { lines, addItem, setQuantity } = useCart();
  const [imgLoaded, setImgLoaded] = useState(false);
  const line = lines.find((l) => l.menuItem.id === item.id);
  const quantity = line?.quantity ?? 0;

  return (
    <div className="ticket-notch flex h-full flex-col overflow-hidden rounded-b-lg bg-rail-paper text-rail-ink shadow-ticket">
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-rail-paper2">
        {/* next/image lazy-loads by default (no `priority` prop) and only
            requests the image once it's near the viewport. Combined with
            row virtualization above this component, off-screen cards don't
            even mount an <Image>, let alone fetch one. */}
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 480px) 100vw, (max-width: 1040px) 50vw, 25vw"
          onLoad={() => setImgLoaded(true)}
          className={`object-cover transition-opacity duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-rail-paper2" aria-hidden />
        )}
        <span className="absolute left-2 top-2 rounded bg-rail-bg/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rail-paper">
          {item.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-tight text-rail-ink">
            {item.name}
          </h3>
          <span className="whitespace-nowrap font-mono text-sm font-semibold text-rail-chili-dark">
            {formatPrice(item.priceCents)}
          </span>
        </div>
        <p className="line-clamp-2 flex-1 text-xs text-rail-ink/70">
          {item.description}
        </p>

        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => addItem(item, 1)}
            className="mt-1 rounded-md bg-rail-chili px-3 py-2 text-xs font-bold uppercase tracking-wide text-rail-paper transition hover:bg-rail-chili-dark active:scale-[0.98]"
          >
            Add to cart
          </button>
        ) : (
          <div className="mt-1 flex items-center justify-between rounded-md bg-rail-ink/5">
            <button
              type="button"
              aria-label={`Decrease quantity of ${item.name}`}
              onClick={() => setQuantity(item.id, quantity - 1)}
              className="px-3 py-2 text-sm font-bold text-rail-chili-dark hover:text-rail-chili"
            >
              −
            </button>
            <span className="font-mono text-sm font-semibold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              aria-label={`Increase quantity of ${item.name}`}
              onClick={() => setQuantity(item.id, quantity + 1)}
              className="px-3 py-2 text-sm font-bold text-rail-chili-dark hover:text-rail-chili"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
