import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { subscribeCustomerOrders, subscribeRestaurantOrders } from '../orders/order.service';
import { subscribeMenu } from '../restaurants/restaurant.service';
import { restaurantDocId } from '../restaurants/restaurant.types';
import { watchAgents, watchReadyOrders, watchRider, watchRiderRoutes, type DeliveryAgent, type DeliveryRoute } from '../dispatch/dispatch.service';
import type { Order } from '../orders/order.types';
import { DashboardCard, DashboardTable, EmptyState, StatCard, StatusBadge } from '../../components/dashboard/DashboardUI';
import { DashboardIcon } from '../../components/dashboard/DashboardIcon';
import { dashboardNavigation, roleDisplay, type DashboardRole, type DashboardIconName } from '../../components/dashboard/dashboard.config';

interface Snapshot { orders: Order[] | null; menuCount: number | null; agents: DeliveryAgent[] | null; rider: DeliveryAgent | null; routes: DeliveryRoute[] | null; error: string; }
const initial = (): Snapshot => ({ orders: null, menuCount: null, agents: null, rider: null, routes: null, error: '' });
function useWorkspaceData(role: DashboardRole, uid?: string) {
  const [data, setData] = useState<Snapshot>(initial);
  useEffect(() => {
    setData(initial());
    if (!uid) return;
    const subs: (() => void)[] = [];
    const update = (value: Partial<Snapshot>) => setData(current => ({ ...current, ...value }));
    const error = (e: Error) => update({ error: e.message });
    try {
      if (role === 'customer') subs.push(subscribeCustomerOrders(uid, orders => update({ orders }), error));
      if (role === 'restaurant') {
        subs.push(subscribeRestaurantOrders(restaurantDocId(uid), orders => update({ orders }), error));
        subs.push(subscribeMenu(restaurantDocId(uid), false, menu => update({ menuCount: menu.length }), error));
      }
      if (role === 'admin') {
        subs.push(watchReadyOrders(orders => update({ orders }), error));
        subs.push(watchAgents(agents => update({ agents }), error));
      }
      if (role === 'rider') {
        subs.push(watchRider(uid, rider => update({ rider }), error));
        subs.push(watchRiderRoutes(uid, routes => update({ routes }), error));
      }
    } catch (cause) { error(cause instanceof Error ? cause : new Error('Unable to read workspace data.')); }
    return () => subs.forEach(stop=>stop());
  }, [role, uid]);
  return data;
}

