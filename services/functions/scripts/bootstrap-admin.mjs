import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const projectId=process.env.GOOGLE_CLOUD_PROJECT;
const uid=process.argv[2];const confirmation=process.argv[3];
if(!projectId||!uid||confirmation!==`--confirm-project-id=${projectId}`){
 console.error('Usage (with GOOGLE_CLOUD_PROJECT and Application Default Credentials): node scripts/bootstrap-admin.mjs <AUTH_UID> --confirm-project-id=<PROJECT_ID>');process.exit(1);
}
initializeApp({credential:applicationDefault(),projectId});
const account=await getAuth().getUser(uid);
const userRef=getFirestore().doc(`users/${uid}`);
const snap=await userRef.get();
if(!snap.exists||snap.data()?.status!=='active')throw new Error('An active pre-existing customer profile is required before admin provisioning.');
if(snap.data()?.role!=='customer')throw new Error('Only an active customer profile may be provisioned as admin.');
await getAuth().setCustomUserClaims(uid,{...(account.customClaims||{}),role:'admin'});
await userRef.update({role:'admin',updatedAt:FieldValue.serverTimestamp()});
console.log(`Provisioned admin UID ${uid} in project ${projectId}. Sign out and sign in again to refresh claims.`);
