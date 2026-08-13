import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { CheckoutForm } from "../CheckoutForm";
import type { MenuItem } from "@/lib/repositories/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const pizza: MenuItem = {
  id: "menu_margherita",
  name: "Margherita Pizza",
  description: "desc",
  priceCents: 1299,
  imageUrl: "x",
  category: "Pizza",
  isAvailable: true,
};

/** Seeds the cart with an item before rendering CheckoutForm, since the
 * component reads whatever's already in context. */
function Harness({ quantity = 1 }: { quantity?: number }) {
  const cart = useCart();
  useEffect(() => {
    cart.addItem(pizza, quantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <CheckoutForm />;
}

function renderCheckout(quantity = 1) {
  return render(
    <CartProvider>
      <Harness quantity={quantity} />
    </CartProvider>
  );
}

beforeEach(() => {
  pushMock.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

describe("CheckoutForm", () => {
  it("shows an empty-cart message and no form when the cart is empty", () => {
    render(
      <CartProvider>
        <CheckoutForm />
      </CartProvider>
    );
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("renders the order summary with the correct total for the seeded cart", () => {
    renderCheckout(2);
    expect(screen.getByText(/2 × Margherita Pizza/i)).toBeInTheDocument();
    expect(screen.getAllByText("₹25.98")).toHaveLength(2); // line item + total
  });

  it("shows validation errors and does not submit when fields are left blank", async () => {
    const user = userEvent.setup();
    renderCheckout();
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText(/name must be at least/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits valid details and redirects to the new order's status page", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ order: { id: "order_123", status: "RECEIVED" } }),
    });
    const user = userEvent.setup();
    renderCheckout();

    await user.type(screen.getByLabelText(/full name/i), "Aman Sharma");
    await user.type(screen.getByLabelText(/delivery address/i), "221B Residency Rd, Indore");
    await user.type(screen.getByLabelText(/phone number/i), "+91 98765 43210");
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/orders/order_123"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("surfaces a server-side error and does not redirect", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Cart contains items that are no longer on the menu" }),
    });
    const user = userEvent.setup();
    renderCheckout();

    await user.type(screen.getByLabelText(/full name/i), "Aman Sharma");
    await user.type(screen.getByLabelText(/delivery address/i), "221B Residency Rd, Indore");
    await user.type(screen.getByLabelText(/phone number/i), "+91 98765 43210");
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no longer on the menu/i);
    expect(pushMock).not.toHaveBeenCalled();
  });
});