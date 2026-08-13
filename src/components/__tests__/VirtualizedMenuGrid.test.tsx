import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { VirtualizedMenuGrid } from "../VirtualizedMenuGrid";
import { CartProvider } from "@/context/CartContext";
import { MENU_SEED } from "@/lib/seed-data";

afterEach(() => {
  cleanup();
  delete (window as unknown as { __mockResizeWidth?: number }).__mockResizeWidth;
});

function renderGrid(items = MENU_SEED, width = 1000) {
  (window as unknown as { __mockResizeWidth?: number }).__mockResizeWidth = width;
  return render(
    <CartProvider>
      <VirtualizedMenuGrid items={items} />
    </CartProvider>
  );
}

describe("VirtualizedMenuGrid", () => {
  it("shows an empty state when there are no items", () => {
    renderGrid([]);
    expect(screen.getByText(/no dishes match/i)).toBeInTheDocument();
  });

  it("renders only a subset of the 30-item menu, not all of it at once", () => {
    renderGrid(MENU_SEED, 1000); // wide viewport -> 4 columns
    // With a bounded list height and fixed row height, react-window should
    // only mount a handful of rows (visible + overscan), not all ~8 rows'
    // worth of cards for every item simultaneously rendered off-screen.
    const renderedCards = screen.getAllByRole("button", { name: /add to cart/i });
    expect(renderedCards.length).toBeGreaterThan(0);
    expect(renderedCards.length).toBeLessThan(MENU_SEED.length);
  });

  it("renders the first item's name so the happy path actually works end to end", () => {
    renderGrid(MENU_SEED, 1000);
    expect(screen.getByText(MENU_SEED[0].name)).toBeInTheDocument();
  });
});
