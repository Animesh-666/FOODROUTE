import { useEffect,useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { subscribeCustomerOrders } from './order.service';
import type { Order } from './order.types';
import { money } from '../restaurants/restaurant.types';
import './orders.css';
export function CustomerOrdersPage(){
 const {user,profile}=useAuth();const [orders,setOrders]=useState<Order[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [params]=useSearchParams();
 useEffect(()=>{if(!user)return;return subscribeCustomerOrders(user.uid,x=>{setOrders(x);setLoading(false)},e=>{setLoading(false);setError(e.message)})},[user]);
 return <div className="restaurant-page"><div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><nav><Link to="/restaurants">Restaurants</Link><Link to="/account">Account</Link></nav></div><main className="restaurant-container order-page">
  <header className="restaurant-intro"><p className="eyebrow"><span/> YOUR FOOD JOURNEY</p><h1>My orders<em>.</em></h1><p>Live status updates from your chosen restaurants. Rider assignment statuses are available; live rider location tracking is not included.</p></header>
  {params.get('placed')&&<p className="restaurant-ok" role="status">Order received! Your restaurant will review it shortly.</p>}
  {profile?.role!=='customer'?<p className="restaurant-empty">To place orders, sign in with a customer account.</p>:loading?<p role="status">Loading your orders…</p>:error?<p role="alert" className="restaurant-error">{error}</p>:orders.length===0?<div className="restaurant-empty">No orders yet. <Link to="/restaurants">Discover food</Link>.</div>:<div className="order-list">{orders.map(o=><article key={o.id} className="restaurant-panel"><div className="order-card-head"><div><span className="restaurant-eyebrow">{o.id.slice(0,16)}</span><h2>{o.items.map(x=>x.name).join(', ')}</h2></div><span className="order-badge">{o.status.replaceAll('_',' ')}</span></div><p className="restaurant-note">{o.items.map(x=>`${x.quantity} × ${x.name}`).join(' · ')}</p><div className="order-cost"><span>{o.address.city} · Cash on delivery (unpaid)</span><strong>{money(o.totalPaise)}</strong></div><p className="restaurant-note">{o.activeRouteId ? `Delivery assigned · ${o.assignmentStatus??'offered'}. No live location tracking.` : 'Delivery not assigned yet.'} Cash on delivery remains unpaid until separately settled.</p></article>)}</div>}
 </main></div>
}
