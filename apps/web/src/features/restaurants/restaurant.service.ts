import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
  type Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { cloudFunctions, firestore } from '../../lib/firebase';
import { validateApplication, validateMenuDraft } from './restaurant.validation';
import type { MenuItem, MenuItemDraft, Restaurant, RestaurantApplication, RestaurantApplicationDraft } from './restaurant.types';

function db() { if (!firestore) throw new Error('Firebase configuration is missing.'); return firestore; }
const restaurants = () => collection(db(), 'restaurants');
export function subscribeApprovedRestaurants(onData: (list: Restaurant[]) => void, onError: (error: Error) => void): Unsubscribe {
  const q = query(restaurants(), where('approved','==',true),where('status','==','active'));
  return onSnapshot(q, snap => onData(snap.docs.map(d => ({...d.data(), id:d.id} as Restaurant))), onError);
}
export function subscribeRestaurant(restaurantId: string, onData: (value: Restaurant | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db(),'restaurants',restaurantId), snap => onData(snap.exists() ? {...snap.data(),id:snap.id} as Restaurant : null), onError);
}
export function subscribeMenu(restaurantId: string, publicOnly: boolean, onData: (list: MenuItem[]) => void, onError: (error: Error) => void): Unsubscribe {
  const ref = collection(db(),'restaurants',restaurantId,'menuItems');
  const q = publicOnly ? query(ref,where('published','==',true)) : query(ref);
  return onSnapshot(q,snap => onData(snap.docs.map(d=>({...d.data(),id:d.id} as MenuItem))),onError);
}
export function subscribeApplication(uid: string, onData: (value: RestaurantApplication | null) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db(),'restaurantApplications',uid),snap=>onData(snap.exists()?snap.data() as RestaurantApplication:null),onError);
}
export function subscribePendingApplications(onData: (list: RestaurantApplication[]) => void,onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(query(collection(db(),'restaurantApplications'),where('status','==','pending')), snap=>onData(snap.docs.map(d=>d.data() as RestaurantApplication)),onError);
}
export async function requestRestaurant(uid: string, contactEmail: string, draft: RestaurantApplicationDraft) {
  const clean = validateApplication(draft);
  // One application per UID; rules explicitly disallow client updates. A rejected application
  // requires review instead of allowing an attacker to change the approval result.
  const ref=doc(db(),'restaurantApplications',uid);
  if ((await getDoc(ref)).exists()) throw new Error('An application already exists for this account.');
  await setDoc(ref,{...clean,ownerUid:uid,contactEmail,status:'pending',submittedAt:serverTimestamp()});
}
export async function saveMenuItem(restaurantId:string,draft:MenuItemDraft,itemId?:string) {
  const clean=validateMenuDraft(draft);
  const ref=collection(db(),'restaurants',restaurantId,'menuItems');
  if (itemId) await updateDoc(doc(ref,itemId),{...clean,updatedAt:serverTimestamp()});
  else await addDoc(ref,{...clean,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function unpublishMenuItem(restaurantId:string,itemId:string) {
  await updateDoc(doc(db(),'restaurants',restaurantId,'menuItems',itemId),{published:false,available:false,updatedAt:serverTimestamp()});
}
export async function approveApplication(applicantUid:string) {
  if (!cloudFunctions) throw new Error('Firebase is not configured.');
  const call=httpsCallable<{applicantUid:string},{restaurantId:string}>(cloudFunctions,'approveRestaurantApplication');
  return (await call({applicantUid})).data;
}
export async function rejectApplication(applicantUid:string, reason:string) {
  if (!cloudFunctions) throw new Error('Firebase is not configured.');
  const call=httpsCallable<{applicantUid:string;reason:string},{ok:boolean}>(cloudFunctions,'rejectRestaurantApplication');
  return (await call({applicantUid,reason})).data;
}
