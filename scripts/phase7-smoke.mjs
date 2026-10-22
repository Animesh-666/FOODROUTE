/** Read-only API smoke check. Never sends authentication tokens or writes orders. */
const raw=process.env.FOODROUTE_SMOKE_API_URL;
if(!raw)throw new Error('Set FOODROUTE_SMOKE_API_URL to an HTTPS API origin or local 127.0.0.1 development endpoint.');
const u=new URL(raw);const loopback=['localhost','127.0.0.1'].includes(u.hostname);
if(u.protocol!=='https:'&&!(u.protocol==='http:'&&loopback))throw new Error('Smoke check requires HTTPS except localhost.');
const base=u.origin;
async function req(route,options={}){const c=new AbortController();const timer=setTimeout(()=>c.abort(),8000);try{return await fetch(base+route,{...options,signal:c.signal})}finally{clearTimeout(timer)}}
const health=await req('/api/health');if(health.status!==200)throw new Error(`Health ${health.status}`);
const json=await health.json();if(json.ok!==true)throw new Error('Unhealthy response.');
const unauth=await req('/api/optimized/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
if(unauth.status!==401)throw new Error(`Unauthenticated preview should return 401, got ${unauth.status}.`);
const denied=await req('/api/optimized/preview',{method:'POST',headers:{'Origin':'https://untrusted.example','Content-Type':'application/json'},body:'{}'});
if(denied.status!==403)throw new Error(`Unknown origin should be denied with 403, got ${denied.status}.`);
console.log(`PASS Phase 7 API read-only smoke: health=${json.mode}, anonymous=401, CORS=403`);
