import {describe,expect,it} from 'vitest';
import {creationSeries,millis,orderSummary,riderRouteSummary,safePaise} from './analytics-core';
const time=(n:number)=>({toMillis:()=>n});
const now=Date.UTC(2026,9,22,10);
describe('role-scoped analytics aggregators',()=>{
 it('does not confuse placed COD value with paid revenue',()=>{
  const rows=[{status:'delivered',totalPaise:24900,createdAt:time(now-2*86_400_000)},
   {status:'preparing',totalPaise:50000,createdAt:time(now-86_400_000)},
   {status:'rejected',totalPaise:1000,createdAt:time(now-40*86_400_000)}];
  const v=orderSummary(rows,30,now);expect(v.recent).toBe(2);expect(v.delivered).toBe(1);expect(v.deliveredCodValuePaise).toBe(24900);expect(v.placedCodValuePaise).toBe(74900);
 });
 it('rejects non-finite and invalid amounts and dates',()=>{expect(safePaise(-1)).toBe(0);expect(safePaise(Number.POSITIVE_INFINITY)).toBe(0);expect(millis(undefined)).toBeNull()});
 it('buckets creation days by UTC',()=>{const bars=creationSeries([{status:'placed',totalPaise:100,createdAt:time(now)}],7,now);expect(bars.at(-1)?.count).toBe(1)});
 it('counts completed drops without counting declined offers',()=>{
  const v=riderRouteSummary([{id:'r1',status:'delivered',mode:'optimized-multi-order',orderIds:['a','b','c']},
   {id:'r2',status:'picked_up',mode:'optimized-multi-order',orderIds:['x','y'],nextDropoffIndex:1},
   {id:'r3',status:'rejected',mode:'manual',orderId:'z'}]);
  expect(v.deliveries).toBe(4);expect(v.completedRoutes).toBe(1);expect(v.declined).toBe(1);expect(v.activeRoutes).toBe(1);
 });
});
