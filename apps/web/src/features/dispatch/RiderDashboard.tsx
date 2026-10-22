import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { dispatchCall,watchRider,watchRiderRoutes,watchRiderOrder,type DeliveryAgent,type DeliveryRoute } from './dispatch.service';
import type { Order } from '../orders/order.types';
import './dispatch.css';
import './optimized-dispatch.css';
function ActiveOrder({route}:{route:DeliveryRoute}){
 const [order,setOrder]=useState<Order|null>(null);
 useEffect(()=>watchRiderOrder(route.orderId,setOrder,()=>setOrder(null)),[route.orderId]);
 return <div className="dispatch-meta"><p>Order: {route.orderId.slice(0,19)}…</p><p>Food: {order?.items.map(x=>x.name).join(', ')??'Loading…'}</p><p>Destination: {order?.address.city??'—'} · Delivery address visible only while assigned</p></div>;
}
function MultiStopOrder({id,done,current}:{id:string;done:boolean;current:boolean}){
 const [order,setOrder]=useState<Order|null>(null);
 useEffect(()=>watchRiderOrder(id,setOrder,()=>setOrder(null)),[id]);
 return <li className="optimized-dropoff"><strong>{id.slice(0,18)}…</strong> · {order?.address?.city??'Loading destination…'} {done?'✓ Delivered':current?'← Next stop':''}<small>{order?.items?.map(x=>x.name).join(', ')??''}</small></li>;
}
function OptimizedRouteCard({route,busy,call}:{route:DeliveryRoute;busy:boolean;call:(endpoint:string,input:unknown)=>Promise<void>}){
 const ids=route.orderIds??[];const next=route.nextDropoffIndex??0;
 return <article className="restaurant-panel" key={route.id}><span className="restaurant-eyebrow">OPTIMIZED TEST ROUTE · {route.id.slice(0,18)}…</span><div className="dispatch-row"><h2>{route.status.replaceAll('_',' ')}</h2><span className="order-badge">{ids.length}-order delivery</span></div><p className="restaurant-note">One kitchen pickup, then deliveries in the confirmed order below. This preview does not include road navigation or live traffic.</p><ol className="optimized-stop-list">{ids.map((id,i)=><MultiStopOrder key={id} id={id} done={i<next} current={i===next}/>)}</ol><div className="restaurant-actions">
 {route.status==='offered'&&<><button disabled={busy} className="restaurant-button" onClick={()=>void call('optimized/rider-action',{routeId:route.id,action:'accept'})}>Accept route</button><button disabled={busy} className="restaurant-secondary" onClick={()=>void call('optimized/rider-action',{routeId:route.id,action:'reject'})}>Decline route</button></>}
 {route.status==='accepted'&&<button disabled={busy} className="restaurant-button" onClick={()=>void call('optimized/rider-action',{routeId:route.id,action:'pickup'})}>Confirm all food collected</button>}
 {route.status==='picked_up'&&next<ids.length&&<button disabled={busy} className="restaurant-button" onClick={()=>void call('optimized/rider-action',{routeId:route.id,action:'deliver',orderId:ids[next]})}>Mark next order delivered ({next+1}/{ids.length})</button>}
 </div></article>;
}
export function RiderDashboard(){
 const {user}=useAuth();const [rider,setRider]=useState<DeliveryAgent|null>(null),[routes,setRoutes]=useState<DeliveryRoute[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!user)return;const stop1=watchRider(user.uid,setRider,e=>setError(e.message));const stop2=watchRiderRoutes(user.uid,setRoutes,e=>setError(e.message));return()=>{stop1();stop2()}},[user]);
 async function call(path:string,payload:unknown){setBusy(true);setError('');try{await dispatchCall(path,payload)}catch(e){setError(e instanceof Error?e.message:'Could not update rider status.')}finally{setBusy(false)}}
 const active=routes.filter(r=>!['rejected','delivered'].includes(r.status));
 return <div className="restaurant-page"><div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><nav><Link to="/account">Account</Link><Link to="/restaurants">Customer view</Link></nav></div><main className="restaurant-container dispatch-page"><header className="restaurant-intro"><p className="eyebrow"><span/> DELIVERY PARTNER</p><h1>My deliveries<em>.</em></h1><p>A mobile-friendly workflow for assigned food deliveries. Follow road safety and use navigation only when stopped.</p></header>
 {error&&<p className="restaurant-error" role="alert">{error}</p>}
 {!rider?<p role="status">Loading rider profile… If recently approved, sign out and back in.</p>:<div className="restaurant-panel dispatch-row"><div><p className="restaurant-eyebrow">YOUR AVAILABILITY</p><h2>{rider.available?'Available for offers':rider.activeRouteId?'On a delivery':'Offline'}</h2><p>{rider.city} · {rider.vehicleType}</p></div><button className="restaurant-button" disabled={busy||Boolean(rider.activeRouteId)} onClick={()=>void call('rider/availability',{available:!rider.available})}>{rider.available?'Go offline':'Go online'}</button></div>}
 <h2 className="dispatch-section">Active assignment{active.length===1?'':'s'}</h2>
 {active.length===0?<div className="restaurant-empty">No active delivery offer. Set yourself available and wait for admin assignment.</div>:active.map(r=>r.mode==='optimized-multi-order'?<OptimizedRouteCard key={r.id} route={r} busy={busy} call={call}/>:<article className="restaurant-panel" key={r.id}><span className="restaurant-eyebrow">ROUTE {r.id.slice(0,19)}…</span><div className="dispatch-row"><h2>{r.status.replaceAll('_',' ')}</h2><span className="order-badge">Single-order delivery</span></div><ActiveOrder route={r}/><p className="restaurant-note">Stop 1: restaurant pickup. Stop 2: customer drop-off. No road directions or estimated travel distance yet.</p><div className="restaurant-actions">
 {r.status==='offered'&&<><button disabled={busy} className="restaurant-button" onClick={()=>void call('rider/action',{routeId:r.id,action:'accept'})}>Accept offer</button><button disabled={busy} className="restaurant-secondary" onClick={()=>void call('rider/action',{routeId:r.id,action:'reject'})}>Decline offer</button></>}
 {r.status==='accepted'&&<button disabled={busy} className="restaurant-button" onClick={()=>void call('rider/action',{routeId:r.id,action:'pickup'})}>Confirm food collected</button>}
 {r.status==='picked_up'&&<button disabled={busy} className="restaurant-button" onClick={()=>void call('rider/action',{routeId:r.id,action:'deliver'})}>Confirm delivered</button>}
 </div></article>)}
 <p className="restaurant-note">Tracking and proof of delivery require separate privacy, consent, and verification controls before production use.</p>
 </main></div>;
}
