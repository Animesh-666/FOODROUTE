/** Cloud Run production API. Requires HTTPS frontend origin and IAM-managed ADC. */
import { createServer } from 'node:http';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { OrderError, place, quote, updateStatus } from './order-core';
import { previewDispatch, commitDispatch, setRiderAvailability, riderRouteAction } from '../dispatch/dispatch-core';
import { previewOptimizedDispatch, commitOptimizedDispatch, optimizedRiderAction } from '../dispatch/optimized-core';
import { readRestaurantLocation, saveRestaurantLocation } from '../location/location-core';
import { listEligibleOrders, previewLiveOrderRoutes } from '../road/live-orders';
const project=process.env.GOOGLE_CLOUD_PROJECT||process.env.GCLOUD_PROJECT;
const originList=(process.env.FOODROUTE_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(process.env.NODE_ENV!=='production'||!project||originList.length===0||originList.some(x=>{
 try{const u=new URL(x);return u.protocol!=='https:'||u.origin!==x||Boolean(u.username||u.password)}catch{return true}
}))throw new Error('Production API requires NODE_ENV=production, GOOGLE_CLOUD_PROJECT, and HTTPS FOODROUTE_ALLOWED_ORIGINS.');
if(!process.env.FOODROUTE_PREVIEW_SIGNING_KEY)throw new Error('Missing managed preview signing key.');
if(!getApps().length)initializeApp({credential:applicationDefault(),projectId:project});
const host='0.0.0.0',port=Number(process.env.PORT||8080);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT.');
const origins=new Set(originList);
// Best-effort per-user throttle; production API gateway/WAF quotas are still required.
const requests=new Map<string,{windowStart:number,count:number}>();
function checkRateLimit(uid:string){
 const now=Date.now(),windowMs=60000,previous=requests.get(uid);
 const value=!previous||now-previous.windowStart>=windowMs?{windowStart:now,count:1}:{...previous,count:previous.count+1};
 requests.set(uid,value);
 if(value.count>90)throw new OrderError('resource-exhausted','Too many API requests. Try again shortly.');
 if(requests.size>5000)for(const [k,v] of requests)if(now-v.windowStart>=windowMs)requests.delete(k);
}

const server=createServer(async(req,res)=>{
 const origin=req.headers.origin;
 const allow=typeof origin==='string'&&origins.has(origin);
 if(allow){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
 res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
 res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS,GET');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method==='OPTIONS'){res.writeHead(allow?204:403).end();return;}
 if(origin&&!allow){res.writeHead(403).end(JSON.stringify({error:'Origin not permitted.'}));return;}
 if(req.url==='/api/health'&&req.method==='GET'){res.writeHead(200).end(JSON.stringify({ok:true,mode:'cloudrun'}));return;}
 if(req.method!=='POST'||!['/api/quote','/api/orders','/api/orders/status','/api/dispatch/preview','/api/dispatch/commit','/api/rider/availability','/api/rider/action','/api/roads/eligible-orders','/api/roads/live-preview','/api/location/read','/api/location/save','/api/optimized/preview','/api/optimized/commit','/api/optimized/rider-action'].includes(req.url??'')){res.writeHead(404).end(JSON.stringify({error:'Not found.'}));return;}
 try {
  if(!(req.headers['content-type']||'').startsWith('application/json'))throw new OrderError('invalid-argument','JSON content type required.');
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if(!token)throw new OrderError('unauthenticated','Sign in to continue.');
  const decoded=await getAuth().verifyIdToken(token,true);
  checkRateLimit(decoded.uid);
  let json='';for await(const chunk of req){json+=chunk.toString();if(json.length>12000)throw new OrderError('invalid-argument','Request is too large.');}
  let data:unknown;try{data=JSON.parse(json||'{}')}catch{throw new OrderError('invalid-argument','Invalid JSON request.');}
  const handlers:Record<string,(uid:string,data:unknown)=>Promise<unknown>>={
   '/api/quote':quote,'/api/orders':place,'/api/orders/status':updateStatus,
   '/api/dispatch/preview':previewDispatch,'/api/dispatch/commit':commitDispatch,
   '/api/rider/availability':setRiderAvailability,'/api/rider/action':riderRouteAction,
   '/api/roads/eligible-orders':listEligibleOrders,'/api/roads/live-preview':previewLiveOrderRoutes,
   '/api/location/read':readRestaurantLocation,'/api/location/save':saveRestaurantLocation,
   '/api/optimized/preview':previewOptimizedDispatch,'/api/optimized/commit':commitOptimizedDispatch,'/api/optimized/rider-action':optimizedRiderAction
  };
  const result=await handlers[req.url??''](decoded.uid,data);
  res.writeHead(200).end(JSON.stringify(result));
 }catch(e){
  const status=e instanceof OrderError?(e.code==='unauthenticated'?401:e.code==='permission-denied'?403:e.code==='not-found'?404:e.code==='invalid-argument'?400:e.code==='resource-exhausted'?429:409):500;
  // No stack traces or tokens in the response.
  if(!(e instanceof OrderError))console.error('FOODROUTE API error:',e instanceof Error?e.message:'Unknown error');
  res.writeHead(status).end(JSON.stringify({error:e instanceof OrderError?e.message:'FOODROUTE API error.'}));
 }
});
server.requestTimeout=15000;server.headersTimeout=10000;
server.listen(port,host,()=>console.log(`FOODROUTE API listening on port ${port}`));
