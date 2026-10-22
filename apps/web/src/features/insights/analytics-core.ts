/** Read-only calculations. All currency figures are COD order value, NOT collected revenue. */
export type TimeLike = {toMillis:()=>number} | null | undefined;
export type OrderMetric = {status:string;totalPaise:number;createdAt?:TimeLike;updatedAt?:TimeLike};
export type RouteMetric = {id:string;status:string;mode?:string;orderId?:string;orderIds?:string[];nextDropoffIndex?:number};
const DAY=86_400_000;
export function safePaise(value:unknown):number {return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0?value:0;}
export function millis(t:TimeLike):number|null {if(!t||typeof t.toMillis!=='function')return null;const n=t.toMillis();return Number.isFinite(n)&&n>0?n:null;}
export function withinDays(t:TimeLike,days:number,now:number):boolean {const ms=millis(t);return ms!==null&&ms<=now&&ms>now-days*DAY;}
export function orderSummary<T extends OrderMetric>(orders:readonly T[],days=30,now=Date.now()){
 const recent=orders.filter(o=>withinDays(o.createdAt,days,now));
 const counts:Record<string,number>={};for(const o of recent)counts[o.status]=(counts[o.status]||0)+1;
 return {loaded:orders.length,recent:recent.length,delivered:recent.filter(o=>o.status==='delivered').length,rejected:recent.filter(o=>o.status==='rejected').length,
  placedCodValuePaise:recent.reduce((n,o)=>n+safePaise(o.totalPaise),0),
  deliveredCodValuePaise:recent.filter(o=>o.status==='delivered').reduce((n,o)=>n+safePaise(o.totalPaise),0),
  counts};
}
/** Date buckets represent order creation, not delivery completion or payment settlement. */
export function creationSeries<T extends OrderMetric>(orders:readonly T[],days=7,now=Date.now()){
 const today=Math.floor(now/DAY);
 return Array.from({length:days},(_,i)=>{
  const index=today-days+1+i;
  const count=orders.filter(o=>{const ms=millis(o.createdAt);return ms!==null&&Math.floor(ms/DAY)===index;}).length;
  return {day:new Date(index*DAY).toLocaleDateString('en-IN',{month:'short',day:'numeric',timeZone:'UTC'}),count};
 });
}
export function riderRouteSummary(routes:readonly RouteMetric[]){
 let deliveries=0,completedRoutes=0,activeRoutes=0,declined=0;
 for(const r of routes){
  const count=r.mode==='optimized-multi-order'?(r.orderIds?.length??(r.orderId?1:0)):r.orderId?1:0;
  if(r.status==='delivered'){deliveries+=count;completedRoutes++;}
  else if(r.status==='rejected'){declined++;}
  else {activeRoutes++;if(r.mode==='optimized-multi-order')deliveries+=Math.min(count,Math.max(0,Math.floor(r.nextDropoffIndex??0)));}
 }
 return {deliveries,completedRoutes,activeRoutes,declined};
}
