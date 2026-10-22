import {useEffect,useState} from 'react';
import {collection,onSnapshot,query,where} from 'firebase/firestore';
import {Link} from 'react-router-dom';
import {firestore} from '../../lib/firebase';
import {watchAgents,watchReadyOrders,type DeliveryAgent} from '../dispatch/dispatch.service';
import {subscribePendingApplications} from '../restaurants/restaurant.service';
import type {Order} from '../orders/order.types';
import type {RestaurantApplication} from '../restaurants/restaurant.types';
import {StatCard,Panel,EmptyState,LoadStatus,ErrorStatus} from './DashboardUI';
import {DashboardIcon} from './DashboardIcon';
export function AdminOverview(){
 const [orders,setOrders]=useState<Order[]>([]),[agents,setAgents]=useState<DeliveryAgent[]>([]),[restaurantApps,setRestaurantApps]=useState<RestaurantApplication[]>([]),[riderApps,setRiderApps]=useState<{ownerUid:string;displayName:string;city:string}[]>([]);
 const [loading,setLoading]=useState({orders:true,agents:true,restaurants:true,riders:true}),[errors,setErrors]=useState<Record<string,string>>({});
 useEffect(()=>{
  const unsubs:(()=>void)[]=[];
  const fail=(key:keyof typeof loading)=>(e:Error)=>{setErrors(s=>({...s,[key]:e.message}));setLoading(s=>({...s,[key]:false}))};
  unsubs.push(watchReadyOrders(v=>{setOrders(v);setLoading(s=>({...s,orders:false}))},fail('orders')));
  unsubs.push(watchAgents(v=>{setAgents(v);setLoading(s=>({...s,agents:false}))},fail('agents')));
  unsubs.push(subscribePendingApplications(v=>{setRestaurantApps(v);setLoading(s=>({...s,restaurants:false}))},fail('restaurants')));
  if(firestore){unsubs.push(onSnapshot(query(collection(firestore,'riderApplications'),where('status','==','pending')),snap=>{setRiderApps(snap.docs.map(d=>d.data() as {ownerUid:string;displayName:string;city:string}));setLoading(s=>({...s,riders:false}))},fail('riders')))}
  else fail('riders')(new Error('Firestore not configured.'));
  return()=>{unsubs.forEach(stop=>stop())};
 },[]);
 const available=agents.filter(a=>a.available&&!a.activeRouteId);
 return <><header className="frd-welcome"><div><p className="frd-eyebrow">PLATFORM OVERVIEW</p><h1>The bigger <em>picture.</em></h1><p className="frd-subtitle">Orders, rider capacity, and approval queues from your authorized Firestore views.</p></div><Link to="/admin/dispatch" className="frd-button">Open dispatch <DashboardIcon name="arrow" size={16}/></Link></header>
 <div className="frd-grid"><StatCard label="Ready for pickup" value={loading.orders?'—':orders.length} detail="Order queue at present" icon="receipt"/><StatCard label="Available riders" value={loading.agents?'—':available.length} detail="Online and unreserved" icon="route"/><StatCard label="Restaurant requests" value={loading.restaurants?'—':restaurantApps.length} detail="Applications pending review" icon="store"/><StatCard label="Rider requests" value={loading.riders?'—':riderApps.length} detail="Applications pending review" icon="user"/></div>
 {Object.entries(errors).map(([key,message])=><ErrorStatus key={key} message={`${key}: ${message}`}/>)}
 <div className="frd-columns"><div className="frd-stack"><Panel title="Attention queue" subtitle="Actionable operational records" action={<Link className="frd-button-link" to="/admin/dispatch">Dispatch desk →</Link>}>
 {loading.orders?<LoadStatus/>:!orders.length?<EmptyState title="No orders ready for pickup" detail="When a restaurant marks food ready, eligible unassigned orders appear here."/>:<ul className="frd-list">{orders.slice(0,6).map(order=><li className="frd-list-item" key={order.id}><div><strong>Ready order · #{order.id.slice(0,12)}</strong><p>{order.items?.map(x=>x.name).join(', ')||'Restaurant order'} · {order.assignedRiderUid?'Rider assigned':'Review assignment in dispatch'}</p></div><Link to="/admin/dispatch">Review →</Link></li>)}</ul>}
 </Panel><Panel title="Route intelligence" subtitle="Advanced tools stay separate from live dispatch"><div className="frd-cards"><Link to="/admin/analytics" className="frd-mini-card"><strong>Order analytics</strong><p>Recent statuses, COD values and volume</p></Link><Link to="/admin/route-planner" className="frd-mini-card"><strong>Road planner</strong><p>Simulation and OSRM road matrix</p></Link><Link to="/admin/live-route-preview" className="frd-mini-card"><strong>Live-order preview</strong><p>Read-only, illustrative sample stops</p></Link><Link to="/algorithm-lab" className="frd-mini-card"><strong>Algorithm laboratory</strong><p>Compare Greedy, DP and 2-opt</p></Link><Link to="/admin/optimized-dispatch" className="frd-mini-card"><strong>Optimized dispatch</strong><p>Signed preview and atomic multi-order route offers</p></Link><Link to="/admin/dispatch" className="frd-mini-card"><strong>Dispatch desk</strong><p>Assign eligible riders securely</p></Link></div></Panel></div>
 <div className="frd-stack"><Panel title="Partner approvals" subtitle="Trusted actions only, no self-provisioning" action={<Link className="frd-button-link" to="/admin/restaurant-applications">Restaurant review →</Link>}>
 {loading.restaurants||loading.riders?<LoadStatus/>:<><ul className="frd-list">{restaurantApps.slice(0,3).map(a=><li key={a.ownerUid} className="frd-list-item"><div><strong>{a.name}</strong><p>Restaurant · {a.city}</p></div><span className="frd-pill frd-pill-warm">Pending</span></li>)}{riderApps.slice(0,3).map(a=><li key={a.ownerUid} className="frd-list-item"><div><strong>{a.displayName}</strong><p>Rider · {a.city}</p></div><span className="frd-pill frd-pill-warm">Pending</span></li>)}</ul>{!restaurantApps.length&&!riderApps.length&&<EmptyState title="Approvals caught up" detail="No pending applications in your current authorized results."/>}</>}
 </Panel><Panel title="Operational note"><p className="frd-note">These counts reflect current, permitted Firestore query results—not all-time platform analytics. Phase 5C route previews use sample coordinates; never dispatch from synthetic pins.</p></Panel></div></div></>;
}
