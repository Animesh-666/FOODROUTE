import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { money, restaurantDocId } from '../restaurants/restaurant.types';
import { changeRestaurantOrder,subscribeRestaurantOrders } from './order.service';
import type { Order,Status } from './order.types';
import { nextStatuses } from './order.types';
import './orders.css';
const labels:Partial<Record<Status,string>>={accepted:'Accept',rejected:'Reject',preparing:'Start preparing',ready_for_pickup:'Mark ready for pickup'};
export function RestaurantOrdersPage(){
 const {user}=useAuth();const restaurantId=user?restaurantDocId(user.uid):'';const [orders,setOrders]=useState<Order[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState('');const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!restaurantId)return;return subscribeRestaurantOrders(restaurantId,o=>{setOrders(o);setLoading(false)},e=>{setError(e.message);setLoading(false)})},[restaurantId]);
 async function advance(order:Order,status:Status){if(status==='rejected'&&!window.confirm('Reject this order? The customer will be notified of the status in their order history.'))return;
  setBusy(order.id);setError('');try{await changeRestaurantOrder(order.id,status)}catch(e){setError(e instanceof Error?e.message:'Status update failed.')}finally{setBusy('')}
 }
 return <div className="restaurant-page"><div className="restaurant-top"><Link className="restaurant-brand" to="/">f↗ foodroute<span>.</span></Link><nav><Link to="/restaurant/dashboard">Manage menu</Link><Link to="/restaurants">Customer view</Link></nav></div><main className="restaurant-container order-page">
  <header className="restaurant-intro"><p className="eyebrow"><span/> RESTAURANT WORKSPACE</p><h1>Incoming orders<em>.</em></h1><p>Accept orders, track kitchen preparation, and mark dishes ready for pickup. Ready orders can be assigned by a trusted admin in the dispatch workspace.</p></header>
  {error&&<p className="restaurant-error" role="alert">{error}</p>}
  {loading?<p role="status">Loading incoming orders…</p>:orders.length===0?<div className="restaurant-empty">No customer orders yet. <Link to="/restaurant/dashboard">Manage your menu</Link>.</div>:<div className="order-list">{orders.map(o=><article className="restaurant-panel" key={o.id}>
   <div className="order-card-head"><div><span className="restaurant-eyebrow">ORDER {o.id.slice(0,16)}</span><h2>{o.items.map(x=>x.name).join(', ')}</h2></div><span className="order-badge">{o.status.replaceAll('_',' ')}</span></div>
   <p className="restaurant-note">{o.items.map(x=>`${x.quantity} × ${x.name}`).join(' · ')}</p>
   <div className="order-cost"><span>Delivery area: {o.address.city}, PIN {o.address.postalCode}</span><strong>{money(o.totalPaise)}</strong></div>
   <div className="restaurant-actions">{(nextStatuses[o.status]||[]).map(to=><button key={to} className={to==='rejected'?'restaurant-secondary':'restaurant-button'} disabled={Boolean(busy)} onClick={()=>void advance(o,to)}>{busy===o.id?'Updating…':labels[to]}</button>)}</div>
   {o.status==='ready_for_pickup'&&<p className="restaurant-note">Ready for pickup. Check with your dispatcher for rider allocation.</p>}
  </article>)}</div>}
 </main></div>
}
