import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import type {UserRole} from '../auth/auth.types';
import {useAuth} from '../auth/useAuth';
import {restaurantDocId} from '../restaurants/restaurant.types';
import {subscribeCustomerOrders,subscribeRestaurantOrders} from '../orders/order.service';
import {watchReadyOrders,watchRiderRoutes} from '../dispatch/dispatch.service';
import type {Order} from '../orders/order.types';
import type {DeliveryRoute} from '../dispatch/dispatch.service';
import {DashboardIcon} from '../dashboard/DashboardIcon';
import '../insights/analytics.css';
type Notice={id:string;label:string;detail:string;to:string;time:number};
function fromOrders(orders:Order[],to:string):Notice[]{
 return [...orders].sort((a,b)=>(b.updatedAt?.toMillis()??b.createdAt?.toMillis()??0)-(a.updatedAt?.toMillis()??a.createdAt?.toMillis()??0)).slice(0,12).map(o=>({
  id:`order:${o.id}:${o.status}`,label:`Order #${o.id.slice(0,10)}`,detail:`Status: ${o.status.replaceAll('_',' ')}`,to,time:o.updatedAt?.toMillis()??o.createdAt?.toMillis()??0
 }));
}
function fromRoutes(routes:DeliveryRoute[]):Notice[]{return routes.slice(0,12).map(r=>({id:`route:${r.id}:${r.status}:${r.nextDropoffIndex??0}`,label:`Route #${r.id.slice(0,10)}`,detail:`${r.status.replaceAll('_',' ')} · ${r.orderIds?.length??1} order(s)`,to:'/rider/deliveries',time:0}));}
function getSeen(key:string):string[]{try{return JSON.parse(sessionStorage.getItem(key)||'[]') as string[]}catch{return []}}
/** In-app, session-scoped activity only. No browser push, FCM, emails, or Firestore writes. */
export function NotificationBell({role}:{role:UserRole}){
 const {user}=useAuth();const [notices,setNotices]=useState<Notice[]>([]);const [seen,setSeen]=useState<string[]>([]);
 const [open,setOpen]=useState(false);const [error,setError]=useState('');
 const uid=user?.uid??'';const key=`fr6b:seen:${uid}:${role}`;
 useEffect(()=>{setSeen(uid?getSeen(key):[]);setNotices([]);setOpen(false);setError('');if(!uid)return;
  const update=(n:Notice[])=>setNotices(n);
  const fail=(e:Error)=>setError(e.message);
  if(role==='customer')return subscribeCustomerOrders(uid,v=>update(fromOrders(v,'/orders')),fail);
  if(role==='restaurant')return subscribeRestaurantOrders(restaurantDocId(uid),v=>update(fromOrders(v,'/restaurant/orders')),fail);
  if(role==='rider')return watchRiderRoutes(uid,v=>update(fromRoutes(v)),fail);
  return watchReadyOrders(v=>update(fromOrders(v,'/admin/dispatch')),fail);
 },[uid,role,key]);
 const unread=notices.filter(n=>!seen.includes(n.id)).length;
 const markRead=()=>{const items=notices.map(n=>n.id);setSeen(items);try{sessionStorage.setItem(key,JSON.stringify(items))}catch{/* private browsing may disallow session storage */}};
 return <div className="fr6b-notification">
  <button type="button" className="fr6b-bell" aria-label={`Activity notifications, ${unread} unread`} aria-expanded={open} aria-haspopup="true" onClick={()=>setOpen(v=>!v)}><DashboardIcon name="bell" size={18}/>{unread>0&&<span className="fr6b-unread">{unread}</span>}</button>
  {open&&<section className="fr6b-popover" aria-label="Order and route notifications"><div className="fr6b-popover-head"><h2>Activity updates</h2><button type="button" onClick={markRead}>Mark all read</button></div>
   <p>Live status summaries from records your account can access. Unread state lasts this browser session only.</p>
   {error&&<p role="alert">Could not load updates: {error}</p>}
   {!notices.length?<p>No activity visible yet.</p>:<ul>{notices.map(n=><li key={n.id} className={!seen.includes(n.id)?'fr6b-new':''}><Link to={n.to} onClick={()=>setOpen(false)}>{n.label}</Link><small>{n.detail}</small></li>)}</ul>}
  </section>}
 </div>;
}
