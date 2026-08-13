import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "@/context/CartContext";
import { MenuItemCard } from "../MenuItemCard";
import type { MenuItem } from "@/lib/repositories/types";

const pizza: MenuItem = {
  id: "menu_margherita",
  name: "Margherita Pizza",
  description: "San Marzano tomato, fresh mozzarella, basil, olive oil.",
  priceCents: 129900,
  imageUrl: "https://example.com/pizza.jpg",
  category: "Pizza",
  isAvailable: true,
};

function renderCard(item: MenuItem = pizza) {
  return render(
    <CartProvider>
      <MenuItemCard item={item} />
    </CartProvider>
  );
}

describe("MenuItemCard", () => {
  it("renders the item's name, price, and category", () => {
    renderCard();
    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("₹1299.00")).toBeInTheDocument();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });

  it("shows an 'Add to cart' button when the item is not yet in the cart", () => {
    renderCard();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("switches to a quantity stepper after adding to the cart", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    expect(screen.queryByRole("button", { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("increments the quantity via the stepper", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /increase quantity/i }));

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("returns to the 'Add to cart' button once quantity is decremented to zero", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    await user.click(screen.getByRole("button", { name: /decrease quantity/i }));

    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });
});