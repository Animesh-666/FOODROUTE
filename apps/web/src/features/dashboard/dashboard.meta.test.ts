import {describe,expect,it} from 'vitest';
import {countByStatus,deliveredValue,getHomeForRole,hasDashboardRole,roleNav,showDashboardReturn} from './dashboard.meta';
describe('dashboard role navigation',()=>{
 it('routes four supported roles to distinct dashboards',()=>{
  expect(['customer','admin','restaurant','rider'].map(getHomeForRole)).toEqual([
   '/customer/dashboard','/admin/dashboard','/restaurant/dashboard','/rider/dashboard'
  ]);
 });
 it('falls back to account for unknown or malformed roles',()=>{
  expect(getHomeForRole('unknown')).toBe('/account');
  expect(getHomeForRole('__proto__')).toBe('/account');
  expect(getHomeForRole(null)).toBe('/account');
 });
 it('each role has its own overview and no duplicate navigation destinations',()=>{
  for(const [role,items] of Object.entries(roleNav)){
   expect(items[0].to).toBe(getHomeForRole(role));
   expect(new Set(items.map(x=>x.to)).size).toBe(items.length);
  }
 });
});
describe('dashboard metrics',()=>{
 const orders=[{status:'delivered',totalPaise:25000},{status:'placed',totalPaise:9000},
  {status:'delivered',totalPaise:12000},{status:'rejected',totalPaise:5000}];
 it('counts only the requested status',()=>expect(countByStatus(orders,'delivered')).toBe(2));
 it('distinguishes delivered COD value from all placed orders',()=>expect(deliveredValue(orders)).toBe(37000));
 it('handles no data',()=>{expect(countByStatus([], 'delivered')).toBe(0);expect(deliveredValue([])).toBe(0)});
});

describe('role checks',()=>{
 it('denies mismatched and suspended role profiles',()=>{
  expect(hasDashboardRole('admin',{role:'customer',status:'active'},'admin')).toBe(false);
  expect(hasDashboardRole('admin',{role:'admin',status:'suspended'},'admin')).toBe(false);
  expect(hasDashboardRole('rider',null,'rider')).toBe(false);
 });
 it('requires an actual privileged claim for every non-customer role',()=>{
  for(const role of ['admin','restaurant','rider'] as const){
   expect(hasDashboardRole(role,{role,status:'active'},undefined)).toBe(false);
   expect(hasDashboardRole(role,{role,status:'active'},'customer')).toBe(false);
   expect(hasDashboardRole(role,{role,status:'active'},role)).toBe(true);
  }
 });
 it('accepts normal customer token without a privileged claim',()=>{
  expect(hasDashboardRole('customer',{role:'customer',status:'active'},undefined)).toBe(true);
  expect(hasDashboardRole('customer',{role:'customer',status:'active'},'admin')).toBe(false);
 });
});

describe('return navigation visibility',()=>{
 it('exposes a return button on every role-specific secondary page',()=>{
  for(const path of ['/account','/orders','/checkout','/restaurants','/restaurant/menu',
    '/restaurant/orders','/rider/deliveries','/admin/dispatch','/admin/route-planner',
    '/admin/live-route-preview','/algorithm-lab']){
   expect(showDashboardReturn(path,true),path).toBe(true);
  }
 });
 it('never shows on overview, homepage, sign-in, or unverified sessions',()=>{
  for(const path of ['/','/dashboard','/login','/signup','/forgot-password',
   '/customer/dashboard','/admin/dashboard','/restaurant/dashboard','/rider/dashboard']){
    expect(showDashboardReturn(path,true),path).toBe(false);
  }
  expect(showDashboardReturn('/admin/dispatch',false)).toBe(false);
 });
});
