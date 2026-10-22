import {greedy,heldKarp,twoOpt,type Tour} from '../dispatch/tsp';
/** Synthetic Euclidean TSP microbenchmark, not road-network or rider-routing performance. */
export type BenchRow={name:string;cost:number;meanMs:number;path:number[];gapPct:number};
export function benchmarkTours(matrix:number[][],repeats=12):BenchRow[]{
 if(matrix.length<2||matrix.length>9)throw new Error('Benchmark requires 2–9 simulation vertices.');
 if(!Number.isInteger(repeats)||repeats<1||repeats>50)throw new Error('Invalid repetition count.');
 const algorithms:[string,()=>Tour][]=[
  ['Greedy',()=>greedy(matrix)],
  ['Greedy + 2-opt',()=>twoOpt(matrix,greedy(matrix))],
  ['Held–Karp exact',()=>heldKarp(matrix)]
 ];
 const rows=algorithms.map(([name,run])=>{
  const start=performance.now();let result=run();
  for(let i=1;i<repeats;i++)result=run();
  const elapsed=performance.now()-start;
  return {name,cost:result.cost,meanMs:elapsed/repeats,path:result.path,gapPct:0};
 });
 const optimal=rows[2].cost;
 return rows.map(row=>({...row,gapPct:optimal>0?100*(row.cost-optimal)/optimal:0}));
}
