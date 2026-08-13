import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "../CartContext";
import type { MenuItem } from "@/lib/repositories/types";

const pizza: MenuItem = {
  id: "menu_margherita",
  name: "Margherita Pizza",
  description: "desc",
  priceCents: 1299,
  imageUrl: "x",
  category: "Pizza",
  isAvailable: true,
};

const burger: MenuItem = {
  id: "menu_classic_burger",
  name: "Classic Cheeseburger",
  description: "desc",
  priceCents: 899,
  imageUrl: "x",
  category: "Burgers",
  isAvailable: true,
};

function setup() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

describe("useCart", () => {
  it("starts empty", () => {
    const { result } = setup();
    expect(result.current.lines).toHaveLength(0);
    expect(result.current.totalCents).toBe(0);
  });

  it("adds an item and computes the total", () => {
    const { result } = setup();
    act(() => result.current.addItem(pizza, 2));
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalCents).toBe(2598);
  });

  it("accumulates quantity when adding the same item twice", () => {
    const { result } = setup();
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(pizza, 1));
    expect(result.current.lines).toHaveLength(1);
    expect(result.current.lines[0].quantity).toBe(2);
  });

  it("sums totals correctly across multiple distinct items", () => {
    const { result } = setup();
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(burger, 2));
    expect(result.current.totalCents).toBe(1299 + 899 * 2);
  });

  it("removes the line entirely when quantity is set to zero", () => {
    const { result } = setup();
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.setQuantity(pizza.id, 0));
    expect(result.current.lines).toHaveLength(0);
  });

  it("clears the whole cart", () => {
    const { result } = setup();
    act(() => result.current.addItem(pizza, 1));
    act(() => result.current.addItem(burger, 1));
    act(() => result.current.clearCart());
    expect(result.current.lines).toHaveLength(0);
  });
});
