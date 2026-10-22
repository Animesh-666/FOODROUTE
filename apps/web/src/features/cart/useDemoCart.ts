import { useEffect, useState } from 'react';
import { foods } from '../landing/catalog';
import { CART_KEY, changeQuantity, normalizeCart, type DemoCart } from './cart';

function loadCart(): DemoCart {
  try {
    return normalizeCart(JSON.parse(window.localStorage.getItem(CART_KEY) ?? '{}'), foods);
  } catch {
    return {};
  }
}

export function useDemoCart() {
  const [cart, setCart] = useState<DemoCart>(loadCart);
  useEffect(() => {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Storage may be disabled. */ }
  }, [cart]);

  return {
    cart,
    increment: (id: number) => setCart((old) => changeQuantity(old, id, 1)),
    decrement: (id: number) => setCart((old) => changeQuantity(old, id, -1)),
    remove: (id: number) => setCart((old) => { const next = { ...old }; delete next[id]; return next; }),
  };
}
