import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {collection,limit,onSnapshot,orderBy,query} from 'firebase/firestore';
import {firestore} from '../../lib/firebase';
import {useAuth} from '../auth/useAuth';
import {subscribeCustomerOrders,subscribeRestaurantOrders} from '../orders/order.service';
import type {Order} from '../orders/order.types';
import {money,restaurantDocId} from '../restaurants/restaurant.types';
import {watchRiderRoutes,type DeliveryRoute} from '../dispatch/dispatch.service';
import {Panel,StatCard,EmptyState,LoadStatus,ErrorStatus,StatusPill} from '../dashboard/DashboardUI';
import {creationSeries,orderSummary,riderRouteSummary} from './analytics-core';
import './analytics.css';

type OrdersScope='customer'|'restaurant'|'admin';
function useScopedOrders(scope:OrdersScope){
 const {user}=useAuth();const [orders,setOrders]=useState<Order[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{
  if(!user){setLoading(false);return;}
  setLoading(true);setError('');
  const good=(v:Order[])=>{setOrders(v);setLoading(false)};const bad=(e:Error)=>{setError(e.message);setLoading(false)};
  try{
   if(scope==='customer')return subscribeCustomerOrders(user.uid,good,bad);
   if(scope==='restaurant')return subscribeRestaurantOrders(restaurantDocId(user.uid),good,bad);
   if(!firestore)throw new Error('Firestore configuration is missing.');
   // A deliberately limited sample; do not describe this as platform-wide lifetime revenue.
   return onSnapshot(query(collection(firestore,'orders'),orderBy('createdAt','desc'),limit(100)),s=>good(s.docs.map(d=>({id:d.id,...d.data()} as Order))),bad);
  }catch(e){bad(e instanceof Error?e:new Error('Could not read orders'));}
 },[user?.uid,scope]);
 return {orders,loading,error};
}
function VolumeBars({orders}:{orders:Order[]}){
 const days=useMemo(()=>creationSeries(orders),[orders]);const max=Math.max(1,...days.map(d=>d.count));
 return <div className="fr6b-bars" role="img" aria-label={`Orders created on each of the last 7 UTC calendar days: ${days.map(d=>`${d.day}: ${d.count}`).join('; ')}`}>
  {days.map((d,i)=><div className="fr6b-bar-group" key={i}><strong>{d.count}</strong><div className="fr6b-bar-track"><div style={{height:`${100*d.count/max}%`}} className="fr6b-bar"/></div><small>{d.day}</small></div>)}
 </div>;
}
/** Export only order IDs and totals, no customer PII or delivery coordinates. */
function exportCodCsv(orders:Order[]){
 const rows=[['order_id','created_at_utc','status','cod_order_value_paise'],...orders.map(o=>[
  o.id,o.createdAt?.toDate?.().toISOString()??'',o.status,String(o.totalPaise??0)
 ])];
 const escapeCsv=(s:string)=>{const safe=/^[=+@\-\t\r\n]/.test(s)?`'${s}`:s;return `"${safe.replaceAll('"','""')}"`;};
 const csv=rows.map(row=>row.map(escapeCsv).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='foodroute-cod-order-report.csv';document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function StatusTable({orders}:{orders:Order[]}){const statuses=['placed','accepted','preparing','ready_for_pickup','picked_up','delivered','rejected'];return <div className="fr6b-status-grid">{statuses.map(s=><div key={s}><StatusPill status={s}/><strong>{orders.filter(o=>o.status===s).length}</strong></div>)}</div>}
export function OrderAnalyticsPage({scope}:{scope:OrdersScope}){
 const {orders,loading,error}=useScopedOrders(scope);
 const [days,setDays]=useState<7|30|90>(30);
 const stats=useMemo(()=>orderSummary(orders,days),[orders,days]);
 const who=scope==='admin'?'Platform sample':scope==='restaurant'?'Kitchen':'Your';
 const back=scope==='admin'?'/admin/dashboard':scope==='restaurant'?'/restaurant/dashboard':'/customer/dashboard';
 return <div className="fr6b"><header className="frd-welcome"><div><p className="frd-eyebrow">PHASE 6B · READ ONLY</p><h1>{who} <em>insights.</em></h1><p className="frd-subtitle">Real Firestore order snapshots. COD figures reflect order value, not collected revenue or confirmed payment.</p></div><Link to={back} className="frd-button frd-button-secondary">← Dashboard</Link></header>
 <div className="fr6b-period"><label htmlFor="fr6b-days">Created within</label><select id="fr6b-days" value={days} onChange={e=>setDays(Number(e.target.value) as 7|30|90)}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select><span>{scope==='admin'?'Most recent 100 order documents only; older records may not be included.':'Based on orders visible to your account.'}</span>{scope==='restaurant'&&<button type="button" className="frd-button frd-button-secondary" disabled={loading||Boolean(error)||orders.length===0} onClick={()=>exportCodCsv(orders)}>Export COD report (CSV)</button>}</div>
 {error&&<ErrorStatus message={error}/>}
 {loading?<LoadStatus/>:<><div className="frd-grid"><StatCard label="Created in period" value={stats.recent} detail="Date based on order creation" icon="receipt"/><StatCard label="Delivered orders" value={stats.delivered} detail="Among period-created orders" icon="check"/><StatCard label="Delivered COD value" value={money(stats.deliveredCodValuePaise)} detail="Unverified payment / not revenue" icon="chart"/><StatCard label="Rejected orders" value={stats.rejected} detail="Among period-created orders" icon="alert"/></div>
 <div className="frd-columns"><Panel title="Daily order creation" subtitle="Seven UTC calendar days · number of orders"><VolumeBars orders={orders}/></Panel><Panel title="Current order statuses" subtitle="All loaded records, regardless of creation date"><StatusTable orders={orders}/></Panel></div>
 <Panel title="Most recently created orders" subtitle="Visible to this account; no private address information shown">{orders.length===0?<EmptyState title="No visible orders" detail="Charts and summaries will appear when orders exist."/>:<ul className="frd-list">{[...orders].sort((a,b)=>(b.createdAt?.toMillis()??0)-(a.createdAt?.toMillis()??0)).slice(0,8).map(o=><li key={o.id} className="frd-list-item"><div><strong>Order #{o.id.slice(0,12)}</strong><p>{money(o.totalPaise)} COD value · {o.createdAt?.toDate?.().toLocaleDateString('en-IN')??'Date unavailable'}</p></div><StatusPill status={o.status}/></li>)}</ul>}</Panel>
 </>}
 <p className="frd-note frd-topline">Client-side aggregates are limited to the Firestore documents authorized and loaded. They are not audited financial statements, collected sales, or unrestricted global totals.</p></div>;
}
export function RiderHistoryPage(){
 const {user}=useAuth();const [routes,setRoutes]=useState<DeliveryRoute[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{if(!user){setLoading(false);return;}return watchRiderRoutes(user.uid,r=>{setRoutes(r);setLoading(false)},e=>{setError(e.message);setLoading(false)})},[user?.uid]);
 const stats=useMemo(()=>riderRouteSummary(routes),[routes]);
 return <div className="fr6b"><header className="frd-welcome"><div><p className="frd-eyebrow">PHASE 6B · DELIVERY RECORDS</p><h1>My delivery <em>history.</em></h1><p className="frd-subtitle">Your authorized delivery route records, including completed stops from multi-order assignments.</p></div><Link to="/rider/deliveries" className="frd-button">My deliveries →</Link></header>
 {error&&<ErrorStatus message={error}/>}{loading?<LoadStatus/>:<><div className="frd-grid"><StatCard label="Completed drops" value={stats.deliveries} detail="Includes sequential completed stops" icon="check"/><StatCard label="Completed routes" value={stats.completedRoutes} detail="Fully completed assignments" icon="route"/><StatCard label="Active routes" value={stats.activeRoutes} detail="Offers / ongoing assignments" icon="clock"/><StatCard label="Declined offers" value={stats.declined} detail="Routes marked rejected" icon="receipt"/></div><Panel title="Delivery route ledger" subtitle="Read-only; no location tracking or earnings claims">{routes.length===0?<EmptyState title="No deliveries yet" detail="Accepted offers and completed routes will be listed here."/>:<ul className="frd-list">{[...routes].sort((a,b)=>a.id.localeCompare(b.id)).map(r=><li key={r.id} className="frd-list-item"><div><strong>Route #{r.id.slice(0,12)}</strong><p>{r.mode==='optimized-multi-order'?(r.orderIds?.length??0)+' planned drop-offs':'Single-order route'} · {r.mode||'manual'}{r.mode==='optimized-multi-order'&&r.status!=='delivered'&&r.status!=='rejected'?` · ${r.nextDropoffIndex??0} completed`:''}</p></div><StatusPill status={r.status}/></li>)}</ul>}</Panel></>}
 <p className="frd-note frd-topline">Route records may lack a completion timestamp; this page does not claim chronological ordering or compute wages. Actual earnings require verified settlements.</p></div>;
}
