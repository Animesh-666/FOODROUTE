/** Phase 5C: admin-only, read-only routing preview linked to *real* unassigned ready order IDs.
 * Coordinates are deliberately user-entered fictitious sample stops, NOT geocoded customer addresses.
 * This module NEVER writes to Firestore or commits dispatch. */
import {createHash} from 'node:crypto';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {OrderError} from '../orders/order-core';
import {createRoadPlan} from './road-core';
import {ORDER_ID_RE,RESTAURANT_ID_RE,selectReadyOrders,limitReadyOrders,type ReadyOrder} from './live-order-validation';

const db=()=>getFirestore();
const rec=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
async function requireActiveAdmin(uid:string){
 const [auth,p]=await Promise.all([getAuth().getUser(uid),db().doc(`users/${uid}`).get()]);
 if(auth.disabled||auth.customClaims?.role!=='admin'||p.data()?.role!=='admin'||p.data()?.status!=='active')
  throw new OrderError('permission-denied','An active administrator account is required.');
}
export type EligibleOrder={orderId:string;restaurantId:string;restaurantName:string;city:string;status:'ready_for_pickup';updatedAt:string|null};
function asIso(v:unknown):string|null{
 if(v&&typeof v==='object'&&'toDate' in v&&typeof (v as {toDate?:unknown}).toDate==='function')
  return (v as {toDate:()=>Date}).toDate().toISOString();
 return null;
}
export async function listEligibleOrders(uid:string,_input:unknown){
 await requireActiveAdmin(uid);
 const snaps=await db().collection('orders').where('status','==','ready_for_pickup').limit(75).get();
 const eligible=limitReadyOrders(snaps.docs.map(d=>({...d.data(),id:d.id} as ReadyOrder & Record<string,unknown>)));
 const restaurantIds=[...new Set(eligible.map(o=>o.restaurantId))].filter(id=>RESTAURANT_ID_RE.test(id));
 const restaurants=await Promise.all(restaurantIds.map(async id=>({id,snap:await db().doc(`restaurants/${id}`).get()})));
 const restaurantNames=new Map(restaurants.filter(r=>r.snap.exists&&r.snap.data()?.approved===true&&r.snap.data()?.status==='active').map(r=>[r.id,String(r.snap.data()?.name??'Restaurant')]));
 const orders:EligibleOrder[]=eligible.filter(o=>restaurantNames.has(o.restaurantId)).map(o=>({orderId:o.id,restaurantId:o.restaurantId,
  restaurantName:restaurantNames.get(o.restaurantId)!,city:rec(o.address)&&typeof o.address.city==='string'?o.address.city.slice(0,80):'Unknown',
  status:'ready_for_pickup',updatedAt:asIso(o.updatedAt)}));
 return {orders,queriedAt:new Date().toISOString(),limited:true,
  note:'Admin-only ready, unassigned order IDs. Address details and private coordinates are never sent to this list.'};
}
export async function previewLiveOrderRoutes(uid:string,input:unknown){
 await requireActiveAdmin(uid);
 if(!rec(input))throw new OrderError('invalid-argument','Invalid preview request.');
 const restaurantId=input.restaurantId,orderIds=input.orderIds;
 if(typeof restaurantId!=='string'||!RESTAURANT_ID_RE.test(restaurantId)||!Array.isArray(orderIds)||orderIds.length<1||orderIds.length>7||orderIds.some(id=>typeof id!=='string'||!ORDER_ID_RE.test(id))||new Set(orderIds).size!==orderIds.length)
  throw new OrderError('invalid-argument','Choose a restaurant and 1–7 distinct ready orders.');
 if(input.sampleLocationsConfirmed!==true)throw new OrderError('invalid-argument','Confirm the stop coordinates are non-sensitive illustrative locations, not verified customer destinations.');
 if(!Array.isArray(input.points)||input.points.length!==orderIds.length+1)throw new OrderError('invalid-argument','Supply a depot plus one sample waypoint per selected order.');
 const selectedDocs=await Promise.all((orderIds as string[]).map(id=>db().doc(`orders/${id}`).get()));
 try {selectReadyOrders({restaurantId,orderIds},selectedDocs.map((d,i)=>({id:String(orderIds[i]),restaurantId:String(d.data()?.restaurantId??''),status:String(d.data()?.status??''),activeRouteId:d.data()?.activeRouteId,assignedRiderUid:d.data()?.assignedRiderUid})));}
 catch(e){throw new OrderError('failed-precondition',e instanceof Error?e.message:'Stale order selection.');}
 const restaurant=await db().doc(`restaurants/${restaurantId}`).get();
 if(!restaurant.exists||restaurant.data()?.approved!==true||restaurant.data()?.status!=='active')throw new OrderError('failed-precondition','Restaurant is no longer active.');
 // Canonical labels replace user-provided labels: never forward customer street addresses to routing providers.
 const points=input.points.map((v,i)=>{
  if(!rec(v))throw new OrderError('invalid-argument','Invalid waypoint.');
  return {id:i===0?'depot':`stop${i}`,label:i===0?'Illustrative kitchen':`Illustrative order ${i}`,lat:v.lat,lng:v.lng};
 });
 const response=await createRoadPlan(uid,{points,riders:input.riders,capacity:input.capacity,mode:input.mode,externalConsent:input.externalConsent});
 // A public road-matrix request may be slow: reject a preview if any linked order changed while computing.
 const checkedAgain=await Promise.all((orderIds as string[]).map(id=>db().doc(`orders/${id}`).get()));
 try{selectReadyOrders({restaurantId,orderIds},checkedAgain.map((d,i)=>({id:String(orderIds[i]),restaurantId:String(d.data()?.restaurantId??''),status:String(d.data()?.status??''),activeRouteId:d.data()?.activeRouteId,assignedRiderUid:d.data()?.assignedRiderUid})));}
 catch{throw new OrderError('failed-precondition','Order state changed during routing. Refresh the list and retry.');}
 if(checkedAgain.some((d,i)=>asIso(d.data()?.updatedAt)!==asIso(selectedDocs[i].data()?.updatedAt)))
  throw new OrderError('failed-precondition','An order changed during route calculation. Refresh and retry.');
 const versions=selectedDocs.map((d,i)=>`${String(orderIds[i])}:${asIso(d.data()?.updatedAt)??'unknown'}`);
 const previewFingerprint=createHash('sha256').update(JSON.stringify({restaurantId,versions,points,mode:input.mode,riders:input.riders,capacity:input.capacity})).digest('hex').slice(0,20);
 return {...response,restaurantId,restaurantName:String(restaurant.data()?.name??'Restaurant'),orderIds,
  destinations:(orderIds as string[]).map((orderId,i)=>({index:i+1,orderId,city:String(rec(selectedDocs[i].data()?.address)?selectedDocs[i].data()?.address.city??'Unknown':'Unknown').slice(0,80)})),
  previewFingerprint,verifiedAt:new Date().toISOString(),readOnly:true,dispatchReady:false,
  locationSource:'Manually entered illustrative points. No actual order coordinates, geocoding, or customer location verification.',
  warning:'Real order IDs were checked as ready and unassigned at preview time; these are NOT actual delivery paths. Dispatch is NOT committed and orders may change.'};
}
