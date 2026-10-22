import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../auth/useAuth';
import {subscribeCustomerOrders} from '../orders/order.service';
import {subscribeApprovedRestaurants} from '../restaurants/restaurant.service';
import type {Order} from '../orders/order.types';
import type {Restaurant} from '../restaurants/restaurant.types';
import {money} from '../restaurants/restaurant.types';
import {countByStatus} from './dashboard.meta';
import {StatCard,Panel,StatusPill,EmptyState,LoadStatus,ErrorStatus} from './DashboardUI';
import {DashboardIcon} from './DashboardIcon';
export function CustomerDashboard(){
 const {user,profile}=useAuth(); const [orders,setOrders]=useState<Order[]>([]),[places,setPlaces]=useState<Restaurant[]>([]);
 const [ordersLoading,setOrdersLoading]=useState(true),[placesLoading,setPlacesLoading]=useState(true);
 const [ordersError,setOrdersError]=useState(''),[placesError,setPlacesError]=useState('');
 useEffect(()=>{if(!user)return;setOrdersLoading(true);return subscribeCustomerOrders(user.uid,data=>{setOrders(data);setOrdersLoading(false);setOrdersError('')},e=>{setOrdersError(e.message);setOrdersLoading(false)})},[user?.uid]);
 useEffect(()=>subscribeApprovedRestaurants(data=>{setPlaces(data);setPlacesLoading(false);setPlacesError('')},e=>{setPlacesError(e.message);setPlacesLoading(false)}),[]);
 const active=orders.filter(o=>!['delivered','rejected'].includes(o.status));
 return <>
   <header className="frd-welcome"><div><p className="frd-eyebrow">WELCOME TO YOUR TABLE</p><h1>Good food, <em>{profile?.displayName?.split(' ')[0]||'friend'}.</em></h1><p className="frd-subtitle">Your restaurant discoveries and order updates, all in one place.</p></div><Link className="frd-button" to="/restaurants">Explore restaurants <DashboardIcon name="arrow" size={16}/></Link></header>
   <div className="frd-grid"><StatCard label="Your orders" value={ordersLoading?'—':orders.length} detail="Orders on this account" icon="receipt"/><StatCard label="In progress" value={ordersLoading?'—':active.length} detail="Not yet completed" icon="clock"/><StatCard label="Delivered" value={ordersLoading?'—':countByStatus(orders,'delivered')} detail="Completed orders" icon="check"/><StatCard label="Restaurants" value={placesLoading?'—':places.length} detail="Approved kitchens listed" icon="store"/></div>
   <div className="frd-columns"><div className="frd-stack"><Panel title="Recent orders" subtitle="Real-time status from your orders" action={<Link className="frd-button-link" to="/orders">View all →</Link>}>
     {ordersError?<ErrorStatus message={ordersError}/>:ordersLoading?<LoadStatus/>:!orders.length?<EmptyState title="Your journey starts here" detail="No orders yet. Explore an approved restaurant to place a development COD order." action={<Link className="frd-button frd-button-secondary" to="/restaurants">Browse restaurants</Link>}/>:<ul className="frd-list">{orders.slice(0,5).map(o=><li className="frd-list-item" key={o.id}><div><strong>{o.items?.map(i=>i.name).join(', ')||'Food order'}</strong><p>Order {o.id.slice(0,10)}… · {money(o.totalPaise)}</p></div><StatusPill status={o.status}/></li>)}</ul>}
   </Panel><div className="frd-feature"><div><p className="frd-eyebrow" style={{color:'#efbb85'}}>MADE FOR YOUR CRAVINGS</p><h2>More delicious moments.</h2><p>Browse menus from approved restaurant partners and discover your next meal.</p><Link className="frd-button" to="/restaurants">Find something tasty →</Link></div></div></div>
   <div className="frd-stack"><Panel title="Explore kitchens" subtitle="Available on FOODROUTE" action={<Link className="frd-button-link" to="/restaurants">All restaurants →</Link>}>
     {placesError?<ErrorStatus message={placesError}/>:placesLoading?<LoadStatus/>:places.length===0?<EmptyState title="No approved kitchens yet" detail="Restaurant profiles will appear after approval."/>:<ul className="frd-list">{places.slice(0,5).map(place=><li key={place.id} className="frd-list-item"><div><strong>{place.name}</strong><p>{place.city} · {place.cuisine}</p></div><Link to={`/restaurants/${place.id}`}>Menu ↗</Link></li>)}</ul>}
   </Panel><Panel title="Quick actions" subtitle="Jump back into your journey"><div className="frd-cards"><Link className="frd-mini-card" to="/checkout"><strong>My live bag</strong><p>Review your restaurant cart</p></Link><Link className="frd-mini-card" to="/customer/insights"><strong>My order insights</strong><p>Order history and status charts</p></Link><Link className="frd-mini-card" to="/account"><strong>Account settings</strong><p>Manage your profile</p></Link><Link className="frd-mini-card" to="/orders"><strong>Order history</strong><p>See previous orders</p></Link><Link className="frd-mini-card" to="/"><strong>Floating Food</strong><p>Visit the original homepage</p></Link></div></Panel></div></div>
   <p className="frd-note frd-topline">FOODROUTE currently supports development cash-on-delivery orders. Live GPS tracking, paid transactions and personalized recommendation models are not active.</p>
 </>;
}
