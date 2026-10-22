/** Trusted developer-only rider approval. Never execute as a website user. */
import { getApps,initializeApp,applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore,FieldValue } from 'firebase-admin/firestore';
const projectId=process.env.GOOGLE_CLOUD_PROJECT,uid=process.argv[2];
if(!projectId||!uid||process.argv[3]!==`--confirm-project-id=${projectId}`){console.error('Usage: node scripts/approve-rider-local.mjs <UID> --confirm-project-id=<PROJECT_ID>');process.exit(1)}
if(!getApps().length)initializeApp({credential:applicationDefault(),projectId});
const account=await getAuth().getUser(uid);
if(!account.emailVerified||account.disabled)throw new Error('Rider must have a verified, enabled Auth account.');
const db=getFirestore(),application=db.doc(`riderApplications/${uid}`),profile=db.doc(`users/${uid}`),rider=db.doc(`deliveryAgents/${uid}`);
await db.runTransaction(async tx=>{
 const [a,p,r]=await Promise.all([tx.get(application),tx.get(profile),tx.get(rider)]);
 if(a.data()?.status==='approved'&&p.data()?.role==='rider'&&r.exists)return;
 if(a.data()?.status!=='pending'||a.data()?.ownerUid!==uid||p.data()?.role!=='customer'||p.data()?.status!=='active'||r.exists)throw new Error('Rider application is not eligible for approval.');
 const info=a.data();
 tx.create(rider,{uid,displayName:info.displayName,city:info.city,vehicleType:info.vehicleType,status:'active',available:false,activeRouteId:null,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 tx.update(application,{status:'approved',reviewedAt:FieldValue.serverTimestamp(),reviewedBy:'local-admin'});
 tx.update(profile,{role:'rider',updatedAt:FieldValue.serverTimestamp()});
});
const latest=await getAuth().getUser(uid);
await getAuth().setCustomUserClaims(uid,{...(latest.customClaims||{}),role:'rider'});
console.log(`Rider approved: ${uid} in ${projectId}. Rider must sign out and back in.`);
