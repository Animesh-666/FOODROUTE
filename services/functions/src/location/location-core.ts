import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import { OrderError } from '../orders/order-core';
import {point,radius,record,restaurantId} from './location-domain';
async function actor(uid:string){
 if(!uid)throw new OrderError('unauthenticated','Sign in first.');
 const [auth,snap]=await Promise.all([getAuth().getUser(uid),getFirestore().doc(`users/${uid}`).get()]);const profile=snap.data();
 if(auth.disabled||!profile||profile.status!=='active'||!['customer','restaurant','admin'].includes(profile.role))throw new OrderError('permission-denied','An active account is required.');
 if(profile.role!=='customer'&&auth.customClaims?.role!==profile.role)throw new OrderError('permission-denied','Role permissions are not active.');
 return {role:profile.role as string,emailVerified:auth.emailVerified};
}
export async function readRestaurantLocation(uid:string,input:unknown){
 const user=await actor(uid);const id=restaurantId(record(input)?input.restaurantId:null);const db=getFirestore();
 const restaurant=await db.doc(`restaurants/${id}`).get();
 if(user.role!=='admin'&&(user.role!=='restaurant'||restaurant.data()?.ownerUid!==uid))throw new OrderError('permission-denied','Only the owner or admin can read this configuration.');
 const snap=await db.doc(`restaurantLocations/${id}`).get();const d=snap.data();
 return d?{point:d.point,radiusMeters:d.radiusMeters,version:d.version,confirmation:d.confirmation}:null;
}
export async function saveRestaurantLocation(uid:string,input:unknown){
 const user=await actor(uid);
 if(!record(input)||input.confirmed!==true)throw new OrderError('invalid-argument','Confirm the restaurant entrance location.');
 const id=restaurantId(input.restaurantId),coords=point(input.point),r=radius(input.radiusMeters),expected=input.expectedVersion;
 if(typeof expected!=='number'||!Number.isInteger(expected)||expected<0)throw new OrderError('invalid-argument','Invalid configuration version.');
 const db=getFirestore(),ref=db.doc(`restaurantLocations/${id}`);
 return db.runTransaction(async tx=>{
  const [rest,current]=await Promise.all([tx.get(db.doc(`restaurants/${id}`)),tx.get(ref)]);
  if(!rest.exists||rest.data()?.approved!==true||rest.data()?.status!=='active')throw new OrderError('failed-precondition','Restaurant is not active.');
  if(user.role!=='admin'&&(user.role!=='restaurant'||rest.data()?.ownerUid!==uid))throw new OrderError('permission-denied','Only this restaurant owner or an admin can change this location.');
  if((current.data()?.version??0)!==expected)throw new OrderError('failed-precondition','Location changed in another session. Reload before saving.');
  const version=expected+1;const clean={point:coords,radiusMeters:r,version,confirmation:'operator-confirmed'};
  tx.set(ref,{...clean,updatedBy:uid,updatedAt:FieldValue.serverTimestamp()});
  tx.create(ref.collection('events').doc(String(version)),{kind:'location_updated',actorUid:uid,version,at:FieldValue.serverTimestamp()});
  return clean;
 });
}
// In-memory limits for this single-process local development service; not a distributed quota.
const attempts=new Map<string,{start:number;count:number}>();let inFlight=0;let total=0;
export function consumeSearchBudget(uid:string,now=Date.now()){
 for(const [k,v] of attempts)if(now-v.start>=60000)attempts.delete(k);
 const value=attempts.get(uid)??{start:now,count:0};
 if(value.count>=5||inFlight>=2||total>=200)throw new OrderError('failed-precondition','Address search limit reached. Use manual coordinates or retry later.');
 value.count++;attempts.set(uid,value);total++;
}
export function parseCandidates(raw:unknown){
 if(!record(raw)||!Array.isArray(raw.results))throw new OrderError('failed-precondition','Address provider returned an invalid result.');
 return raw.results.slice(0,5).flatMap(x=>{
  if(!record(x)||typeof x.formatted!=='string'||x.country_code!=='in')return [];
  try{return [{...point({lat:x.lat,lng:x.lon}),label:x.formatted.slice(0,300),precision:typeof x.result_type==='string'?x.result_type.slice(0,40):'unknown'}]}catch{return []}
 });
}
export async function searchAddress(uid:string,input:unknown){
 const user=await actor(uid);if(!user.emailVerified)throw new OrderError('permission-denied','Verify your email first.');
 if(!record(input)||input.externalConsent!==true||typeof input.query!=='string'||input.query.trim().length<8||input.query.length>240)throw new OrderError('invalid-argument','Enter an address and consent to sending it to Geoapify.');
 const key=process.env.GEOAPIFY_API_KEY;
 if(!key)throw new OrderError('failed-precondition','Address search is not configured. Enter and confirm coordinates manually.');
 consumeSearchBudget(uid);inFlight++;
 const url=new URL('https://api.geoapify.com/v1/geocode/search');
 url.search=new URLSearchParams({text:input.query.trim(),format:'json',filter:'countrycode:in',limit:'5',apiKey:key}).toString();
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);
 try{
  const res=await fetch(url,{signal:abort.signal,redirect:'error',headers:{Accept:'application/json'}});
  if(!res.ok)throw new Error('provider-failed');
  const body=await res.text();if(body.length>150000)throw new Error('provider-response-too-large');
  return {results:parseCandidates(JSON.parse(body) as unknown),source:'Geoapify',attribution:'Powered by Geoapify · OpenStreetMap contributors'};
 }catch{throw new OrderError('failed-precondition','Address search is unavailable. Try manual coordinates. No substitute result was returned.');}
 finally{clearTimeout(timer);inFlight--}
}