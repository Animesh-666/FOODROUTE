import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
if (!getApps().length) initializeApp();
const db=getFirestore();

async function requireAdmin(request:CallableRequest<unknown>){
  const auth=request.auth;
  if (!auth||auth.token.role!=='admin') throw new HttpsError('permission-denied','Only a provisioned administrator can perform this action.');
  const profile=await db.doc(`users/${auth.uid}`).get();
  if (!profile.exists||profile.data()?.role!=='admin'||profile.data()?.status!=='active') throw new HttpsError('permission-denied','Administrator account is not active.');
  return auth.uid;
}
function validUid(data: unknown){
  const uid=(data && typeof data==='object' && 'applicantUid' in data) ? (data as {applicantUid:unknown}).applicantUid : undefined;
  if (typeof uid!=='string'||uid.length<4||uid.length>128||uid.includes('/')) throw new HttpsError('invalid-argument','Invalid applicant user ID.');
  return uid;
}
export const approveRestaurantApplication=onCall({region:'us-central1',maxInstances:3},async request=>{
  const adminUid=await requireAdmin(request);const uid=validUid(request.data);
  const appRef=db.doc(`restaurantApplications/${uid}`),restaurantId=`rest_${uid}`,restaurantRef=db.doc(`restaurants/${restaurantId}`),profileRef=db.doc(`users/${uid}`);
  const applicantAccount=await getAuth().getUser(uid);
  if (!applicantAccount.emailVerified || applicantAccount.disabled) throw new HttpsError('failed-precondition','Applicant must have a verified, active email account.');
  // Create or finish an idempotent approval; all Firestore writes are atomic.
  await db.runTransaction(async tx=>{
    const [application,profile,restaurant]=await Promise.all([tx.get(appRef),tx.get(profileRef),tx.get(restaurantRef)]);
    const a=application.data(),p=profile.data();
    if(!a||!p)throw new HttpsError('not-found','Application or user profile missing.');
    if(a.ownerUid!==uid)throw new HttpsError('failed-precondition','Application owner mismatch.');
    if(a.status==='approved'&&restaurant.exists&&p.role==='restaurant')return;
    if(a.status!=='pending'||p.role!=='customer'||p.status!=='active'||restaurant.exists)throw new HttpsError('failed-precondition','Application is not eligible for approval.');
    tx.create(restaurantRef,{name:a.name,city:a.city,cuisine:a.cuisine,description:a.description,ownerUid:uid,approved:true,status:'active',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    tx.update(appRef,{status:'approved',reviewedBy:adminUid,reviewedAt:FieldValue.serverTimestamp()});
    tx.update(profileRef,{role:'restaurant',updatedAt:FieldValue.serverTimestamp()});
  });
  // A second approval call repairs an interrupted claim update without duplicating the restaurant.
  const account=await getAuth().getUser(uid);
  await getAuth().setCustomUserClaims(uid,{...(account.customClaims||{}),role:'restaurant'});
  return {restaurantId};
});
export const rejectRestaurantApplication=onCall({region:'us-central1',maxInstances:3},async request=>{
  const adminUid=await requireAdmin(request);const uid=validUid(request.data);
  const supplied=request.data && typeof request.data==='object' && 'reason' in request.data ? (request.data as {reason:unknown}).reason : '';
  if(typeof supplied!=='string'||supplied.length>300)throw new HttpsError('invalid-argument','Invalid review reason.');
  const appRef=db.doc(`restaurantApplications/${uid}`);
  await db.runTransaction(async tx=>{
    const snap=await tx.get(appRef);
    if(!snap.exists)throw new HttpsError('not-found','Application not found.');
    if(snap.data()?.status!=='pending')throw new HttpsError('failed-precondition','Only pending applications can be rejected.');
    tx.update(appRef,{status:'rejected',reviewedBy:adminUid,reviewedAt:FieldValue.serverTimestamp(),reviewReason:supplied.trim()||'Not approved at this time'});
  });
  return {ok:true};
});

// Phase 4: server-authoritative quote, checkout and restaurant workflow.
export { calculateOrderQuote, placeCustomerOrder, updateRestaurantOrder } from './orders/callables';
