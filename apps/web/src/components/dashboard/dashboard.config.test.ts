import { describe, expect, it } from 'vitest';
import { dashboardHome, dashboardNavigation, roleDisplay, titleForPath } from './dashboard.config';
import type { UserRole } from '../../features/auth/auth.types';
const roles: UserRole[] = ['customer', 'restaurant', 'rider', 'admin'];
describe('FOODROUTE dashboard navigation', () => {
  it('gives every role its own landing page', () => {
    expect(new Set(roles.map(r => dashboardHome[r])).size).toBe(roles.length);
    roles.forEach(r => expect(roleDisplay[r]).toBeTruthy());
  });
  it('has working, unique navigation destinations for each role', () => {
    roles.forEach(role => {
      const items = dashboardNavigation[role].flatMap(group => group.items);
      expect(items.some(i => i.to === dashboardHome[role])).toBe(true);
      expect(items.every(i => i.to.startsWith('/'))).toBe(true);
      expect(new Set(items.map(i => i.to)).size).toBe(items.length);
    });
  });
  it('does not advertise other roles’ privileged workspaces', () => {
    expect(dashboardNavigation.customer.flatMap(x=>x.items).some(i=>i.to.startsWith('/admin/')||i.to.startsWith('/rider/')||i.to.startsWith('/restaurant/'))).toBe(false);
    expect(dashboardNavigation.rider.flatMap(x=>x.items).some(i=>i.to.startsWith('/admin/'))).toBe(false);
  });
  it('provides readable contextual titles', () => {
    expect(titleForPath('/admin/dispatch', 'admin')).toBe('Dispatch desk');
    expect(titleForPath('/restaurant/orders', 'restaurant')).toBe('Incoming orders');
    expect(titleForPath('/unknown', 'customer')).toBeTruthy();
  });
});
