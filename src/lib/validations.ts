import { z } from "zod";

// A deliberately permissive but real phone check: digits, spaces, dashes,
// parens, and an optional leading +, 7-15 digits total. Good enough to
// reject garbage without being a specific country's format.
const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1, "menuItemId is required"),
  quantity: z
    .number()
    .int("quantity must be a whole number")
    .positive("quantity must be at least 1")
    .max(20, "quantity cannot exceed 20 per item"),
});

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  address: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address is too long"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number"),
  items: z
    .array(cartItemSchema)
    .min(1, "Cart must contain at least one item")
    .max(50, "Too many distinct items in one order"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const cancelOrderSchema = z.object({
  action: z.literal("cancel"),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
