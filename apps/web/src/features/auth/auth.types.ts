import type { Timestamp } from 'firebase/firestore';

// Only "customer" is available during public signup.
// restaurant, rider, and admin provisioning are trusted backend operations in later phases.
export type UserRole = 'customer' | 'restaurant' | 'rider' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';
export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
