const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('Hosted API checks project, HTTPS origin and production mode',()=>{
 const s=read('services/functions/src/orders/prod-server.ts');
 for(const part of ['NODE_ENV','FOODROUTE_ALLOWED_ORIGINS',"u.protocol!=='https:'",'verifyIdToken(token,true)',"origin&&!allow",'FOODROUTE_PREVIEW_SIGNING_KEY']) assert.ok(s.includes(part),part);
});
test('Browser hosted API uses ID token and no local API in production',()=>{
 const s=read('apps/web/src/lib/trusted-api.ts');
 assert.match(s,/getIdToken\(\)/);assert.match(s,/Authorization:\s*`Bearer/);assert.match(s,/if\(!import\.meta\.env\.DEV\)/);assert.match(s,/url\.protocol!=='https:'/);
});
test('Hosted API and local API share all production endpoints',()=>{
 const dev=read('services/functions/src/orders/dev-server.ts');const prod=read('services/functions/src/orders/prod-server.ts');
 const entries=[...prod.matchAll(/'\/api\/[a-z\-/]+'/g)].map(m=>m[0]);
 for(const endpoint of new Set(entries))assert.ok(dev.includes(endpoint),endpoint);
 assert.ok(!prod.includes("'/api/roads/geometry'"),'Production must not send private coordinates to demo OSRM');
 assert.ok(!prod.includes("'/api/roads/plan'"),'Demo road service must not be exposed publicly');
});
test('Preview signature uses stable managed secret in production',()=>{
 const s=read('services/functions/src/dispatch/optimized-core.ts');
 assert.match(s,/NODE_ENV!=='production'/);assert.match(s,/FOODROUTE_PREVIEW_SIGNING_KEY/);
 assert.match(s,/Buffer\.from\(raw,'base64'\)\.length!==32/);
});
test('SPA hosting fallback and security headers present',()=>{
 const config=JSON.parse(read('firebase.phase7.example.json'));
 assert.equal(config.hosting.public,'apps/web/dist');
 assert.deepEqual(config.hosting.rewrites,[{source:'**',destination:'/index.html'}]);
 assert.ok(config.hosting.headers.some(h=>h.headers.some(k=>k.key==='X-Content-Type-Options')));
});
test('CI does not publish to Firebase or Google Cloud automatically',()=>{
 const y=read('.github/workflows/foodroute-ci.yml');
 assert.ok(!/firebase deploy|gcloud run deploy/i.test(y));
 assert.match(y,/permissions:/);
});
