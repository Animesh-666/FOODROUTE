/** Phase 5B: Directed (possibly asymmetric) travel matrices, depot-index 0.
 * Pure functions; no network, customer data, or Firestore access.
 */
export type RoadMatrix = { durations: number[][]; distances: number[][] };
export type RoadRoute = { indices: number[]; seconds: number; meters: number };
export type RoadPlan = { method: string; routes: RoadRoute[]; totalSeconds: number; totalMeters: number };

export function validateMatrix(matrix: RoadMatrix): number {
 const n = matrix.durations?.length;
 if(!Number.isInteger(n)||n<2||n>10||matrix.distances?.length!==n)throw new Error('Matrix must contain 2 to 10 stops.');
 for(const grid of [matrix.durations,matrix.distances])for(let i=0;i<n;i++){
  if(!Array.isArray(grid[i])||grid[i].length!==n)throw new Error('Matrix must be square.');
  for(let j=0;j<n;j++)if(!Number.isFinite(grid[i][j])||grid[i][j]<0||(i!==j&&grid[i][j]===0))throw new Error('Unreachable or invalid road segment.');
 }
 return n;
}
function roadRoute(indices:number[], matrix:RoadMatrix):RoadRoute{
 let seconds=0, meters=0;
 for(let i=1;i<indices.length;i++){
  seconds+=matrix.durations[indices[i-1]][indices[i]];
  meters+=matrix.distances[indices[i-1]][indices[i]];
 }
 return {indices,seconds,meters};
}
function result(method:string, paths:number[][], matrix:RoadMatrix):RoadPlan{
 const routes=paths.map(p=>roadRoute(p,matrix));
 return {method,routes,totalSeconds:routes.reduce((s,r)=>s+r.seconds,0),totalMeters:routes.reduce((s,r)=>s+r.meters,0)};
}
export function greedyRoad(matrix:RoadMatrix):RoadPlan{
 const n=validateMatrix(matrix), unseen=new Set(Array.from({length:n-1},(_,i)=>i+1));const path=[0];
 while(unseen.size){const last=path[path.length-1];const next=[...unseen].sort((a,b)=>matrix.durations[last][a]-matrix.durations[last][b]||a-b)[0];path.push(next);unseen.delete(next)}
 return result('Greedy nearest neighbor',[[...path,0]],matrix);
}
/** Exact directed Held-Karp TSP, max 10 total nodes for interactive demonstrations. */
export function heldKarpRoad(matrix:RoadMatrix):RoadPlan{
 const n=validateMatrix(matrix),m=n-1;
 const dp=new Map<string,{seconds:number,previous:number}>();
 for(let j=1;j<n;j++)dp.set(`${1<<(j-1)}:${j}`,{seconds:matrix.durations[0][j],previous:0});
 for(let mask=1;mask<(1<<m);mask++)for(let j=1;j<n;j++){
  const bit=1<<(j-1);if(!(mask&bit)||mask===bit)continue;
  const earlier=mask^bit;let minimum=Infinity, previous=-1;
  for(let k=1;k<n;k++)if(earlier&(1<<(k-1))){const d=dp.get(`${earlier}:${k}`);const candidate=(d?.seconds??Infinity)+matrix.durations[k][j];if(candidate<minimum){minimum=candidate;previous=k}}
  dp.set(`${mask}:${j}`,{seconds:minimum,previous});
 }
 const full=(1<<m)-1;let last=-1,best=Infinity;
 for(let j=1;j<n;j++){const d=dp.get(`${full}:${j}`);const s=(d?.seconds??Infinity)+matrix.durations[j][0];if(s<best){best=s;last=j}}
 if(last===-1)throw new Error('No complete route.');
 const reversed:number[]=[];let mask=full;
 while(last>0){reversed.push(last);const entry=dp.get(`${mask}:${last}`);if(!entry)throw new Error('Incomplete route reconstruction.');mask^=1<<(last-1);last=entry.previous}
 return result('Held–Karp exact DP',[[0,...reversed.reverse(),0]],matrix);
}
/** Correct for directed graphs: measures the entire candidate path instead of the symmetric-only delta. */
export function twoOptRoad(matrix:RoadMatrix, initial?:RoadPlan):RoadPlan{
 validateMatrix(matrix);const start=initial??greedyRoad(matrix);
 const optimized=start.routes.map(route=>{
  let path=[...route.indices],cost=roadRoute(path,matrix).seconds;
  for(let pass=0;pass<35;pass++){
   let changed=false;
   for(let i=1;i<path.length-2;i++)for(let j=i+1;j<path.length-1;j++){
    const candidate=[...path.slice(0,i),...path.slice(i,j+1).reverse(),...path.slice(j+1)];
    const next=roadRoute(candidate,matrix).seconds;
    if(next+1e-7<cost){path=candidate;cost=next;changed=true}
   }
   if(!changed)break;
  }
  return path;
 });
 return result('Greedy + directed 2-opt',optimized,matrix);
}
/** Single-depot, independent-dropoff, stop-count-capacity demonstration.
 * Rider count means simultaneous round trips, no pickup precedence or vehicle weights.
 */
export function multiRiderRoad(matrix:RoadMatrix,riderCount:number,capacity:number):RoadPlan{
 const n=validateMatrix(matrix);
 if(!Number.isInteger(riderCount)||riderCount<1||riderCount>3)throw new Error('Choose 1–3 riders.');
 if(!Number.isInteger(capacity)||capacity<1||capacity>9||riderCount*capacity<n-1)throw new Error('Not enough rider capacity for all stops.');
 const paths:number[][]=Array.from({length:riderCount},()=>[0,0]);
 const pending=new Set(Array.from({length:n-1},(_,i)=>i+1));
 // Seed a stop for every rider when possible, so the fleet scenario models active riders.
 for(let r=0;r<Math.min(riderCount,n-1);r++){
  const next=[...pending].sort((a,b)=>matrix.durations[0][a]-matrix.durations[0][b]||a-b)[0];
  paths[r].splice(1,0,next);pending.delete(next);
 }
 while(pending.size){
  let winner:{rider:number;stop:number;pos:number;delta:number}|null=null;
  for(const stop of pending)for(let r=0;r<paths.length;r++){
   const path=paths[r];if(path.length-2>=capacity)continue;
   for(let pos=1;pos<path.length;pos++){
    const before=path[pos-1],after=path[pos];
    const delta=matrix.durations[before][stop]+matrix.durations[stop][after]-matrix.durations[before][after];
    if(!winner||delta<winner.delta-1e-8||(Math.abs(delta-winner.delta)<1e-8&&(r<winner.rider||r===winner.rider&&stop<winner.stop)))winner={rider:r,stop,pos,delta};
   }
  }
  if(!winner)throw new Error('No feasible insertion under capacity constraints.');
  const choice=winner as {rider:number;stop:number;pos:number};paths[choice.rider].splice(choice.pos,0,choice.stop);pending.delete(choice.stop);
 }
 const optimized=twoOptRoad(matrix,result('Initial multi-rider',paths,matrix));
 return {...optimized,method:'Capacity-limited cheapest insertion + 2-opt'};
}
export function compareRoadPlans(matrix:RoadMatrix,riders:number,capacity:number){
 return {greedy:greedyRoad(matrix),exact:heldKarpRoad(matrix),twoOpt:twoOptRoad(matrix),fleet:multiRiderRoad(matrix,riders,capacity)};
}
