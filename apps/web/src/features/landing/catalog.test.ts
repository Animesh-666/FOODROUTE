import { describe, expect, it } from 'vitest';
import { filterFoods, foods } from './catalog';

describe('catalog filtering', () => {
  it('filters by category and query, regardless of case', () => {
    expect(filterFoods(foods, 'Pizza', 'mozzarella').map((item) => item.id)).toEqual([3, 6]);
  });
  it('finds dishes by description', () => {
    expect(filterFoods(foods, 'All', 'cheddar').map((item) => item.id)).toEqual([1]);
  });
  it('returns an empty list for unmatched queries', () => {
    expect(filterFoods(foods, 'All', 'nothing named this')).toEqual([]);
  });
});
