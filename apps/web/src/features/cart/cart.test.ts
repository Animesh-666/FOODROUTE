import { describe, expect, it } from 'vitest';
import { foods } from '../landing/catalog';
import { changeQuantity, normalizeCart, subtotal, totalItems } from './cart';

describe('demo cart calculations', () => {
  it('rejects missing, negative, non-integer and unknown item quantities', () => {
    expect(normalizeCart({ 1: 2, 2: -1, 3: '3.4', 999: 10, 4: false }, foods)).toEqual({ 1: 2 });
  });
  it('caps quantities and removes zero quantities', () => {
    const full = changeQuantity({ 1: 99 }, 1, 1);
    expect(full[1]).toBe(99);
    expect(changeQuantity({ 1: 1 }, 1, -1)).toEqual({});
  });
  it('correctly calculates subtotals and badge counts', () => {
    const cart = { 1: 2, 3: 1 };
    expect(totalItems(cart)).toBe(3);
    expect(subtotal(cart, foods)).toBe(827);
  });
});
