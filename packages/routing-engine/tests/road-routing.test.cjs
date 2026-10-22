const assert=require('node:assert/strict');
const {compareRoadPlans,greedyRoad,heldKarpRoad,twoOptRoad,multiRiderRoad,validateMatrix}=require('../dist/road-routing');
const D=[[0,4,9,7,8],[6,0,2,11,8],[4,6,0,3,9],[7,8,3,0,5],[9,8,7,3,0]];
const M={durations:D,distances:D.map(row=>row.map(x=>x*230))};
function verify(plan,riders){assert.equal(plan.routes.length,riders);const all=plan.routes.flatMap(r=>r.indices.slice(1,-1));assert.deepEqual(all.sort(),[1,2,3,4]);for(const route of plan.routes){assert.equal(route.indices[0],0);assert.equal(route.indices.at(-1),0);assert.equal(route.indices.length>=2,true);assert.equal(route.seconds,route.indices.slice(1).reduce((sum,to,i)=>sum+M.durations[route.indices[i]][to],0));}}
const p=compareRoadPlans(M,2,2);for(const k of ['greedy','exact','twoOpt'])verify(p[k],1);verify(p.fleet,2);
assert.ok(p.exact.totalSeconds<=p.greedy.totalSeconds+1e-7);assert.ok(p.twoOpt.totalSeconds<=p.greedy.totalSeconds+1e-7);for(const r of p.fleet.routes)assert.ok(r.indices.length-2<=2);
assert.throws(()=>multiRiderRoad(M,1,2),/capacity/);
assert.throws(()=>validateMatrix({durations:[[0,1],[0,0]],distances:[[0,1],[1,0]]}),/Unreachable/);
// Directionality test: brute force exact optimum for 4 nondepot vertices.
let best=Infinity;function perm(items,acc=[]){if(!items.length){const path=[0,...acc,0];let s=0;for(let i=1;i<path.length;i++)s+=D[path[i-1]][path[i]];best=Math.min(s,best);return;}for(let i=0;i<items.length;i++)perm(items.filter((_,j)=>i!==j),[...acc,items[i]]);}perm([1,2,3,4]);assert.equal(heldKarpRoad(M).totalSeconds,best);
// Empty rider path is legal when supply exceeds number of stops.
const few={durations:[[0,5],[6,0]],distances:[[0,50],[60,0]]};const empty=multiRiderRoad(few,3,1);assert.equal(empty.routes.length,3);assert.equal(empty.routes.flatMap(r=>r.indices.slice(1,-1)).length,1);
console.log('Phase 5B directed routing assertions passed (Greedy, exact DP, 2-opt, capacity, round trips).');
