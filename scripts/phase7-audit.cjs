#!/usr/bin/env node
/** Minimal local release gate. It cannot replace dedicated security scanning. */
const fs=require('node:fs');const path=require('node:path');const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');const errors=[];const warnings=[];
let tracked=new Set();try{tracked=new Set(cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean));}catch{}
const ignore=new Set(['.git','node_modules','lib','dist','.firebase','coverage','test-results','playwright-report','.next']);
const privateFile=/(^\.env(?!\.example$)|\.p12$|\.pfx$|\.pem$|service.?account.*\.json$|oauth.*secret.*\.json$)/i;
const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/"private_key"\s*:\s*"(?:-----|MII)/,/x-api-key\s*[:=]\s*['\"](?:21st_sk_|sk_live_)/i];
let total=0;
function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 if(e.name.startsWith('.env') && e.name!=='.env.example')continue;
 if(ignore.has(e.name))continue;
 const full=path.join(dir,e.name),rel=path.relative(root,full).replaceAll('\\','/');
 if(e.isDirectory()){scan(full);continue;}
 if(privateFile.test(e.name)){if(!tracked.size||tracked.has(rel))errors.push(`Credential-like file in repository: ${rel}`);continue;}
 if(!/\.(?:tsx?|jsx?|c?js|json|yaml|yml|html|md|css|example)$/.test(e.name)||fs.statSync(full).size>1e6)continue;
 total++;const content=fs.readFileSync(full,'utf8');
 // Avoid literal test-pattern self-matches inside this scanner's source.
 if(rel==='scripts/phase7-audit.cjs')continue;
 for(const pattern of secretPatterns)if(pattern.test(content))errors.push(`Potential secret: ${rel} (${String(pattern).slice(0,32)}...)`);
 }}
// Scan all source/config files, including new untracked code, and flag tracked credentials.
scan(root);
for(const rel of tracked)if(privateFile.test(path.basename(rel)))errors.push(`Git-tracked credential-like path: ${rel}`);
const webEnv=path.join(root,'apps/web/.env.production');
if(fs.existsSync(webEnv)){const text=fs.readFileSync(webEnv,'utf8');
 if(/^VITE_ORDER_API_MODE\s*=\s*local\s*$/m.test(text))errors.push('Production frontend cannot use local API mode');
 if(/^VITE_USE_FIREBASE_EMULATORS\s*=\s*true\s*$/m.test(text))errors.push('Production frontend cannot use emulator mode');
}
const cloud=path.join(root,'services/functions/src/orders/prod-server.ts');
if(!fs.existsSync(cloud))errors.push('Missing separate hosted API entrypoint.');
const hosting=path.join(root,'firebase.phase7.example.json');
if(!fs.existsSync(hosting))errors.push('Missing Firebase Hosting example.');
if(!fs.existsSync(path.join(root,'firebase/firestore.rules')))errors.push('Firestore rules missing.');
if(!fs.existsSync(path.join(root,'apps/web/.env.example')))warnings.push('Missing Firebase web environment template.');
console.log(`Phase 7 release audit scanned ${total} source/config files.`);
for(const m of warnings)console.warn(`WARN ${m}`);
for(const m of errors)console.error(`FAIL ${m}`);
if(errors.length)process.exitCode=1;else console.log('PASS High-confidence secret patterns and release prerequisites.');
