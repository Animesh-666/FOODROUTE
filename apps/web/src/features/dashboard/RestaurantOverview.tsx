import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';
import {subscribeRestaurant,subscribeMenu} from '../restaurants/restaurant.service';
import {restaurantDocId,money,type Restaurant,type MenuItem} from '../restaurants/restaurant.types';
import {subscribeRestaurantOrders} from '../orders/order.service';
import type {Order} from '../orders/order.types';
import {countByStatus,deliveredValue} from './dashboard.meta';
import {StatCard,Panel,StatusPill,EmptyState,LoadStatus,ErrorStatus} from './DashboardUI';
import {DashboardIcon} from './DashboardIcon';
export function RestaurantOverview(){
 const {user}=useAuth();const id=user?restaurantDocId(user.uid):'';
 const [restaurant,setRestaurant]=useState<Restaurant|null>(null),[menu,setMenu]=useState<MenuItem[]>([]),[orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState({restaurant:true,menu:true,orders:true});const [errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{if(!id)return;return subscribeRestaurant(id,r=>{setRestaurant(r);setLoading(v=>({...v,restaurant:false}))},e=>{setErrors(v=>({...v,restaurant:e.message}));setLoading(v=>({...v,restaurant:false}))})},[id]);
 useEffect(()=>{if(!id||!restaurant)return;return subscribeMenu(id,false,items=>{setMenu(items);setLoading(v=>({...v,menu:false}))},e=>{setErrors(v=>({...v,menu:e.message}));setLoading(v=>({...v,menu:false}))})},[id,restaurant?.id]);
 useEffect(()=>{if(!id)return;return subscribeRestaurantOrders(id,list=>{setOrders(list);setLoading(v=>({...v,orders:false}))},e=>{setErrors(v=>({...v,orders:e.message}));setLoading(v=>({...v,orders:false}))})},[id]);
 const busy=loading.restaurant||loading.menu||loading.orders;
 const open=orders.filter(o=>!['delivered','rejected'].includes(o.status));
 return <><header className="frd-welcome"><div><p className="frd-eyebrow">THE KITCHEN EDITION</p><h1>{restaurant?.name||'Your restaurant'}<em>.</em></h1><p className="frd-subtitle">A clear overview of orders, dishes, and kitchen readiness.</p></div><div className="frd-actions"><Link className="frd-button frd-button-secondary" to="/restaurant/menu">Manage menu</Link><Link className="frd-button" to="/restaurant/orders">Incoming orders <DashboardIcon name="arrow" size={16}/></Link></div></header>
 {errors.restaurant&&<ErrorStatus message={errors.restaurant}/>}
 {!loading.restaurant&&!restaurant&&<div className="frd-warn-banner">Your approved restaurant profile wasn't found. Sign in again or review your restaurant approval.</div>}
 <div className="frd-grid"><StatCard label="Incoming / active" value={loading.orders?'—':open.length} detail="Orders awaiting completion" icon="receipt"/><StatCard label="Ready for pickup" value={loading.orders?'—':countByStatus(orders,'ready_for_pickup')} detail="Awaiting a rider" icon="clock"/><StatCard label="Published dishes" value={loading.menu?'—':menu.filter(m=>m.published).length} detail="Out of all menu items" icon="bag"/><StatCard label="Delivered COD value" value={loading.orders?'—':money(deliveredValue(orders))} detail="Order value, not verified income" icon="chart"/></div>
 <div className="frd-columns"><div className="frd-stack"><Panel title="Kitchen order queue" subtitle="Orders from your restaurant in Firestore" action={<Link to="/restaurant/orders" className="frd-button-link">Manage queue →</Link>}>
  {errors.orders?<ErrorStatus message={errors.orders}/>:loading.orders?<LoadStatus/>:!open.length?<EmptyState title="Kitchen is all caught up" detail="New orders will appear here as customers place them."/>:<ul className="frd-list">{open.slice(0,6).map(o=><li key={o.id} className="frd-list-item"><div><strong>{o.items?.map(x=>x.name).join(', ')||'Order'}</strong><p>#{o.id.slice(0,12)} · {money(o.totalPaise)}</p></div><StatusPill status={o.status}/></li>)}</ul>}
 </Panel></div><div className="frd-stack"><Panel title="Menu snapshot" subtitle="Your live Firestore menu" action={<Link to="/restaurant/menu" className="frd-button-link">Open studio →</Link>}>
  {errors.menu?<ErrorStatus message={errors.menu}/>:busy?<LoadStatus/>:menu.length===0?<EmptyState title="Create your first dish" detail="Add an item in Menu Studio, then publish it for customers."/>:<ul className="frd-list">{menu.slice(0,5).map(m=><li key={m.id} className="frd-list-item"><div><strong>{m.name}</strong><p>{money(m.pricePaise)}</p></div><StatusPill status={!m.published?'draft':m.available?'available':'out of stock'}/></li>)}</ul>}
 </Panel><Panel title="Restaurant tools"><div className="frd-cards"><Link className="frd-mini-card" to="/restaurant/analytics"><strong>COD order analytics</strong><p>Delivered order value and trends</p></Link><Link className="frd-mini-card" to="/restaurant/location"><strong>Pickup & delivery area</strong><p>Location and service area</p></Link><Link className="frd-mini-card" to={`/restaurants/${id}`}><strong>Customer view</strong><p>See your published dishes</p></Link></div></Panel></div></div>
 <p className="frd-note frd-topline">Delivered COD totals are the value of completed orders, not proof that cash was collected or settled. No payment analytics are claimed.</p></>;
}
