/** Frontend demonstration data. Replace with validated restaurant-owned API results later. */
export type MenuCategory = 'Burgers' | 'Bowls' | 'Pizza' | 'Sides';
export type FilterCategory = MenuCategory | 'All';

export interface FoodItem {
  id: number;
  name: string;
  category: MenuCategory;
  price: number;
  tag: string;
  description: string;
  image: string;
  hero?: string;
  veg: boolean;
}

export const foods: readonly FoodItem[] = [
  { id: 1, name: 'The Golden Crunch', category: 'Burgers', price: 249, tag: 'THE SIGNATURE', description: 'Crispy chicken · cheddar · house sauce', image: '/assets/burger.jpg', hero: '/assets/hero-burger.webp', veg: false },
  { id: 2, name: 'Garden Party', category: 'Bowls', price: 229, tag: 'FEEL-GOOD FAVOURITE', description: 'Fresh greens · grains · lemon dressing', image: '/assets/bowl.jpg', veg: true },
  { id: 3, name: 'Margherita Magic', category: 'Pizza', price: 329, tag: 'A SLICE OF HAPPINESS', description: 'Fresh mozzarella · tomato · basil', image: '/assets/pizza.jpg', veg: true },
  { id: 4, name: 'The Double Take', category: 'Burgers', price: 299, tag: 'EXTRA EVERYTHING', description: 'Double chicken · cheese · pickles', image: '/assets/burger.jpg', veg: false },
  { id: 5, name: 'Sunshine Bowl', category: 'Bowls', price: 259, tag: 'COLOUR YOUR DAY', description: 'Seasonal vegetables · grains · herbs', image: '/assets/bowl.jpg', veg: true },
  { id: 6, name: 'Chilli Cheese Pizza', category: 'Pizza', price: 359, tag: 'TURN UP THE HEAT', description: 'Chilli · mozzarella · roasted peppers', image: '/assets/pizza.jpg', veg: true },
  { id: 7, name: 'Golden Hour Fries', category: 'Sides', price: 119, tag: 'THE PERFECT PLUS ONE', description: 'Crispy potato · sea salt · herb dip', image: '/assets/fries.jpg', veg: true },
  { id: 8, name: 'Berry Good Shake', category: 'Sides', price: 169, tag: 'SWEET LITTLE MOMENT', description: 'Strawberry · milk · vanilla cream', image: '/assets/shake.jpg', veg: true },
];

export const featuredFoods = foods.slice(0, 3);
export const categories: ReadonlyArray<{ value: FilterCategory; label: string }> = [
  { value: 'All', label: 'All cravings' },
  { value: 'Burgers', label: 'Burgers' },
  { value: 'Pizza', label: 'Pizza' },
  { value: 'Bowls', label: 'Bowls' },
  { value: 'Sides', label: 'Sides & sips' },
];

export const formatPrice = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
export function filterFoods(items: readonly FoodItem[], category: FilterCategory, search: string): FoodItem[] {
  const term = search.trim().toLocaleLowerCase();
  return items.filter((item) =>
    (category === 'All' || item.category === category) &&
    `${item.name} ${item.description}`.toLocaleLowerCase().includes(term),
  );
}
