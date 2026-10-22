import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { cloudFunctions, firestore, firebaseAuth } from '../../lib/firebase';
import {apiMode,callTrustedApi} from '../../lib/trusted-api';
import type { Order, OrderRequest, Quote, Status } from './order.types';
async function invoke<T>(endpoint:string,functionName:string,body:unknown):Promise<T>{
 if(!firebaseAuth?.currentUser)throw new Error('Please sign in before ordering.');
 if(apiMode()!=='functions')return callTrustedApi<T>(endpoint,body);
 if(!cloudFunctions)throw new Error('Firebase Functions are not configured.');
 return (await httpsCallable(cloudFunctions,functionName)(body)).data as T;
}
export function calculateQuote(input:OrderRequest){return invoke<Quote>('quote','calculateOrderQuote',input)}
export function placeOrder(input:OrderRequest,idempotencyKey:string,expectedTotalPaise:number,quoteId:string){return invoke<{orderId:string;reused:boolean}>('orders','placeCustomerOrder',{...input,idempotencyKey,expectedTotalPaise,quoteId})}
export function changeRestaurantOrder(orderId:string,to:Status){return invoke<{ok:boolean;status:Status}>('orders/status','updateRestaurantOrder',{orderId,to})}
function db(){if(!firestore)throw new Error('Firestore is not configured.');return firestore}
export function subscribeCustomerOrders(uid:string,success:(orders:Order[])=>void,error:(e:Error)=>void):Unsubscribe{
 return onSnapshot(query(collection(db(),'orders'),where('customerUid','==',uid)),snap=>success(snap.docs.map(d=>({id:d.id,...d.data()} as Order)).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0))),error);
}
export function subscribeRestaurantOrders(restaurantId:string,success:(orders:Order[])=>void,error:(e:Error)=>void):Unsubscribe{
 return onSnapshot(query(collection(db(),'orders'),where('restaurantId','==',restaurantId)),snap=>success(snap.docs.map(d=>({id:d.id,...d.data()} as Order)).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0))),error);
}
