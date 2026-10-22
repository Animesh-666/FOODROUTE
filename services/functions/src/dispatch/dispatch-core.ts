/** Phase 5: trusted single-order rider dispatch. No GPS or road-distance claims. */
import { randomUUID } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { OrderError } from '../orders/order-core';

const db=()=>getFirestore();
type Obj=Record<string,unknown>;
const record=(x:unknown): x is Obj => !!x && typeof x==='object' && !Array.isArray(x);
const uidPattern=/^[A-Za-z0-9_-]{4,128}$/;
const orderPattern=/^ord_[0-9a-f]{40}$/;
const routePattern=/^route_[A-Za-z0-9_-]{8,110}$/;
function demand(condition:boolean,message:string):asserts condition {if(!condition)throw new OrderError('invalid-argument',message);}
async function actor(uid:string,role:'admin'|'rider'){
 if(!uid)throw new OrderError('unauthenticated','Sign in first.');
 const [account,profile]=await Promise.all([getAuth().getUser(uid),db().doc(`users/${uid}`).get()]);
 if(account.disabled || account.customClaims?.role!==role || profile.data()?.role!==role || profile.data()?.status!=='active')throw new OrderError('permission-denied',`Active ${role} permissions are required.`);
 return account;
}
function pickIds(input:unknown){
 demand(record(input),'Invalid request.');
 const orderId=input.orderId,riderUid=input.riderUid;
 demand(typeof orderId==='string'&&orderPattern.test(orderId),'Invalid order ID.');
 demand(typeof riderUid==='string'&&uidPattern.test(riderUid),'Invalid rider ID.');
 return {orderId,riderUid};
}
export async function previewDispatch(uid:string,input:unknown){
 await actor(uid,'admin');const {orderId,riderUid}=pickIds(input);
 const [order,rider]=await Promise.all([db().doc(`orders/${orderId}`).get(),db().doc(`deliveryAgents/${riderUid}`).get()]);
 if(!order.exists||!rider.exists)throw new OrderError('not-found','Order or rider not found.');
 const o=order.data()!,r=rider.data()!;
 if(o.status!=='ready_for_pickup'||o.activeRouteId||o.assignedRiderUid)throw new OrderError('failed-precondition','Order is not ready or is already assigned.');
 if(r.status!=='active'||r.available!==true||r.activeRouteId)throw new OrderError('failed-precondition','Rider is not available.');
 return {orderId,riderUid,feasible:true,orderStatus:o.status,riderAvailable:r.available,
  stops:[{kind:'pickup',restaurantId:o.restaurantId},{kind:'dropoff',city:o.address?.city??'Unknown city'}],
  mode:'manual-single-order',note:'Preview only. No geographic ETA or route optimization. Commit rechecks eligibility.'};
}
export async function commitDispatch(uid:string,input:unknown){
 await actor(uid,'admin');const {orderId,riderUid}=pickIds(input);
 const orderRef=db().doc(`orders/${orderId}`),riderRef=db().doc(`deliveryAgents/${riderUid}`);
 const routeId=`route_${randomUUID().replaceAll('-','')}`;
 const routeRef=db().doc(`deliveryRoutes/${routeId}`);
 await db().runTransaction(async tx=>{
  const [order,rider]=await Promise.all([tx.get(orderRef),tx.get(riderRef)]);
  if(!order.exists||!rider.exists)throw new OrderError('not-found','Order or rider not found.');
  const o=order.data()!,r=rider.data()!;
  if(o.status!=='ready_for_pickup'||o.activeRouteId||o.assignedRiderUid)throw new OrderError('failed-precondition','Order was assigned or changed. Preview again.');
  if(r.status!=='active'||r.available!==true||r.activeRouteId)throw new OrderError('failed-precondition','Rider is already busy or unavailable.');
  tx.create(routeRef,{orderId,riderUid,restaurantId:o.restaurantId,customerUid:o.customerUid,
   status:'offered',mode:'manual-single-order',version:1,
   stops:[{sequence:1,kind:'pickup',restaurantId:o.restaurantId},{sequence:2,kind:'dropoff',city:String(o.address?.city??'')}],
   createdBy:uid,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  tx.update(orderRef,{assignedRiderUid:riderUid,activeRouteId:routeId,assignmentStatus:'offered',updatedAt:FieldValue.serverTimestamp()});
  tx.update(riderRef,{activeRouteId:routeId,available:false,updatedAt:FieldValue.serverTimestamp()});
  tx.create(orderRef.collection('events').doc(randomUUID()),{kind:'dispatch_offered',routeId,actorUid:uid,at:FieldValue.serverTimestamp()});
 });
 return {routeId,orderId,riderUid,status:'offered'};
}
export async function setRiderAvailability(uid:string,input:unknown){
 await actor(uid,'rider'); demand(record(input)&&typeof input.available==='boolean','Invalid availability.');
 const ref=db().doc(`deliveryAgents/${uid}`);
 await db().runTransaction(async tx=>{
  const snap=await tx.get(ref);if(!snap.exists||snap.data()?.status!=='active')throw new OrderError('permission-denied','Approved rider account required.');
  if(snap.data()?.activeRouteId)throw new OrderError('failed-precondition','Finish your delivery before changing availability.');
  tx.update(ref,{available:input.available,updatedAt:FieldValue.serverTimestamp()});
 });return {ok:true,available:input.available};
}
export async function riderRouteAction(uid:string,input:unknown){
 await actor(uid,'rider');demand(record(input),'Invalid request.');
 const {routeId,action}=input;
 demand(typeof routeId==='string'&&routePattern.test(routeId),'Invalid route ID.');
 demand(typeof action==='string'&&['accept','reject','pickup','deliver'].includes(action),'Invalid action.');
 const ref=db().doc(`deliveryRoutes/${routeId}`);
 await db().runTransaction(async tx=>{
  const route=await tx.get(ref);
  if(!route.exists)throw new OrderError('not-found','Route not found.');
  const r=route.data()!;
  if(r.riderUid!==uid)throw new OrderError('permission-denied','Not your assignment.');
  if(r.mode==='optimized-multi-order')throw new OrderError('failed-precondition','Use the optimized multi-stop action for this route.');
  const orderRef=db().doc(`orders/${r.orderId}`),riderRef=db().doc(`deliveryAgents/${uid}`);
  const [order,rider]=await Promise.all([tx.get(orderRef),tx.get(riderRef)]);
  if(!order.exists||!rider.exists)throw new OrderError('failed-precondition','Route references missing records.');
  const o=order.data()!,a=rider.data()!;
  if(o.activeRouteId!==routeId||a.activeRouteId!==routeId)throw new OrderError('failed-precondition','This route is no longer active.');
  const current=String(r.status);
  const transitions:Record<string,{from:string;to:string;order?:string}>={
   accept:{from:'offered',to:'accepted'},reject:{from:'offered',to:'rejected'},
   pickup:{from:'accepted',to:'picked_up',order:'picked_up'},deliver:{from:'picked_up',to:'delivered',order:'delivered'}};
  const change=transitions[action];
  if(current===change.to)return; // request retry: already applied
  if(current!==change.from)throw new OrderError('failed-precondition',`Cannot ${action} when route is ${current}.`);
  if(action==='pickup'&&o.status!=='ready_for_pickup')throw new OrderError('failed-precondition','Food is not ready for pickup.');
  if(action==='deliver'&&o.status!=='picked_up')throw new OrderError('failed-precondition','Food has not been collected.');
  tx.update(ref,{status:change.to,updatedAt:FieldValue.serverTimestamp()});
  if(action==='reject'){
   tx.update(orderRef,{assignedRiderUid:FieldValue.delete(),activeRouteId:FieldValue.delete(),assignmentStatus:'unassigned',updatedAt:FieldValue.serverTimestamp()});
   tx.update(riderRef,{activeRouteId:FieldValue.delete(),available:true,updatedAt:FieldValue.serverTimestamp()});
  }else if(action==='deliver'){
   tx.update(orderRef,{status:'delivered',assignmentStatus:'completed',updatedAt:FieldValue.serverTimestamp()});
   tx.update(riderRef,{activeRouteId:FieldValue.delete(),available:true,updatedAt:FieldValue.serverTimestamp()});
  }else if(change.order){tx.update(orderRef,{status:change.order,assignmentStatus:'active',updatedAt:FieldValue.serverTimestamp()});}
  else tx.update(orderRef,{assignmentStatus:'accepted',updatedAt:FieldValue.serverTimestamp()});
  tx.create(orderRef.collection('events').doc(randomUUID()),{kind:'rider_route',routeId,action,actorUid:uid,at:FieldValue.serverTimestamp()});
 });return {ok:true,status:({accept:'accepted',reject:'rejected',pickup:'picked_up',deliver:'delivered'} as Record<string,string>)[action]};
}
