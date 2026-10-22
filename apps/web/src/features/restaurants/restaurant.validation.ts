import { MENU_CATEGORIES, type MenuItemDraft, type RestaurantApplicationDraft } from './restaurant.types';

export function validateApplication(draft: RestaurantApplicationDraft): RestaurantApplicationDraft {
  const value = { name: draft.name.trim(), city: draft.city.trim(), cuisine: draft.cuisine.trim(), description: draft.description.trim() };
  if (value.name.length < 3 || value.name.length > 90) throw new Error('Restaurant name must be 3–90 characters.');
  if (value.city.length < 2 || value.city.length > 70) throw new Error('City must be 2–70 characters.');
  if (value.cuisine.length < 2 || value.cuisine.length > 50) throw new Error('Cuisine must be 2–50 characters.');
  if (value.description.length < 10 || value.description.length > 300) throw new Error('Description must be 10–300 characters.');
  return value;
}
export function validateMenuDraft(draft: MenuItemDraft): MenuItemDraft {
  const value = { ...draft, name: draft.name.trim(), description: draft.description.trim(), imageUrl: draft.imageUrl.trim() };
  if (value.name.length < 3 || value.name.length > 90) throw new Error('Dish name must be 3–90 characters.');
  if (value.description.length < 5 || value.description.length > 250) throw new Error('Description must be 5–250 characters.');
  if (!MENU_CATEGORIES.includes(value.category)) throw new Error('Choose a valid category.');
  if (!Number.isInteger(value.pricePaise) || value.pricePaise < 100 || value.pricePaise > 1000000) throw new Error('Price must be between ₹1 and ₹10,000.');
  if (value.imageUrl.length > 500) throw new Error('Image URL is too long.');
  if (value.imageUrl && !value.imageUrl.startsWith('/assets/') && !/^https:\/\/[a-z0-9.-]+(?:\:\d+)?(?:\/|$)/i.test(value.imageUrl)) throw new Error('Use an HTTPS image URL or an existing /assets/ image.');
  if (![value.vegetarian, value.available, value.published].every(v => typeof v === 'boolean')) throw new Error('Invalid menu status.');
  return value;
}
