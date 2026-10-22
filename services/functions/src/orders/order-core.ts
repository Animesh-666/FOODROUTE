
import { createHash, randomUUID } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  type Transaction
} from 'firebase-admin/firestore';

import { OrderError } from '../shared/errors';
export { OrderError } from '../shared/errors';

// Initialize Firestore lazily.
const db = () => getFirestore();

type Json = Record<string, unknown>;

export type Actor = {
  uid: string;
  role: string;
  emailVerified: boolean;
};

type Line = {
  itemId: string;
  quantity: number;
};
export type OrderInput = { restaurantId: string; lines: Line[]; address: {line1:string;city:string;postalCode:string;note:string}; paymentMethod:'cod' };
const isRecord=(x:unknown):x is Json=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const bad=(message:string):never=>{throw new OrderError('invalid-argument',message)};
const str=(x:unknown,max:number,name:string,min=0):string=>{
 if(typeof x!=='string')return bad(`${name} is required.`);
 const s=x.trim();if(s.length<min||s.length>max)return bad(`Invalid ${name} length.`);return s;
};
export function parseOrderInput(value:unknown):OrderInput {
 if(!isRecord(value)||!isRecord(value.address)||!Array.isArray(value.lines))return bad('Invalid checkout request.');
 const restaurantId=str(value.restaurantId,135,'restaurant ID',6);
 if(!/^rest_[A-Za-z0-9_-]{1,128}$/.test(restaurantId))return bad('Invalid restaurant ID.');
 if(value.lines.length<1||value.lines.length>20)return bad('Choose between 1 and 20 dishes.');
 const unique=new Set<string>();let totalQuantity=0;
 const lines=value.lines.map(x=>{
  if(!isRecord(x))return bad('Invalid item.');
  const itemId=str(x.itemId,128,'item ID',1);
  if(!/^[A-Za-z0-9_-]+$/.test(itemId)||unique.has(itemId))return bad('Duplicate or invalid item ID.');
  unique.add(itemId);const quantity=x.quantity;
  if(typeof quantity!=='number'||!Number.isInteger(quantity)||quantity<1||quantity>10)return bad('Quantity must be 1–10.');
  totalQuantity+=quantity;return {itemId,quantity};
 });
 if(totalQuantity>50)return bad('Too many items in your bag.');
 const line1=str(value.address.line1,180,'street address',8), city=str(value.address.city,80,'city',2);
 const postalCode=str(value.address.postalCode,6,'postal code',6);
 if(!/^\d{6}$/.test(postalCode))return bad('Enter a six-digit Indian postal code.');
 const note=str(value.address.note??'',200,'delivery note');
 if(value.paymentMethod!=='cod')return bad('Only cash on delivery is supported in this phase.');
 return {restaurantId,lines:lines.sort((a,b)=>a.itemId.localeCompare(b.itemId)),address:{line1,city,postalCode,note},paymentMethod:'cod'};
}
async function ensureActor(uid:string, requiredRole:'customer'|'restaurant'):Promise<Actor> {
 if(!uid)throw new OrderError('unauthenticated','Sign in to continue.');
 const [account,profileSnap]=await Promise.all([getAuth().getUser(uid),db().doc(`users/${uid}`).get()]);
 const profile=profileSnap.data();
 if(account.disabled||!profile||profile.role!==requiredRole||profile.status!=='active')throw new OrderError('permission-denied',`An active ${requiredRole} account is required.`);
 if(requiredRole==='customer'&&!account.emailVerified)throw new OrderError('failed-precondition','Verify your email address before ordering.');
 if(requiredRole==='restaurant'&&account.customClaims?.role!=='restaurant')throw new OrderError('permission-denied','Restaurant permissions are not active. Sign out and back in.');
 return {uid,role:requiredRole,emailVerified:account.emailVerified};
}
type ItemSnapshot={itemId:string;name:string;category:string;quantity:number;unitPricePaise:number;lineTotalPaise:number};
async function calculateFromCatalog(input:OrderInput, read:(path:string)=>Promise<Json|undefined>){
 const restaurant=await read(`restaurants/${input.restaurantId}`);
 if(!restaurant||restaurant.approved!==true||restaurant.status!=='active')throw new OrderError('failed-precondition','Restaurant is not currently accepting orders.');
 const items:ItemSnapshot[]=[];let subtotalPaise=0;
 for(const line of input.lines){
  const item=await read(`restaurants/${input.restaurantId}/menuItems/${line.itemId}`);
  if(!item||item.published!==true||item.available!==true)throw new OrderError('failed-precondition','A selected dish is unavailable. Refresh the restaurant menu.');
  const price=item.pricePaise;
  if(typeof price!=='number'||!Number.isSafeInteger(price)||price<100||price>1_000_000||typeof item.name!=='string')throw new OrderError('failed-precondition','Invalid restaurant menu price.');
  const lineTotalPaise=price*line.quantity; subtotalPaise+=lineTotalPaise;
  items.push({itemId:line.itemId,name:item.name,category:String(item.category??''),quantity:line.quantity,unitPricePaise:price,lineTotalPaise});
 }
 if(!Number.isSafeInteger(subtotalPaise)||subtotalPaise>5_000_000)throw new OrderError('failed-precondition','Order is above the development limit.');
 const deliveryFeePaise=0; // DELIBERATELY a prototype: no production shipping/tax engine.
 return {items,subtotalPaise,deliveryFeePaise,totalPaise:subtotalPaise+deliveryFeePaise,currency:'INR' as const,pricingMode:'demo-no-delivery-fee' as const};
}
export async function quote(uid:string,input:unknown){
 await ensureActor(uid,'customer');const clean=parseOrderInput(input);
 const calculated=await calculateFromCatalog(clean,async path=>(await db().doc(path).get()).data());
 return {restaurantId:clean.restaurantId,...calculated};
}
export async function place(uid:string,input:unknown){
 await ensureActor(uid,'customer');
 if(!isRecord(input))return bad('Invalid order submission.');
 const clean=parseOrderInput(input);
 const expectedTotalPaise=input.expectedTotalPaise;
 if(typeof expectedTotalPaise!=='number'||!Number.isSafeInteger(expectedTotalPaise)||expectedTotalPaise<100)return bad('Invalid confirmed quote total.');
 const key=str(input.idempotencyKey,80,'idempotency key',12);
 if(!/^[A-Za-z0-9_-]+$/.test(key))return bad('Invalid order request ID.');
 const id='ord_'+createHash('sha256').update(uid+'|'+key).digest('hex').slice(0,40);
 const fingerprint=createHash('sha256').update(JSON.stringify(clean)).digest('hex');
 const orderRef=db().doc(`orders/${id}`);const eventRef=orderRef.collection('events').doc('created');
 return await db().runTransaction(async (tx:Transaction)=>{
  const previous=await tx.get(orderRef);
  if(previous.exists){
   if(previous.data()?.requestFingerprint!==fingerprint)throw new OrderError('already-exists','This checkout request was already used for a different cart.');
   return {orderId:id,reused:true};
  }
  // Read all documents before writing, inside a Firestore transaction, to avoid stale menus.
  const cost=await calculateFromCatalog(clean,async path=>(await tx.get(db().doc(path))).data());
  if(cost.totalPaise!==expectedTotalPaise)throw new OrderError('failed-precondition','The menu price changed. Please confirm the updated quote before placing your order.');
  tx.create(orderRef,{
   customerUid:uid,restaurantId:clean.restaurantId,address:clean.address,items:cost.items,
   subtotalPaise:cost.subtotalPaise,deliveryFeePaise:cost.deliveryFeePaise,totalPaise:cost.totalPaise,currency:'INR',
   pricingMode:cost.pricingMode,status:'placed',payment:{method:'cod',status:'unpaid'},
   requestFingerprint:fingerprint,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
  });
  tx.create(eventRef,{kind:'order_placed',from:null,to:'placed',actorUid:uid,at:FieldValue.serverTimestamp()});
  return {orderId:id,reused:false};
 });
}
const transitions: Record<string,string[]>={placed:['accepted','rejected'],accepted:['preparing','rejected'],preparing:['ready_for_pickup']};
export async function updateStatus(uid:string,input:unknown){
 await ensureActor(uid,'restaurant');if(!isRecord(input))return bad('Invalid status request.');
 const orderId=str(input.orderId,80,'order ID',10),to=str(input.to,60,'status',3);
 if(!/^ord_[0-9a-f]{40}$/.test(orderId)||!['accepted','rejected','preparing','ready_for_pickup'].includes(to))return bad('Invalid order or status.');
 const ref=db().doc(`orders/${orderId}`);const restaurantId=`rest_${uid}`;
 await db().runTransaction(async tx=>{
  const [snap,rest]=await Promise.all([tx.get(ref),tx.get(db().doc(`restaurants/${restaurantId}`))]);
  if(!rest.exists||rest.data()?.ownerUid!==uid||rest.data()?.status!=='active')throw new OrderError('permission-denied','You cannot update orders for this restaurant.');
  if(!snap.exists)throw new OrderError('not-found','Order not found.');
  const order=snap.data()!;
  if(order.restaurantId!==restaurantId)throw new OrderError('permission-denied','Order belongs to another restaurant.');
  if(order.status===to)return;
  if(!transitions[String(order.status)]?.includes(to))throw new OrderError('failed-precondition',`Cannot change ${String(order.status)} to ${to}.`);
  const eventRef=ref.collection('events').doc(randomUUID());
  tx.update(ref,{status:to,updatedAt:FieldValue.serverTimestamp()});
  tx.create(eventRef,{kind:'restaurant_status',from:order.status,to,actorUid:uid,at:FieldValue.serverTimestamp()});
 });
 return {ok:true,status:to};
}
