/** Phase 5D: LOCAL-ONLY, bounded intelligent dispatch. Admin-only signed preview
 * + atomic version recheck; rider-only multi-order state machine. No external GPS API.
 * Not a production logistics engine: no live rider location, traffic or time windows. */
import {createHmac,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import {getAuth} from 'firebase-admin/auth';
import {FieldValue,getFirestore} from 'firebase-admin/firestore';
import {OrderError} from '../orders/order-core';
import {parseSelection,validateDispatchSnapshot,snapshotDigest,buildDispatchRoutes,type OrderSnapshot,type RiderSnapshot,type LocationSnapshot,type Selection} from './optimized-domain';
const db=()=>getFirestore();
const secret=(()=>{
 if(process.env.NODE_ENV!=='production')return randomBytes(32); // Ephemeral in local testing only.
 const raw=process.env.FOODROUTE_PREVIEW_SIGNING_KEY||'';
 if(!/^[a-zA-Z0-9+/]{43}=$/.test(raw)||Buffer.from(raw,'base64').length!==32)throw new Error('A valid 32-byte base64 preview signing key is required in production.');
 return Buffer.from(raw,'base64');
})();
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const invalid=(message:string):never=>{throw new OrderError('invalid-argument',message)};
const stale=(message:string):never=>{throw new OrderError('failed-precondition',message)};
async function activeActor(uid:string,role:'admin'|'rider'){
 if(!uid)throw new OrderError('unauthenticated','Sign in first.');
 const [account,profile]=await Promise.all([getAuth().getUser(uid),db().doc(`users/${uid}`).get()]);
 if(account.disabled||account.customClaims?.role!==role||profile.data()?.role!==role||profile.data()?.status!=='active')throw new OrderError('permission-denied',`Active ${role} permissions required.`);
}
function validate(selection:Selection,orders:OrderSnapshot[],riders:RiderSnapshot[],location:LocationSnapshot){
 try{return validateDispatchSnapshot(selection,orders,riders,location)}catch(e){return stale(e instanceof Error?e.message:'Dispatch source data changed.');}
}
async function fetchSelection(s:Selection){
 const [orders,riders,restaurant,location]=await Promise.all([
  Promise.all(s.orderIds.map(id=>db().doc(`orders/${id}`).get())),
  Promise.all(s.riderUids.map(id=>db().doc(`deliveryAgents/${id}`).get())),
  db().doc(`restaurants/${s.restaurantId}`).get(),db().doc(`restaurantLocations/${s.restaurantId}`).get()
 ]);
 if(restaurant.data()?.approved!==true||restaurant.data()?.status!=='active')return stale('Restaurant is not approved and active.');
 if(orders.some(x=>!x.exists)||riders.some(x=>!x.exists)||!location.exists)return stale('Some records or restaurant pickup coordinates are missing.');
 return {orders:orders.map((x,i)=>({...x.data(),id:s.orderIds[i]} as OrderSnapshot)),riders:riders.map((x,i)=>({...x.data(),uid:s.riderUids[i]} as RiderSnapshot)),location:location.data() as LocationSnapshot};
}
type Ticket={v:1;uid:string;selection:Selection;digest:string;routes:{riderUid:string;orderIds:string[];seconds:number;meters:number}[];issuedAt:number;expiresAt:number};
function sign(ticket:Ticket){const payload=Buffer.from(JSON.stringify(ticket)).toString('base64url');const mac=createHmac('sha256',secret).update(payload).digest('hex');return `${payload}.${mac}`}
function unsign(raw:unknown,uid:string):Ticket{
 if(typeof raw!=='string'||raw.length>8500||raw.length<60)return invalid('Missing or invalid dispatch preview token.');
 const [payload,mac,...extra]=raw.split('.');if(!payload||!mac||extra.length||!/^([a-f0-9]{64})$/.test(mac))return invalid('Invalid dispatch preview signature.');
 const expected=createHmac('sha256',secret).update(payload).digest();const received=Buffer.from(mac,'hex');
 if(received.length!==expected.length||!timingSafeEqual(received,expected))throw new OrderError('permission-denied','Dispatch preview signature is invalid.');
 let ticket:unknown;try{ticket=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as unknown}catch{return invalid('Invalid dispatch preview payload.');}
 if(!record(ticket)||ticket.v!==1||ticket.uid!==uid||typeof ticket.expiresAt!=='number'||typeof ticket.issuedAt!=='number'||ticket.expiresAt<Date.now()||ticket.issuedAt>Date.now()+30000||ticket.expiresAt-ticket.issuedAt>5*60*1000||typeof ticket.digest!=='string'||!Array.isArray(ticket.routes))return stale('Preview expired or is invalid. Calculate again.');
 let selection:Selection;try{selection=parseSelection(ticket.selection)}catch{return invalid('Invalid preview selection.');}
 if(ticket.routes.length!==selection.riderUids.length||ticket.routes.some((r:unknown)=>!record(r)||typeof r.riderUid!=='string'||!Array.isArray(r.orderIds)))return invalid('Invalid preview route data.');
 return {...ticket,selection} as Ticket;
}
export async function previewOptimizedDispatch(uid:string,input:unknown){
 await activeActor(uid,'admin');let selection:Selection;try{selection=parseSelection(input)}catch(e){return invalid(e instanceof Error?e.message:'Invalid request.');}
 const data=await fetchSelection(selection);
 const {points}=validate(selection,data.orders,data.riders,data.location);
 const solution=buildDispatchRoutes(selection,points);
 const now=Date.now();const ticket:Ticket={v:1,uid,selection,digest:snapshotDigest(selection,data.orders,data.riders,data.location),routes:solution.routes,issuedAt:now,expiresAt:now+3*60*1000};
 return {previewToken:sign(ticket),expiresAt:ticket.expiresAt,restaurantId:selection.restaurantId,orderCount:selection.orderIds.length,mode:'verified-pins-synthetic',objective:'estimated travel seconds, round trips to one restaurant depot',algorithm:'Capacity-limited cheapest insertion + directed 2-opt',routes:solution.routes,totalSeconds:solution.seconds,totalMeters:solution.meters,
  warning:'Coordinates are confirmed by users, not independently surveyed. Estimates are synthetic (Haversine × 1.3, assumed 28 km/h), NOT road ETAs. Riders have no live location. No dispatch was committed.'};
}
export async function commitOptimizedDispatch(uid:string,input:unknown){
 await activeActor(uid,'admin');if(!record(input))return invalid('Invalid commit request.');
 const ticket=unsign(input.previewToken,uid),s=ticket.selection;
 const routeIds=s.riderUids.map(()=>`route_${randomUUID().replaceAll('-','')}`);
 const orderRefs=s.orderIds.map(id=>db().doc(`orders/${id}`)),riderRefs=s.riderUids.map(id=>db().doc(`deliveryAgents/${id}`));
 const restRef=db().doc(`restaurants/${s.restaurantId}`),locationRef=db().doc(`restaurantLocations/${s.restaurantId}`);
 await db().runTransaction(async tx=>{
  // All reads happen before all writes. Firestore detects concurrent modifications.
  const [orders,riders,restaurant,location]=await Promise.all([
   Promise.all(orderRefs.map(r=>tx.get(r))),Promise.all(riderRefs.map(r=>tx.get(r))),tx.get(restRef),tx.get(locationRef)
  ]);
  if(restaurant.data()?.approved!==true||restaurant.data()?.status!=='active'||!location.exists||orders.some(x=>!x.exists)||riders.some(x=>!x.exists))return stale('Dispatch source data changed; preview again.');
  const os=orders.map((x,i)=>({...x.data(),id:s.orderIds[i]} as OrderSnapshot));
  const rs=riders.map((x,i)=>({...x.data(),uid:s.riderUids[i]} as RiderSnapshot));
  const loc=location.data() as LocationSnapshot;
  const {points}=validate(s,os,rs,loc);
  if(snapshotDigest(s,os,rs,loc)!==ticket.digest)return stale('Order, location, or rider availability changed. Preview again.');
  const recalculated=buildDispatchRoutes(s,points);
  if(JSON.stringify(recalculated.routes)!==JSON.stringify(ticket.routes))return stale('Optimization plan changed. Preview again.');
  for(let i=0;i<ticket.routes.length;i++){
   const route=ticket.routes[i],routeId=routeIds[i];
   const stops=[{sequence:1,kind:'pickup',restaurantId:s.restaurantId},...route.orderIds.map((orderId,j)=>({sequence:j+2,kind:'dropoff',orderId}))];
   tx.create(db().doc(`deliveryRoutes/${routeId}`),{
    mode:'optimized-multi-order',algorithm:'Capacity-limited insertion + 2-opt (synthetic)',routeSource:'customer-confirmed-pins',restaurantId:s.restaurantId,
    orderId:route.orderIds[0],orderIds:route.orderIds,riderUid:route.riderUid,status:'offered',nextDropoffIndex:0,
    stops,estimatedSeconds:route.seconds,estimatedMeters:route.meters,version:1,createdBy:uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
   });
   tx.update(riderRefs[i],{activeRouteId:routeId,available:false,updatedAt:FieldValue.serverTimestamp()});
   for(const orderId of route.orderIds){
    const ref=db().doc(`orders/${orderId}`);
    tx.update(ref,{assignedRiderUid:route.riderUid,activeRouteId:routeId,assignmentStatus:'offered',updatedAt:FieldValue.serverTimestamp()});
    tx.create(ref.collection('events').doc(randomUUID()),{kind:'optimized_dispatch_offered',routeId,actorUid:uid,at:FieldValue.serverTimestamp()});
   }
  }
 });
 return {ok:true,routeIds,orderIds:s.orderIds,assignedRiders:s.riderUids,mode:'optimized-multi-order'};
}
export async function optimizedRiderAction(uid:string,input:unknown){
 await activeActor(uid,'rider');if(!record(input)||typeof input.routeId!=='string'||!/^route_[A-Za-z0-9_-]{8,110}$/.test(input.routeId)||!['accept','reject','pickup','deliver'].includes(String(input.action)))return invalid('Invalid multi-stop route action.');
 const routeId=input.routeId,action=String(input.action),ref=db().doc(`deliveryRoutes/${routeId}`);
 return db().runTransaction(async tx=>{
  const routeSnap=await tx.get(ref);if(!routeSnap.exists)return stale('Route not found.');
  const route=routeSnap.data()!;
  if(route.riderUid!==uid||route.mode!=='optimized-multi-order')throw new OrderError('permission-denied','Not your multi-stop route.');
  const orderIds=route.orderIds;
  if(!Array.isArray(orderIds)||orderIds.length<1||orderIds.length>3||orderIds.some(v=>typeof v!=='string'||!/^ord_[a-f0-9]{40}$/.test(v)))return stale('Invalid route order IDs.');
  const riderRef=db().doc(`deliveryAgents/${uid}`),orderRefs=orderIds.map((id:string)=>db().doc(`orders/${id}`));
  const [rider,...orders]=await Promise.all([tx.get(riderRef),...orderRefs.map(r=>tx.get(r))]);
  if(rider.data()?.activeRouteId!==routeId||orders.some(o=>!o.exists||o.data()?.activeRouteId!==routeId||o.data()?.assignedRiderUid!==uid))return stale('Assignment changed. Reload your route.');
  const current=route.status as string;
  if(action==='accept'||action==='reject'){
   if(current!=='offered')return stale('This offer was already handled. Refresh.');
   tx.update(ref,{status:action==='accept'?'accepted':'rejected',updatedAt:FieldValue.serverTimestamp()});
   for(const r of orderRefs)tx.update(r,action==='reject'?{assignedRiderUid:FieldValue.delete(),activeRouteId:FieldValue.delete(),assignmentStatus:'unassigned',updatedAt:FieldValue.serverTimestamp()}:{assignmentStatus:'accepted',updatedAt:FieldValue.serverTimestamp()});
   if(action==='reject')tx.update(riderRef,{activeRouteId:FieldValue.delete(),available:true,updatedAt:FieldValue.serverTimestamp()});
  }else if(action==='pickup'){
   if(current!=='accepted'||orders.some(o=>o.data()?.status!=='ready_for_pickup'))return stale('Every order must be ready and the route accepted.');
   tx.update(ref,{status:'picked_up',updatedAt:FieldValue.serverTimestamp()});
   for(const r of orderRefs)tx.update(r,{status:'picked_up',assignmentStatus:'active',updatedAt:FieldValue.serverTimestamp()});
  }else{
   if(current!=='picked_up'||!Number.isInteger(route.nextDropoffIndex))return stale('Pickup must be confirmed before delivery.');
   const next=route.nextDropoffIndex as number;
   if(next<0||next>=orderIds.length||input.orderId!==orderIds[next]||orders[next].data()?.status!=='picked_up')return stale('Confirm only the next pending drop-off in route order.');
   tx.update(orderRefs[next],{status:'delivered',assignmentStatus:'completed',updatedAt:FieldValue.serverTimestamp()});
   const finished=next===orderIds.length-1;
   tx.update(ref,{status:finished?'delivered':'picked_up',nextDropoffIndex:next+1,updatedAt:FieldValue.serverTimestamp()});
   if(finished)tx.update(riderRef,{activeRouteId:FieldValue.delete(),available:true,updatedAt:FieldValue.serverTimestamp()});
  }
  for(const id of action==='deliver'?[String(input.orderId)]:orderIds){
   tx.create(db().doc(`orders/${id}/events/${randomUUID()}`),{kind:'optimized_rider_action',routeId,action,actorUid:uid,at:FieldValue.serverTimestamp()});
  }
  return {ok:true,action,routeId};
 });
}
