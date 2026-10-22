import {describe,expect,it} from 'vitest';
import {matrixOf} from '../dispatch/tsp';
import {benchmarkTours} from './tsp-benchmark';
describe('DAA demonstration benchmarks',()=>{
 it('exact cost never exceeds greedy or 2-opt on test graph',()=>{
  const m=matrixOf([{id:'Depot',x:0,y:0},{id:'A',x:8,y:0},{id:'B',x:5,y:8},{id:'C',x:1,y:4}]);
  const r=benchmarkTours(m,2);expect(r).toHaveLength(3);expect(r[2].gapPct).toBe(0);expect(r[2].cost).toBeLessThanOrEqual(r[0].cost+1e-7);expect(r[1].cost).toBeLessThanOrEqual(r[0].cost+1e-7);expect(r.every(x=>Number.isFinite(x.meanMs)&&x.meanMs>=0)).toBe(true);
 });
 it('rejects unsupported large input',()=>{expect(()=>benchmarkTours(Array.from({length:10},()=>Array(10).fill(0)))).toThrow()});
});
