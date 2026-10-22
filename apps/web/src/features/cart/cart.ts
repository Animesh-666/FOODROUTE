import type { FoodItem } from '../landing/catalog';

export type DemoCart = Record<number, number>;
export const CART_KEY = 'foodroute-bag';
export const MAX_QUANTITY = 99;

export function normalizeCart(input: unknown, knownItems: readonly FoodItem[]): DemoCart {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const saved = input as Record<string, unknown>;
  const cart: DemoCart = {};
  for (const item of knownItems) {
    const value = saved[String(item.id)];
    const quantity = typeof value === 'number' ? value : Number(value);
    if (typeof value !== 'boolean' && Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY) {
      cart[item.id] = quantity;
    }
  }
  return cart;
}

export function changeQuantity(cart: DemoCart, itemId: number, delta: number): DemoCart {
  const next = { ...cart };
  const updated = Math.max(0, Math.min(MAX_QUANTITY, (next[itemId] ?? 0) + delta));
  if (updated === 0) delete next[itemId];
  else next[itemId] = updated;
  return next;
}

export function totalItems(cart: DemoCart) {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

export function subtotal(cart: DemoCart, items: readonly FoodItem[]) {
  return items.reduce((total, item) => total + item.price * (cart[item.id] ?? 0), 0);
}
