/** Pure validation for read-only live-order route previews. */
export const ORDER_ID_RE = /^ord_[0-9a-f]{40}$/;
export const RESTAURANT_ID_RE = /^rest_[A-Za-z0-9_-]{1,128}$/;
export type LiveSelection = {restaurantId:string;orderIds:string[]};
export type ReadyOrder = {id:string;restaurantId:string;status:string;activeRouteId?:unknown;assignedRiderUid?:unknown};
export function selectReadyOrders(input:unknown, snapshots:ReadyOrder[]):LiveSelection {
  if (!input || typeof input!=='object'||Array.isArray(input)) throw Error('Invalid preview request.');
  const {restaurantId,orderIds} = input as Record<string,unknown>;
  if (typeof restaurantId!=='string'||!RESTAURANT_ID_RE.test(restaurantId)) throw Error('Choose a valid restaurant.');
  if (!Array.isArray(orderIds)||orderIds.length<1||orderIds.length>7||orderIds.some(x=>typeof x!=='string'||!ORDER_ID_RE.test(x)) || new Set(orderIds).size!==orderIds.length)
    throw Error('Select 1–7 distinct ready orders.');
  if(snapshots.length!==orderIds.length) throw Error('One or more orders no longer exist. Refresh the list.');
  for (let i=0;i<snapshots.length;i++) {
    const o=snapshots[i];
    if (o.id!==orderIds[i]||o.restaurantId!==restaurantId||o.status!=='ready_for_pickup'||o.activeRouteId||o.assignedRiderUid)
      throw Error('An order changed, was assigned, or is from a different restaurant. Refresh and preview again.');
  }
  return {restaurantId,orderIds:orderIds as string[]};
}
export function limitReadyOrders<T extends ReadyOrder>(orders:T[]):T[]{
  return orders.filter(o=>o.status==='ready_for_pickup'&&!o.activeRouteId&&!o.assignedRiderUid).slice(0,50);
}
