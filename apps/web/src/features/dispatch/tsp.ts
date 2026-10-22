/** Academic metric-TSP methods, NOT road navigation or production delivery assignment. */
export type Vertex = {id:string;x:number;y:number};
export type Tour = {path:number[];cost:number;algorithm:string};
export function matrixOf(points:Vertex[]):number[][]{
 if(points.length<2||points.length>22||new Set(points.map(p=>p.id)).size!==points.length||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new Error('Use 2–22 distinct finite vertices.');
 return points.map(a=>points.map(b=>Math.hypot(a.x-b.x,a.y-b.y)));
}
function measure(matrix:number[][],path:number[]):number{return path.slice(1).reduce((total,index,i)=>total+matrix[path[i]][index],0)}
export function greedy(matrix:number[][]):Tour{
 const n=matrix.length;if(n<2)throw new Error('At least two vertices required.');
 const unvisited=new Set(Array.from({length:n-1},(_,i)=>i+1));let current=0;
 const path=[0];while(unvisited.size){const next=[...unvisited].sort((a,b)=>matrix[current][a]-matrix[current][b]||a-b)[0];path.push(next);unvisited.delete(next);current=next;}
 path.push(0);return {algorithm:'Greedy nearest neighbor',path,cost:measure(matrix,path)};
}
export function heldKarp(matrix:number[][]):Tour{
 const n=matrix.length;if(n>13)throw new Error('Held–Karp is limited to 13 vertices for interactive demos.');
 if(n<2)throw new Error('At least two vertices required.');
 const states=new Map<string,{cost:number;prev:number}>();const m=n-1;
 for(let j=1;j<n;j++)states.set(`${1<<(j-1)},${j}`,{cost:matrix[0][j],prev:0});
 for(let mask=1;mask<(1<<m);mask++)for(let j=1;j<n;j++){
  const bit=1<<(j-1);if(!(mask&bit)||mask===bit)continue;
  let best=Infinity,prev=-1;const old=mask^bit;
  for(let k=1;k<n;k++)if(old&(1<<(k-1))){const candidate=(states.get(`${old},${k}`)?.cost??Infinity)+matrix[k][j];if(candidate<best){best=candidate;prev=k;}}
  states.set(`${mask},${j}`,{cost:best,prev});
 }
 const full=(1<<m)-1;let end=-1,cost=Infinity;
 for(let j=1;j<n;j++){const candidate=(states.get(`${full},${j}`)?.cost??Infinity)+matrix[j][0];if(candidate<cost){cost=candidate;end=j;}}
 const reversed:number[]=[];let mask=full;
 while(end>0){reversed.push(end);const entry=states.get(`${mask},${end}`);if(!entry)throw new Error('No tour');mask^=1<<(end-1);end=entry.prev;}
 const path=[0,...reversed.reverse(),0];return {path,algorithm:'Held–Karp exact DP',cost:measure(matrix,path)};
}
export function twoOpt(matrix:number[][],initial=greedy(matrix)):Tour{
 const path=[...initial.path];if(path.length<=4)return {...initial,algorithm:'Greedy + 2-opt'};
 let passes=0;let changed=true;
 while(changed&&passes++<100){changed=false;
  for(let i=1;i<path.length-2;i++)for(let j=i+1;j<path.length-1;j++){
   const gain=matrix[path[i-1]][path[j]]+matrix[path[i]][path[j+1]]-matrix[path[i-1]][path[i]]-matrix[path[j]][path[j+1]];
   if(gain<-1e-9){path.splice(i,j-i+1,...path.slice(i,j+1).reverse());changed=true;}
  }
 }
 return {path,algorithm:'Greedy + 2-opt',cost:measure(matrix,path)};
}
