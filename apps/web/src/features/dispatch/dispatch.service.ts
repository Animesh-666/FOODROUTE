import { collection, doc, onSnapshot, query, setDoc, serverTimestamp, where, type Unsubscribe } from 'firebase/firestore';
import {firestore} from '../../lib/firebase';
import {callTrustedApi} from '../../lib/trusted-api';
import type { Order } from '../orders/order.types';
export type RiderApplication={ownerUid:string;displayName:string;city:string;vehicleType:'bicycle'|'scooter'|'motorbike';status:'pending'|'approved'|'rejected'};
export type DeliveryAgent={uid:string;displayName:string;city:string;vehicleType:string;available:boolean;status:string;activeRouteId?:string|null};
export type DeliveryRoute={id:string;orderId:string;orderIds?:string[];nextDropoffIndex?:number;riderUid:string;restaurantId:string;status:'offered'|'accepted'|'rejected'|'picked_up'|'delivered';mode:string;stops:{sequence:number;kind:string;city?:string;orderId?:string}[]};
const db=()=>{if(!firestore)throw new Error('Configure Firebase.');return firestore};
export function watchApplication(uid:string,onData:(v:RiderApplication|null)=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(doc(db(),'riderApplications',uid),s=>onData(s.exists()?s.data() as RiderApplication:null),onError)}
export async function submitRiderApplication(uid:string,displayName:string,city:string,vehicleType:RiderApplication['vehicleType']){
 if(displayName.trim().length<2||displayName.length>80||city.trim().length<2||city.length>80)throw new Error('Enter a valid name and city.');
 await setDoc(doc(db(),'riderApplications',uid),{ownerUid:uid,displayName:displayName.trim(),city:city.trim(),vehicleType,status:'pending',submittedAt:serverTimestamp()});
}
export function watchRider(uid:string,onData:(v:DeliveryAgent|null)=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(doc(db(),'deliveryAgents',uid),s=>onData(s.exists()?s.data() as DeliveryAgent:null),onError)}
export function watchRiderRoutes(uid:string,onData:(v:DeliveryRoute[])=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(query(collection(db(),'deliveryRoutes'),where('riderUid','==',uid)),s=>onData(s.docs.map(d=>({id:d.id,...d.data()} as DeliveryRoute))),onError)}
export function watchReadyOrders(onData:(v:Order[])=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(query(collection(db(),'orders'),where('status','==','ready_for_pickup')),s=>onData(s.docs.map(d=>({id:d.id,...d.data()} as Order))),onError)}
export function watchAgents(onData:(v:DeliveryAgent[])=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(collection(db(),'deliveryAgents'),s=>onData(s.docs.map(d=>({uid:d.id,...d.data()} as DeliveryAgent))),onError)}
export function watchRiderOrder(orderId:string,onData:(v:Order|null)=>void,onError:(e:Error)=>void):Unsubscribe{return onSnapshot(doc(db(),'orders',orderId),s=>onData(s.exists()?{id:s.id,...s.data()} as Order:null),onError)}
export async function dispatchCall<T>(endpoint:string,input:unknown):Promise<T>{
 return callTrustedApi<T>(endpoint,input);
}
