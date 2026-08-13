import { describe, it, expect } from "vitest";
import { createOrderSchema, cancelOrderSchema } from "../validations";

const validOrder = {
  customerName: "Aman Sharma",
  address: "221B Residency Rd, Indore",
  phone: "+91 98765 43210",
  items: [{ menuItemId: "menu_margherita", quantity: 1 }],
};

describe("createOrderSchema — customerName", () => {
  it("accepts a normal name", () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true);
  });

  it("rejects a name under 2 characters", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, customerName: "A" });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2 characters (the minimum)", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, customerName: "Al" });
    expect(result.success).toBe(true);
  });

  it("rejects a name over 100 characters", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      customerName: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace before checking length, so padded-but-empty fails", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, customerName: "  A  " });
    expect(result.success).toBe(false); // trims to "A", length 1, under the minimum
  });
});

describe("createOrderSchema — address", () => {
  it("rejects an address under 5 characters", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, address: "Rd" });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 5 characters (the minimum)", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, address: "12345" });
    expect(result.success).toBe(true);
  });

  it("rejects an address over 300 characters", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, address: "A".repeat(301) });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema — phone", () => {
  it.each([
    "+91 98765 43210",
    "9876543210",
    "(987) 654-3210",
    "987-654-3210",
  ])("accepts a realistic phone format: %s", (phone) => {
    expect(createOrderSchema.safeParse({ ...validOrder, phone }).success).toBe(true);
  });

  it("rejects letters in the phone number", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, phone: "98765abcde" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number shorter than 7 characters", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects a phone number longer than 20 characters", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, phone: "1".repeat(21) });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema — items", () => {
  it("rejects an empty cart", () => {
    const result = createOrderSchema.safeParse({ ...validOrder, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity of 0", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "menu_margherita", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative quantity", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "menu_margherita", quantity: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "menu_margherita", quantity: 2.5 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a quantity of exactly 20 (the max)", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "menu_margherita", quantity: 20 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a quantity of 21 (over the max)", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "menu_margherita", quantity: 21 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a cart with more than 50 distinct line items", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      menuItemId: `menu_${i}`,
      quantity: 1,
    }));
    const result = createOrderSchema.safeParse({ ...validOrder, items });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 50 distinct line items", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      menuItemId: `menu_${i}`,
      quantity: 1,
    }));
    const result = createOrderSchema.safeParse({ ...validOrder, items });
    expect(result.success).toBe(true);
  });

  it("rejects an item missing a menuItemId", () => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("cancelOrderSchema", () => {
  it("accepts the literal cancel action", () => {
    expect(cancelOrderSchema.safeParse({ action: "cancel" }).success).toBe(true);
  });

  it("rejects any other action string", () => {
    expect(cancelOrderSchema.safeParse({ action: "delete" }).success).toBe(false);
  });

  it("rejects a missing action field", () => {
    expect(cancelOrderSchema.safeParse({}).success).toBe(false);
  });
});