// Development fallback on Spark: runs ONLY under trusted Admin SDK credentials, not in the browser.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const projectId=process.env.GOOGLE_CLOUD_PROJECT;const uid=process.argv[2];const confirmation=process.argv[3];
if(!projectId||!uid||confirmation!==`--confirm-project-id=${projectId}`){console.error('Usage: node scripts/approve-local.mjs <APPLICANT_UID> --confirm-project-id=<PROJECT_ID>');process.exit(1)}
initializeApp({credential:applicationDefault(),projectId});
const accountCheck=await getAuth().getUser(uid);if(!accountCheck.emailVerified||accountCheck.disabled)throw new Error('Applicant must have a verified, active email account');
const db=getFirestore(),aRef=db.doc(`restaurantApplications/${uid}`),uRef=db.doc(`users/${uid}`),rId=`rest_${uid}`,rRef=db.doc(`restaurants/${rId}`);
await db.runTransaction(async tx=>{
 const [a,u,r]=await Promise.all([tx.get(aRef),tx.get(uRef),tx.get(rRef)]);
 if(a.data()?.status==='approved'&&r.exists&&u.data()?.role==='restaurant')return;
 if(a.data()?.status!=='pending'||a.data()?.ownerUid!==uid||u.data()?.role!=='customer'||u.data()?.status!=='active'||r.exists)throw new Error('Not a valid pending application');
 const details=a.data();
 tx.create(rRef,{name:details.name,city:details.city,cuisine:details.cuisine,description:details.description,ownerUid:uid,approved:true,status:'active',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
 tx.update(aRef,{status:'approved',reviewedBy:'local-admin',reviewedAt:FieldValue.serverTimestamp()});
 tx.update(uRef,{role:'restaurant',updatedAt:FieldValue.serverTimestamp()});
});
const user=await getAuth().getUser(uid);
await getAuth().setCustomUserClaims(uid,{...(user.customClaims||{}),role:'restaurant'});
console.log(`Restaurant approved: ${rId} in ${projectId}. Owner must sign out/sign in.`);
