import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderStatusTicket } from "../OrderStatusTicket";
import { MockEventSource } from "@/test-utils/mock-event-source";
import type { OrderDTO } from "@/lib/order-dto";

function makeOrder(overrides: Partial<OrderDTO> = {}): OrderDTO {
  return {
    id: "order_abc12345",
    customerName: "Aman Sharma",
    address: "221B Residency Rd, Indore",
    phone: "+91 98765 43210",
    status: "RECEIVED",
    statusChangedAt: new Date().toISOString(),
    items: [
      { id: "item_1", menuItemName: "Margherita Pizza", quantity: 1, unitPriceCents: 1299 },
    ],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  MockEventSource.reset();
  vi.stubGlobal("EventSource", MockEventSource);
  vi.stubGlobal("fetch", vi.fn());
});

describe("OrderStatusTicket", () => {
  it("renders the progress rail and marks the current step for an in-progress order", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "PREPARING" })} />);
    const preparingStep = screen.getByText("Preparing").closest("div");
    expect(preparingStep?.querySelector('[aria-current="step"]')).toBeInTheDocument();
  });

  it("shows the cancel button for a cancellable status", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "CONFIRMED" })} />);
    expect(screen.getByRole("button", { name: /cancel order/i })).toBeInTheDocument();
  });

  it("hides the cancel button once the order has been delivered", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "DELIVERED" })} />);
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();
  });

  it("shows the delayed banner instead of pretending progress is linear", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "DELAYED" })} />);
    expect(screen.getByText(/running a little behind/i)).toBeInTheDocument();
  });

  it("renders a distinct terminal view for a cancelled order, not the step rail", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "CANCELLED" })} />);
    expect(screen.getByText(/order cancelled/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/order progress/i)).not.toBeInTheDocument();
  });

  it("renders a distinct terminal view for a failed delivery", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "FAILED_DELIVERY" })} />);
    expect(screen.getByText(/delivery attempt failed/i)).toBeInTheDocument();
  });

  it("updates live when the SSE stream pushes a new status", () => {
    render(<OrderStatusTicket order={makeOrder({ status: "RECEIVED" })} />);
    act(() => MockEventSource.instances[0].emit("status", { status: "OUT_FOR_DELIVERY" }));
    const step = screen.getByText("Out For Delivery").closest("div");
    expect(step?.querySelector('[aria-current="step"]')).toBeInTheDocument();
  });

  it("cancels the order and switches to the cancelled view on success", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ order: { status: "CANCELLED" } }),
    });
    const user = userEvent.setup();
    render(<OrderStatusTicket order={makeOrder({ status: "RECEIVED" })} />);

    await user.click(screen.getByRole("button", { name: /cancel order/i }));

    await waitFor(() => expect(screen.getByText(/order cancelled/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      "/api/orders/order_abc12345",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("shows an error and stays put if cancellation is rejected by the server", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Order cannot be cancelled once it is preparing" }),
    });
    const user = userEvent.setup();
    render(<OrderStatusTicket order={makeOrder({ status: "PREPARING" })} />);

    await user.click(screen.getByRole("button", { name: /cancel order/i }));

    expect(await screen.findByText(/cannot be cancelled/i)).toBeInTheDocument();
    expect(screen.queryByText(/order cancelled/i)).not.toBeInTheDocument();
  });
});