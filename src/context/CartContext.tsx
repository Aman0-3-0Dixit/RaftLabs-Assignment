"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { MenuItem } from "@/lib/repositories/types";

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CartState {
  lines: Record<string, CartLine>;
}

type CartAction =
  | { type: "ADD"; menuItem: MenuItem; quantity: number }
  | { type: "SET_QUANTITY"; menuItemId: string; quantity: number }
  | { type: "REMOVE"; menuItemId: string }
  | { type: "CLEAR" };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.lines[action.menuItem.id];
      const quantity = (existing?.quantity ?? 0) + action.quantity;
      return {
        lines: {
          ...state.lines,
          [action.menuItem.id]: { menuItem: action.menuItem, quantity },
        },
      };
    }
    case "SET_QUANTITY": {
      if (action.quantity <= 0) {
        const rest = { ...state.lines };
        delete rest[action.menuItemId];
        return { lines: rest };
      }
      const existing = state.lines[action.menuItemId];
      if (!existing) return state;
      return {
        lines: {
          ...state.lines,
          [action.menuItemId]: { ...existing, quantity: action.quantity },
        },
      };
    }
    case "REMOVE": {
      const rest = { ...state.lines };
      delete rest[action.menuItemId];
      return { lines: rest };
    }
    case "CLEAR":
      return { lines: {} };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  totalItems: number;
  totalCents: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: {} });

  const value = useMemo<CartContextValue>(() => {
    const lines = Object.values(state.lines);
    const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
    const totalCents = lines.reduce(
      (sum, l) => sum + l.quantity * l.menuItem.priceCents,
      0
    );
    return {
      lines,
      totalItems,
      totalCents,
      addItem: (menuItem, quantity = 1) => dispatch({ type: "ADD", menuItem, quantity }),
      setQuantity: (menuItemId, quantity) =>
        dispatch({ type: "SET_QUANTITY", menuItemId, quantity }),
      removeItem: (menuItemId) => dispatch({ type: "REMOVE", menuItemId }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
