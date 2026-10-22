import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { dispatchCall,watchAgents,watchReadyOrders,type DeliveryAgent } from './dispatch.service';
import type { Order } from '../orders/order.types';
import './dispatch.css';
type Preview={orderId:string;riderUid:string;note:string;mode:string;feasible:boolean};
export function AdminDispatchPage(){
 const {profile}=useAuth();const [orders,setOrders]=useState<Order[]>([]),[riders,setRiders]=useState<DeliveryAgent[]>([]);
 const [orderId,setOrderId]=useState(''),[riderUid,setRiderUid]=useState(''),[preview,setPreview]=useState<Preview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{const stop1=watchReadyOrders(setOrders,e=>setError(e.message));const stop2=watchAgents(setRiders,e=>setError(e.message));return()=>{stop1();stop2()}},[]);
 const eligible=riders.filter(x=>x.status==='active'&&x.available&&!x.activeRouteId);const ready=orders.filter(x=>!x.activeRouteId);
 async function act(mode:'preview'|'commit'){if(!orderId||!riderUid)return;setBusy(true);setError('');setNotice('');try{
  if(mode==='preview'){setPreview(await dispatchCall<Preview>('dispatch/preview',{orderId,riderUid}))}
  else{await dispatchCall('dispatch/commit',{orderId,riderUid});setPreview(null);setNotice('Assignment committed. The selected rider will now see an offer.');setOrderId('');setRiderUid('')}
 }catch(e){setPreview(null);setError(e instanceof Error?e.message:'Dispatch failed')}finally{setBusy(false)}}
 return <div className="restaurant-page"><div className="restaurant-top"><Link className="restaurant-brand" to="/">f↗ foodroute<span>.</span></Link><nav><Link to="/admin/restaurant-applications">Restaurant applications</Link><Link to="/algorithm-lab">DAA Lab</Link><Link to="/admin/route-planner">Road planner</Link><Link to="/admin/optimized-dispatch">Optimized dispatch</Link><Link to="/admin/live-route-preview">Live order preview</Link><Link to="/account">Account</Link></nav></div><main className="restaurant-container dispatch-page"><header className="restaurant-intro"><p className="eyebrow"><span/> ADMIN OPERATIONS</p><h1>Dispatch desk<em>.</em></h1><p>Assign ready orders to available delivery partners. This is a single-order manual dispatch MVP, not geographic route optimization.</p></header>
 <div className="dispatch-metrics"><div className="restaurant-panel"><span>Ready orders</span><strong>{ready.length}</strong></div><div className="restaurant-panel"><span>Available riders</span><strong>{eligible.length}</strong></div><div className="restaurant-panel"><span>Current operator</span><strong>{profile?.role}</strong></div></div>
 <div className="restaurant-panel"><h2>Assign an order</h2><p className="restaurant-note">Preview does not write to Firestore. Commit validates eligibility again in a transaction.</p>
 <div className="dispatch-form"><label>Ready order<select value={orderId} onChange={e=>{setOrderId(e.target.value);setPreview(null)}}><option value="">Choose a ready order</option>{ready.map(o=><option key={o.id} value={o.id}>{o.id.slice(0,16)}… · {o.address.city} · {o.items.map(i=>i.name).join(', ')}</option>)}</select></label>
 <label>Available rider<select value={riderUid} onChange={e=>{setRiderUid(e.target.value);setPreview(null)}}><option value="">Choose rider</option>{eligible.map(r=><option key={r.uid} value={r.uid}>{r.displayName} · {r.city} · {r.vehicleType}</option>)}</select></label></div>
 {error&&<p className="restaurant-error" role="alert">{error}</p>}{notice&&<p className="restaurant-ok" role="status">{notice}</p>}
 <div className="restaurant-actions"><button className="restaurant-secondary" disabled={busy||!orderId||!riderUid} onClick={()=>void act('preview')}>Preview assignment</button><button className="restaurant-button" disabled={busy||!preview||preview.orderId!==orderId||preview.riderUid!==riderUid} onClick={()=>void act('commit')}>Commit dispatch</button></div>
 {preview&&<div className="dispatch-preview"><p className="restaurant-eyebrow">VALIDATED PREVIEW · NO WRITE YET</p><h3>Pickup → Drop-off</h3><p>{preview.note}</p><p>Algorithm: {preview.mode}</p></div>}
 </div><p className="restaurant-note">A trusted administrator role must be bootstrapped separately. Rider accounts must be approved through the local Admin SDK script.</p></main></div>;
}
