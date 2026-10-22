import type { UserRole } from '../../features/auth/auth.types';

export type DashboardRole = UserRole;
export type DashboardIconName = 'grid' | 'utensils' | 'bag' | 'user' | 'store' | 'chef' | 'bike' | 'route' | 'map' | 'check' | 'users' | 'sparkles' | 'chart' | 'arrow' | 'settings' | 'menu' | 'close' | 'logout' | 'shield' | 'clock' | 'bell' | 'search';
export type NavigationItem = { to: string; label: string; icon: DashboardIconName; end?: boolean };
export type NavigationGroup = { label: string; items: NavigationItem[] };
export const dashboardHome: Record<DashboardRole, string> = {
  customer: '/customer/dashboard',
  admin: '/admin/dashboard',
  restaurant: '/restaurant/overview',
  rider: '/rider/overview',
};
export const dashboardLabel: Record<DashboardRole, string> = {
  customer: 'My food space', admin: 'Control center', restaurant: 'Restaurant studio', rider: 'Courier workspace',
};
export const dashboardNavigation: Record<DashboardRole, NavigationGroup[]> = {
  customer: [
    { label: 'Explore', items: [{ to: '/customer/dashboard', label: 'Overview', icon: 'grid', end: true }, { to: '/restaurants', label: 'Restaurants', icon: 'utensils' }, { to: '/checkout', label: 'My bag / checkout', icon: 'bag' }] },
    { label: 'My activity', items: [{ to: '/orders', label: 'My orders', icon: 'clock' }, { to: '/account', label: 'Profile & settings', icon: 'user' }] },
  ],
  restaurant: [
    { label: 'Kitchen', items: [{ to: '/restaurant/overview', label: 'Overview', icon: 'grid', end: true }, { to: '/restaurant/dashboard', label: 'Manage menu', icon: 'utensils', end: true }, { to: '/restaurant/orders', label: 'Incoming orders', icon: 'bag' }] },
    { label: 'Account', items: [{ to: '/account', label: 'Restaurant owner profile', icon: 'user' }, { to: '/restaurants', label: 'Public restaurant list', icon: 'store' }] },
  ],
  rider: [
    { label: 'Deliveries', items: [{ to: '/rider/overview', label: 'Overview', icon: 'grid', end: true }, { to: '/rider/dashboard', label: 'My deliveries', icon: 'bike', end: true }, { to: '/account', label: 'Account', icon: 'user' }] },
    { label: 'Explore', items: [{ to: '/', label: 'FOODROUTE home', icon: 'utensils', end: true }] },
  ],
  admin: [
    { label: 'Workspace', items: [{ to: '/admin/dashboard', label: 'Overview', icon: 'grid', end: true }, { to: '/admin/dispatch', label: 'Dispatch desk', icon: 'bike' }, { to: '/admin/restaurant-applications', label: 'Restaurant approvals', icon: 'check' }] },
    { label: 'Optimization', items: [{ to: '/admin/route-planner', label: 'Road planner', icon: 'map' }, { to: '/admin/live-route-preview', label: 'Order route preview', icon: 'route' }, { to: '/admin/algorithm-lab', label: 'DAA laboratory', icon: 'chart' }] },
    { label: 'Account', items: [{ to: '/account', label: 'My account', icon: 'user' }] },
  ],
};
export const roleDisplay: Record<DashboardRole, string> = {
  customer: 'Customer', admin: 'Administrator', restaurant: 'Restaurant partner', rider: 'Delivery partner',
};
export function titleForPath(path: string, role: DashboardRole): string {
  for (const group of dashboardNavigation[role]) {
    for (const item of group.items) if (item.to === path) return item.label;
  }
  return dashboardLabel[role];
}
