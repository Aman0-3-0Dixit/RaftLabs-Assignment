import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { CartDrawer } from "../CartDrawer";
import type { MenuItem } from "@/lib/repositories/types";

const pizza: MenuItem = {
  id: "menu_margherita",
  name: "Margherita Pizza",
  description: "desc",
  priceCents: 129900,
  imageUrl: "https://example.com/pizza.jpg",
  category: "Pizza",
  isAvailable: true,
};

const burger: MenuItem = {
  id: "menu_classic_burger",
  name: "Classic Cheeseburger",
  description: "desc",
  priceCents: 89900,
  imageUrl: "https://example.com/burger.jpg",
  category: "Burgers",
  isAvailable: true,
};

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const cart = useCart();
  useEffect(() => {
    cart.addItem(pizza, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <CartDrawer isOpen onClose={onClose} />;
}

function renderDrawerWithItem(onClose = vi.fn()) {
  render(
    <CartProvider>
      <Harness onClose={onClose} />
    </CartProvider>
  );
  return onClose;
}

describe("CartDrawer", () => {
  it("shows an empty-cart message when there are no items", () => {
    render(
      <CartProvider>
        <CartDrawer isOpen onClose={vi.fn()} />
      </CartProvider>
    );
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });

  it("lists a seeded item with its price and quantity", () => {
    renderDrawerWithItem();
    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("₹1299.00 each")).toBeInTheDocument();
  });

  it("increments quantity via the stepper and reflects it in the subtotal", async () => {
    const user = userEvent.setup();
    renderDrawerWithItem();
    await user.click(screen.getByRole("button", { name: /increase quantity of margherita pizza/i }));

    // subtotal should now read 2 * 1299.00 = 2598.00
    expect(screen.getByText("₹2598.00")).toBeInTheDocument();
  });

  it("removes the item entirely via the remove button", async () => {
    const user = userEvent.setup();
    renderDrawerWithItem();
    await user.click(screen.getByRole("button", { name: /remove margherita pizza/i }));

    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });

  it("disables the checkout link when the cart is empty", () => {
    render(
      <CartProvider>
        <CartDrawer isOpen onClose={vi.fn()} />
      </CartProvider>
    );
    const checkoutLink = screen.getByRole("link", { name: /proceed to checkout/i });
    expect(checkoutLink).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the checkout link once an item is in the cart", () => {
    renderDrawerWithItem();
    const checkoutLink = screen.getByRole("link", { name: /proceed to checkout/i });
    expect(checkoutLink).toHaveAttribute("aria-disabled", "false");
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = renderDrawerWithItem();
    await user.click(document.querySelector('[aria-hidden]')!);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the close (×) button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = renderDrawerWithItem();
    await user.click(screen.getByRole("button", { name: /close cart/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("sums multiple distinct items into the correct subtotal", async () => {
    function MultiHarness() {
      const cart = useCart();
      useEffect(() => {
        cart.addItem(pizza, 1);
        cart.addItem(burger, 2);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return <CartDrawer isOpen onClose={vi.fn()} />;
    }
    render(
      <CartProvider>
        <MultiHarness />
      </CartProvider>
    );
    // 129900 + 2*89900 = 309700 -> ₹3097.00
    expect(screen.getByText("₹3097.00")).toBeInTheDocument();
  });
});