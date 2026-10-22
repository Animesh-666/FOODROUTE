import type { UserRole } from '../auth/auth.types';
export type DashboardRole = UserRole;
export type NavItem = { label: string; to: string; icon: string; end?: boolean };
export const dashboardHome: Record<UserRole,string> = {
  customer:'/customer/dashboard', admin:'/admin/dashboard',
  restaurant:'/restaurant/dashboard', rider:'/rider/dashboard'
};
export const roleTitle:Record<UserRole,string> = {
  customer:'Your food journey', admin:'Operations command center',
  restaurant:'Restaurant studio', rider:'Delivery workspace'
};
export const roleNav:Record<UserRole,NavItem[]> = {
  customer:[
    {label:'Overview',to:'/customer/dashboard',icon:'home',end:true},
    {label:'Restaurants',to:'/restaurants',icon:'store'},
    {label:'My orders',to:'/orders',icon:'receipt'},
    {label:'My insights',to:'/customer/insights',icon:'chart'},
    {label:'Checkout',to:'/checkout',icon:'bag'},
    {label:'Account',to:'/account',icon:'user'}
  ],
  admin:[
    {label:'Overview',to:'/admin/dashboard',icon:'home',end:true},
    {label:'Platform analytics',to:'/admin/analytics',icon:'chart'},
    {label:'Dispatch desk',to:'/admin/dispatch',icon:'route'},
    {label:'Optimized dispatch',to:'/admin/optimized-dispatch',icon:'layers'},
    {label:'Road planner',to:'/admin/route-planner',icon:'map'},
    {label:'Live order preview',to:'/admin/live-route-preview',icon:'layers'},
    {label:'Restaurant approvals',to:'/admin/restaurant-applications',icon:'store'},
    {label:'DAA laboratory',to:'/algorithm-lab',icon:'chart'},
    {label:'Account',to:'/account',icon:'user'}
  ],
  restaurant:[
    {label:'Overview',to:'/restaurant/dashboard',icon:'home',end:true},
    {label:'Sales & orders',to:'/restaurant/analytics',icon:'chart'},
    {label:'Menu studio',to:'/restaurant/menu',icon:'bag'},
    {label:'Incoming orders',to:'/restaurant/orders',icon:'receipt'},
    {label:'Pickup & service area',to:'/restaurant/location',icon:'map'},
    {label:'Public restaurants',to:'/restaurants',icon:'store'},
    {label:'Account',to:'/account',icon:'user'}
  ],
  rider:[
    {label:'Overview',to:'/rider/dashboard',icon:'home',end:true},
    {label:'Delivery history',to:'/rider/history',icon:'receipt'},
    {label:'My deliveries',to:'/rider/deliveries',icon:'route'},
    {label:'My account',to:'/account',icon:'user'}
  ]
};
export function getHomeForRole(role:unknown):string {
 return typeof role==='string' && Object.prototype.hasOwnProperty.call(dashboardHome,role)
   ? dashboardHome[role as UserRole] : '/account';
}
export type OrderStatus='placed'|'accepted'|'preparing'|'ready_for_pickup'|'picked_up'|'delivered'|'rejected';
export function countByStatus<T extends {status:string}>(items:readonly T[],status:string):number {
 return items.filter(item=>item.status===status).length;
}
export function deliveredValue<T extends {status:string;totalPaise:number}>(orders:readonly T[]):number {
 return orders.reduce((sum,o)=>sum+(o.status==='delivered'&&Number.isFinite(o.totalPaise)?o.totalPaise:0),0);
}

export function hasDashboardRole(expected: UserRole, profile: {role: UserRole;status:string}|null|undefined, tokenRole:unknown):boolean {
 if(!profile||profile.status!=='active'||profile.role!==expected)return false;
 return expected==='customer' ? (tokenRole===undefined||tokenRole===null||tokenRole==='customer') : tokenRole===expected;
}

/** Return action is shown on secondary pages, never on overview or sign-in screens. */
export function showDashboardReturn(pathname: string, verified: boolean): boolean {
 if (!verified || pathname === '/' || pathname === '/dashboard') return false;
 if (Object.values(dashboardHome).includes(pathname)) return false;
 return !['/login', '/signup', '/forgot-password'].includes(pathname);
}
