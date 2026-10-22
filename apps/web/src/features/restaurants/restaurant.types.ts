import type { Timestamp } from 'firebase/firestore';

export const MENU_CATEGORIES = ['Burgers', 'Bowls', 'Pizza', 'Sides', 'Drinks', 'Desserts', 'Other'] as const;
export type MenuCategory = typeof MENU_CATEGORIES[number];
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface RestaurantApplication {
  ownerUid: string;
  name: string;
  city: string;
  cuisine: string;
  description: string;
  contactEmail: string;
  status: ApplicationStatus;
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
}
export interface Restaurant {
  id: string;
  ownerUid: string;
  name: string;
  city: string;
  cuisine: string;
  description: string;
  approved: boolean;
  status: 'active' | 'suspended';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  pricePaise: number;
  imageUrl: string;
  vegetarian: boolean;
  available: boolean;
  published: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
export type MenuItemDraft = Omit<MenuItem,'id'|'createdAt'|'updatedAt'>;
export type RestaurantApplicationDraft = Pick<RestaurantApplication,'name'|'city'|'cuisine'|'description'>;
export const money = (paise: number) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:2 }).format(paise / 100);
export const restaurantDocId = (uid: string) => `rest_${uid}`;