type Metric = { label: string; value: string | number; detail: string; icon: DashboardIconName; busy?: boolean };
function deriveMetrics(role: DashboardRole, data: Snapshot): Metric[] {
  switch (role) {
    case 'customer': return [
      { label:'My orders', value:data.orders?.length??'—', detail:'Orders on your account', icon:'bag',busy:data.orders===null },
      { label:'In progress',value:data.orders?.filter(o=>!['delivered','rejected'].includes(o.status)).length??'—',detail:'Not yet completed',icon:'clock',busy:data.orders===null },
      { label:'Delivered',value:data.orders?.filter(o=>o.status==='delivered').length??'—',detail:'Completed orders',icon:'check',busy:data.orders===null },
    ];
    case 'restaurant': return [
      { label:'Menu items', value:data.menuCount??'—',detail:'Published and draft dishes',icon:'utensils',busy:data.menuCount===null },
      { label:'Incoming orders',value:data.orders?.filter(o=>o.status==='placed').length??'—',detail:'Awaiting review',icon:'bag',busy:data.orders===null },
      { label:'Preparing / ready',value:data.orders?.filter(o=>['accepted','preparing','ready_for_pickup'].includes(o.status)).length??'—',detail:'Kitchen workflow',icon:'chef',busy:data.orders===null },
    ];
    case 'admin': return [
      { label:'Ready orders',value:data.orders?.filter(o=>!o.activeRouteId).length??'—',detail:'Awaiting dispatch',icon:'bag',busy:data.orders===null },
      { label:'Available riders',value:data.agents?.filter(a=>a.status==='active'&&a.available&&!a.activeRouteId).length??'—',detail:'Eligible for an offer',icon:'bike',busy:data.agents===null },
      { label:'Rider accounts',value:data.agents?.length??'—',detail:'Registered delivery agents',icon:'users',busy:data.agents===null },
    ];
    case 'rider': return [
      { label:'Availability',value:data.rider?(data.rider.available?'Online':'Offline'):'—',detail:data.rider?.activeRouteId?'Assignment reserved':'Set status on deliveries page',icon:'bike',busy:data.rider===null },
      { label:'Active offers',value:data.routes?.filter(r=>['offered','accepted','picked_up'].includes(r.status)).length??'—',detail:'Current assignments',icon:'bag',busy:data.routes===null },
      { label:'Delivered routes',value:data.routes?.filter(r=>r.status==='delivered').length??'—',detail:'Recorded completed routes',icon:'check',busy:data.routes===null },
    ];
  }
}
const messages: Record<DashboardRole,{eyebrow:string;title:string;intro:string;cta:string;to:string;note:string}> = {
  customer:{eyebrow:'YOUR FOOD JOURNEY',title:'Cravings, meet convenience.',intro:'Discover kitchens you love and keep track of every order in one calm space.',cta:'Explore restaurants',to:'/restaurants',note:'Live restaurant menus and development ordering are available.'},
  restaurant:{eyebrow:'RESTAURANT OPERATIONS',title:'Your kitchen, in control.',intro:'Everything you need for the next rush: menus, preparation, and incoming orders.',cta:'Manage incoming orders',to:'/restaurant/orders',note:'Stats reflect your own Firestore menu and order records.'},
  rider:{eyebrow:'DELIVERY PARTNER',title:'Make every stop count.',intro:'Manage availability, accept offers, and keep each delivery on track.',cta:'View my deliveries',to:'/rider/dashboard',note:'GPS navigation and earnings are not yet implemented.'},
  admin:{eyebrow:'PLATFORM CONTROL',title:'A clearer view of every move.',intro:'Coordinate dispatch, partner approvals, and route experiments from one place.',cta:'Open dispatch desk',to:'/admin/dispatch',note:'Route planner experiments are separate from real dispatch.'},
};
export function RoleOverview({role}:{role:DashboardRole}) {
  const {user,profile}=useAuth();
  const {orders,menuCount,agents,rider,routes,error}=useWorkspaceData(role,user?.uid);
  const data=useMemo(()=>({orders,menuCount,agents,rider,routes,error}),[orders,menuCount,agents,rider,routes,error]);
  const config=messages[role];
  const metrics=deriveMetrics(role,data);
  const links=dashboardNavigation[role].flatMap(g=>g.items).filter(link=>link.to!=='/account'&&link.to!==`/${role}/dashboard`&&link.to!== '/');
  const recent=(orders??[]).slice(0,4);
  return <div className="frd-overview">
    <section className="frd-hero"><div className="frd-hero-copy"><p className="frd-overline"><span className="frd-overline-dot"/>{config.eyebrow}</p><p className="frd-greeting">Welcome back, {profile?.displayName?.split(' ')[0]||'there'} <span aria-hidden="true">✳</span></p><h2>{config.title}</h2><p className="frd-hero-text">{config.intro}</p><Link className="frd-primary" to={config.to}>{config.cta}<DashboardIcon name="arrow" size={17}/></Link></div><div className="frd-hero-art" aria-hidden="true"><span className="frd-hero-ring frd-hero-ring--outer"/><span className="frd-hero-ring frd-hero-ring--inner"/><img src="/assets/hero-burger.webp" alt=""/><span className="frd-hero-art-label">MADE TO MOVE <span>✺</span></span></div></section>
    <div className="frd-section-heading"><div><p className="frd-overline">AT A GLANCE</p><h2>Your workspace overview</h2></div><StatusBadge tone="neutral">{roleDisplay[role]} access</StatusBadge></div>
    {error && <p className="frd-error" role="alert">Couldn't load live workspace metrics: {error}. Your existing workspace links still work.</p>}
    <div className="frd-stat-grid">{metrics.map(m=><StatCard key={m.label} {...m}/>)}</div>
    <div className="frd-content-grid">
      <DashboardCard className="frd-shortcuts"><div className="frd-card-heading"><div><p className="frd-overline">QUICK ACCESS</p><h2>Where to next?</h2></div><DashboardIcon name="arrow"/></div><div className="frd-shortcut-list">{links.slice(0,5).map(link=><Link className="frd-shortcut" to={link.to} key={link.to}><span className="frd-shortcut-icon"><DashboardIcon name={link.icon}/></span><span>{link.label}</span><DashboardIcon name="arrow" size={16}/></Link>)}</div></DashboardCard>
      <DashboardCard className="frd-updates"><div className="frd-card-heading"><div><p className="frd-overline">WORKSPACE NOTES</p><h2>Made for your role</h2></div><DashboardIcon name="sparkles"/></div><p>{config.note}</p><div className="frd-account-summary"><span className="frd-account-summary-icon"><DashboardIcon name="shield"/></span><div><strong>Account status</strong><p>{profile?.status==='active'?'Your account is active':`Status: ${profile?.status??'unknown'}`} · {user?.emailVerified?'Email verified':'Email not verified'}</p></div></div><Link to="/account" className="frd-text-link">Review account settings <DashboardIcon name="arrow" size={16}/></Link></DashboardCard>
    </div>
    {role==='customer'&&<DashboardCard className="frd-recent"><div className="frd-card-heading"><div><p className="frd-overline">ORDER HISTORY</p><h2>Recent orders</h2></div><Link to="/orders" className="frd-text-link">View all <DashboardIcon name="arrow" size={15}/></Link></div>{orders===null?<p role="status" className="frd-subtle">Loading your orders…</p>:recent.length===0?<EmptyState title="No orders yet" description="Explore restaurant menus when you're ready." action={{label:'Explore kitchens',to:'/restaurants'}}/>:<DashboardTable rows={recent} columns={[{heading:'Order',render:o=><strong>{o.items.map(i=>i.name).join(', ').slice(0,75)}</strong>},{heading:'Status',render:o=><StatusBadge tone={o.status==='delivered'?'good':o.status==='rejected'?'danger':'warning'}>{o.status.replaceAll('_',' ')}</StatusBadge>},{heading:'City',render:o=>o.address.city}]} />}</DashboardCard>}
    {role==='admin'&&<p className="frd-small-print">Platform metrics represent only the orders and riders your administrator account can read. No simulated performance figures are shown.</p>}
  </div>;
}
