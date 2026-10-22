/** Development-only manual-coordinate road route planning. Never reads or modifies orders. */
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { OrderError } from '../orders/order-core';
import { compareRoadPlans, type RoadMatrix } from '../dispatch/road-routing';

type Waypoint={id:string;label:string;lat:number;lng:number};
const LIMIT=8;
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function invalid(m:string):never {throw new OrderError('invalid-argument',m)}
function haversine(a:Waypoint,b:Waypoint){const p=Math.PI/180,dl=(b.lng-a.lng)*p,dphi=(b.lat-a.lat)*p;const h=Math.sin(dphi/2)**2+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(dl/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))}
export function validateWaypoints(input:unknown):Waypoint[]{
 if(!Array.isArray(input)||input.length<2||input.length>LIMIT)return invalid(`Use 2–${LIMIT} sample stops including one depot.`);
 const seen=new Set<string>();
 const nodes=input.map((x)=>{
  if(!record(x)||typeof x.id!=='string'||!new RegExp('^[a-zA-Z0-9_-]{1,24}$').test(x.id)||seen.has(x.id))return invalid('Each stop must have a unique short ID.');
  if(typeof x.label!=='string'||x.label.trim().length<2||x.label.length>38)return invalid('Stop labels must be 2–38 characters.');
  if(typeof x.lat!=='number'||typeof x.lng!=='number'||!Number.isFinite(x.lat)||!Number.isFinite(x.lng)||Math.abs(x.lat)>85||Math.abs(x.lng)>180)return invalid('Invalid geographic coordinates.');
  seen.add(x.id);
  return {id:x.id,label:x.label.trim(),lat:x.lat,lng:x.lng} as Waypoint;
 });
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const meters=haversine(nodes[i],nodes[j]);if(meters<30)return invalid('Sample points must be at least 30 m apart.');if(meters>30000)return invalid('This demo limits each point pair to 30 km.');}
 return nodes;
}
export function syntheticMatrix(points:Waypoint[]):RoadMatrix{
 const distances=points.map(a=>points.map(b=>a.id===b.id?0:Math.round(haversine(a,b)*1.3)));
 const durations=distances.map(row=>row.map(m=>m===0?0:Math.round(m/7.8)));
 return {distances,durations};
}
// Respect shared public demo service: sequential calls and a small manual-only request limit.
let lastCall=0;
let queue=Promise.resolve();
async function fetchOsrm(path:string):Promise<unknown>{
 const job=queue.then(async()=>{
  const now=Date.now();const wait=Math.max(0,lastCall+1500-now);if(wait)await new Promise<void>(resolve=>setTimeout(resolve,wait));
  lastCall=Date.now();
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const response=await fetch(`https://router.project-osrm.org${path}`,{signal:controller.signal,headers:{'Accept':'application/json','User-Agent':'FOODROUTE-local-routing-demo/0.6 (+https://github.com/Animesh-666/FOODROUTE)'}});
   if(!response.ok)throw new Error(`OSRM response ${response.status}`);
   return await response.json() as unknown;
  } finally {clearTimeout(timeout)}
 });
 queue=job.then(()=>undefined,()=>undefined);
 return job;
}
const coords=(points:Waypoint[])=>points.map(p=>`${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
async function fetchMatrix(points:Waypoint[]):Promise<RoadMatrix>{
 let raw:unknown;
 try{raw=await fetchOsrm(`/table/v1/driving/${coords(points)}?annotations=duration,distance`)}
 catch{throw new OrderError('failed-precondition','The public OSRM demo is unavailable. Try later, or choose simulation. No fallback was substituted.');}
 if(!record(raw)||raw.code!=='Ok'||!Array.isArray(raw.durations)||!Array.isArray(raw.distances))throw new OrderError('failed-precondition','OSRM could not route one or more of these locations.');
 const matrix={durations:raw.durations as number[][],distances:raw.distances as number[][]};
 if(matrix.durations.length!==points.length||matrix.distances.length!==points.length)throw new OrderError('failed-precondition','Incomplete road matrix received.');
 for(const grid of [matrix.durations,matrix.distances])for(let i=0;i<points.length;i++)for(let j=0;j<points.length;j++){
  const v=grid[i]?.[j];if(typeof v!=='number'||!Number.isFinite(v)||(i!==j&&v<=0))throw new OrderError('failed-precondition','Roads between selected points are unreachable.');
 }
 return matrix;
}
async function admin(uid:string){
 const [auth,profile]=await Promise.all([getAuth().getUser(uid),getFirestore().doc(`users/${uid}`).get()]);
 if(auth.disabled||auth.customClaims?.role!=='admin'||profile.data()?.role!=='admin'||profile.data()?.status!=='active')throw new OrderError('permission-denied','Active administrator required for manual route planning.');
}
export async function createRoadPlan(uid:string,input:unknown){
 await admin(uid);
 if(!record(input))return invalid('Invalid route request.');
 const points=validateWaypoints(input.points);
 const riders=input.riders,capacity=input.capacity;
 if(typeof riders!=='number'||!Number.isInteger(riders)||riders<1||riders>3)return invalid('Select 1–3 riders.');
 if(typeof capacity!=='number'||!Number.isInteger(capacity)||capacity<1||capacity>7||riders*capacity<points.length-1)return invalid('Increase capacity or rider count to cover all stops.');
 if(input.mode!=='simulation'&&input.mode!=='road')return invalid('Choose a route data source.');
 if(input.mode==='road'&&input.externalConsent!==true)return invalid('Explicit road-service location consent is required.');
 const matrix=input.mode==='road'?await fetchMatrix(points):syntheticMatrix(points);
 const plans=compareRoadPlans(matrix,riders,capacity);
 return {mode:input.mode,points,plans,objective:'total travel seconds',source:input.mode==='road'?'OSRM public demo driving network, road duration matrix':'Synthetic haversine × 1.3, assumed 28 km/h',
  caveat:'Single shared depot, round trips, independent stops, no time windows or pickup precedence. No Firestore dispatch writes.',createdAt:new Date().toISOString()};
}
export async function fetchRoadGeometry(uid:string,input:unknown){
 await admin(uid);
 if(!record(input)||input.externalConsent!==true)return invalid('Consent is required before requesting road geometry.');
 const points=validateWaypoints(input.points),indices=input.indices;
 if(!Array.isArray(indices)||indices.length<3||indices.length>points.length+1||indices[0]!==0||indices[indices.length-1]!==0||indices.some(i=>!Number.isInteger(i)||i<0||i>=points.length))return invalid('Invalid route sequence.');
 if(new Set(indices.slice(1,-1)).size!==indices.length-2)return invalid('A delivery stop must not be repeated.');
 const tour=indices.map(i=>points[i]);let data:unknown;
 try{data=await fetchOsrm(`/route/v1/driving/${coords(tour)}?overview=simplified&geometries=geojson&steps=false`)}
 catch{throw new OrderError('failed-precondition','Road geometry is unavailable; the planner can show an approximate connector instead.');}
 if(!record(data)||data.code!=='Ok'||!Array.isArray(data.routes)||!data.routes.length)throw new OrderError('failed-precondition','No road geometry found.');
 const first=data.routes[0];if(!record(first)||!record(first.geometry)||!Array.isArray(first.geometry.coordinates))throw new OrderError('failed-precondition','Invalid geometry from routing provider.');
 const pairs=first.geometry.coordinates;
 if(pairs.length>3000||!pairs.every((p:unknown)=>Array.isArray(p)&&p.length===2&&p.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v))))throw new OrderError('failed-precondition','Invalid route geometry.');
 return {coordinates:pairs,source:'OSRM driving demo',distanceMeters:first.distance,durationSeconds:first.duration};
}
