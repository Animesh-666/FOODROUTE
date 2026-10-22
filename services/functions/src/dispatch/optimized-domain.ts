/** Pure Phase 5D domain helpers: bounded, verified-pin, depot-first dispatch. */
import { createHash } from 'node:crypto';
import { distanceMeters, point, type Point } from '../location/location-domain';
import { multiRiderRoad, syntheticRoadMatrix, type DispatchRoute } from './optimized-routing';

export const ORDER_RE = /^ord_[0-9a-f]{40}$/;
export const RIDER_RE = /^[A-Za-z0-9_-]{4,128}$/;
export const REST_RE = /^rest_[A-Za-z0-9_-]{1,128}$/;
export type OrderSnapshot={ id:string;restaurantId:string;status:string;assignedRiderUid?:unknown;activeRouteId?:unknown;deliveryLocation?:unknown;address?:unknown;updatedAt?:unknown };
export type RiderSnapshot={uid:string;status:string;available?:unknown;activeRouteId?:unknown};
export type LocationSnapshot={point?:unknown;version?:unknown;confirmation?:unknown;radiusMeters?:unknown};
export type Selection={restaurantId:string;orderIds:string[];riderUids:string[];capacity:number};
const object=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fail=(s:string):never=>{throw new Error(s)};
export function parseSelection(input:unknown):Selection{
 if(!object(input))return fail('Invalid optimized dispatch request.');
 const {restaurantId,orderIds,riderUids,capacity}=input;
 if(typeof restaurantId!=='string'||!REST_RE.test(restaurantId))return fail('Choose a valid restaurant.');
 if(!Array.isArray(orderIds)||orderIds.length<1||orderIds.length>6||orderIds.some(x=>typeof x!=='string'||!ORDER_RE.test(x))||new Set(orderIds).size!==orderIds.length)return fail('Select 1–6 distinct orders.');
 if(!Array.isArray(riderUids)||riderUids.length<1||riderUids.length>3||riderUids.some(x=>typeof x!=='string'||!RIDER_RE.test(x))||new Set(riderUids).size!==riderUids.length)return fail('Select 1–3 distinct rider accounts.');
 if(!Number.isInteger(capacity)||typeof capacity!=='number'||capacity<1||capacity>3||capacity*riderUids.length<orderIds.length||riderUids.length>orderIds.length)return fail('Each rider supports 1–3 orders. Choose enough capacity and no idle rider.');
 return {restaurantId,orderIds:[...orderIds],riderUids:[...riderUids],capacity};
}
export function validateDispatchSnapshot(selection:Selection,orders:OrderSnapshot[],riders:RiderSnapshot[],location:LocationSnapshot):{points:Point[];locationVersion:number}{
 if(orders.length!==selection.orderIds.length||riders.length!==selection.riderUids.length)return fail('Order or rider records disappeared.');
 if(location.confirmation!=='operator-confirmed'||!Number.isInteger(location.version)||Number(location.version)<1)return fail('Restaurant pickup must have a saved, confirmed location.');
 const depot=point(location.point),radius=location.radiusMeters;
 if(typeof radius!=='number'||radius<100||radius>30000)return fail('Restaurant service area is not configured.');
 const points=[depot];
 for(let i=0;i<orders.length;i++){
  const o=orders[i];if(o.id!==selection.orderIds[i]||o.restaurantId!==selection.restaurantId||o.status!=='ready_for_pickup'||o.activeRouteId||o.assignedRiderUid)return fail('Order is stale, assigned, or belongs to another restaurant.');
  if(!object(o.deliveryLocation)||o.deliveryLocation.confirmation!=='customer-confirmed'||o.deliveryLocation.locationVersion!==location.version)return fail('Delivery pin is missing or the restaurant location changed.');
  const dropoff=point(o.deliveryLocation.dropoff);
  if(distanceMeters(depot,dropoff)>radius)return fail('A delivery is outside the configured restaurant service area.');
  points.push(dropoff);
 }
 for(let i=0;i<riders.length;i++){
  const r=riders[i];if(r.uid!==selection.riderUids[i]||r.status!=='active'||r.available!==true||r.activeRouteId)return fail('A rider is already busy or unavailable.');
 }
 return {points,locationVersion:Number(location.version)};
}
/** Canonical fingerprint captures dispatch-relevant data (including updatedAt, pin and radius). */
export function snapshotDigest(selection:Selection,orders:OrderSnapshot[],riders:RiderSnapshot[],location:LocationSnapshot):string{
 const fields={selection,location,orders:orders.map(o=>({id:o.id,restaurantId:o.restaurantId,status:o.status,assignedRiderUid:o.assignedRiderUid??null,activeRouteId:o.activeRouteId??null,deliveryLocation:o.deliveryLocation,updatedAt:stamp(o.updatedAt)})),riders:riders.map(r=>({uid:r.uid,status:r.status,available:r.available,activeRouteId:r.activeRouteId??null}))};
 return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
}
function stamp(value:unknown):unknown{
 if(object(value)&&typeof value.seconds==='number'&&typeof value.nanoseconds==='number')return {seconds:value.seconds,nanoseconds:value.nanoseconds};
 return value??null;
}
export function buildDispatchRoutes(selection:Selection,points:Point[]):{routes:DispatchRoute[];seconds:number;meters:number}{
 const result=multiRiderRoad(syntheticRoadMatrix(points),selection.riderUids.length,selection.capacity);
 const seen=new Set<number>();
 const routes=result.routes.map((r,i)=>{
  const indices=r.indices.slice(1,-1);if(indices.length<1||indices.length>selection.capacity)throw new Error('Invalid calculated rider capacity.');
  for(const ix of indices){if(!Number.isInteger(ix)||ix<1||ix>selection.orderIds.length||seen.has(ix))throw new Error('Invalid calculated route.');seen.add(ix)}
  return {riderUid:selection.riderUids[i],orderIds:indices.map(ix=>selection.orderIds[ix-1]),seconds:r.seconds,meters:r.meters};
 });
 if(seen.size!==selection.orderIds.length)throw new Error('Optimizer did not cover every order exactly once.');
 return {routes,seconds:result.totalSeconds,meters:result.totalMeters};
}
