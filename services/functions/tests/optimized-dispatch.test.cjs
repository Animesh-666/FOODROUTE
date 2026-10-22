const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSelection,validateDispatchSnapshot,snapshotDigest,buildDispatchRoutes}=require('../lib/dispatch/optimized-domain.js');
const place={point:{lat:24.1032,lng:88.2517},version:2,confirmation:'operator-confirmed',radiusMeters:15000};
const ids=Array.from({length:3},(_,i)=>'ord_'+String(i+1).padStart(40,'a'));
const riderIds=['rider_one','rider_two'];
const selection={restaurantId:'rest_merchant',orderIds:ids,riderUids:riderIds,capacity:2};
const orders=ids.map((id,i)=>({id,restaurantId:selection.restaurantId,status:'ready_for_pickup',deliveryLocation:{confirmation:'customer-confirmed',locationVersion:2,dropoff:{lat:24.108+i*.008,lng:88.26+i*.006}},updatedAt:{seconds:900+i,nanoseconds:0}}));
const riders=riderIds.map(uid=>({uid,status:'active',available:true}));
const copy=x=>structuredClone(x);
test('accepts bounded, unique selection and rejects duplicate or insufficient capacity',()=>{
 assert.deepEqual(parseSelection(selection),selection);
 assert.throws(()=>parseSelection({...selection,orderIds:[ids[0],ids[0]]}),/distinct orders/);
 assert.throws(()=>parseSelection({...selection,capacity:1}),/enough capacity/);
 assert.throws(()=>parseSelection({...selection,riderUids:[riderIds[0],riderIds[0]]}),/distinct rider/);
 assert.throws(()=>parseSelection({...selection,orderIds:[]}),/1–6/);
});
test('validates confirmed pins, one restaurant, capacity and online riders',()=>{
 const {points,locationVersion}=validateDispatchSnapshot(selection,orders,riders,place);
 assert.equal(points.length,4);assert.equal(locationVersion,2);
 const busy=copy(riders);busy[0].activeRouteId='route_busy';assert.throws(()=>validateDispatchSnapshot(selection,orders,busy,place),/busy/);
 const assigned=copy(orders);assigned[1].assignedRiderUid='someone';assert.throws(()=>validateDispatchSnapshot(selection,assigned,riders,place),/assigned/);
 const other=copy(orders);other[0].restaurantId='rest_other';assert.throws(()=>validateDispatchSnapshot(selection,other,riders,place),/another restaurant/);
 const noConsent=copy(orders);noConsent[1].deliveryLocation.confirmation='unknown';assert.throws(()=>validateDispatchSnapshot(selection,noConsent,riders,place),/pin/);
 const newLocation={...place,version:3};assert.throws(()=>validateDispatchSnapshot(selection,orders,riders,newLocation),/location changed/);
 const outside=copy(orders);outside[1].deliveryLocation.dropoff.lat=28;assert.throws(()=>validateDispatchSnapshot(selection,outside,riders,place),/outside/);
});
test('routes cover all orders exactly once, begin with kitchen pickup, respect capacity',()=>{
 const {points}=validateDispatchSnapshot(selection,orders,riders,place);const plan=buildDispatchRoutes(selection,points);
 assert.equal(plan.routes.length,2);
 assert.deepEqual(plan.routes.map(r=>r.riderUid),riderIds);
 assert.deepEqual(plan.routes.flatMap(r=>r.orderIds).sort(),[...ids].sort());
 assert.ok(plan.routes.every(r=>r.orderIds.length>=1&&r.orderIds.length<=2&&r.seconds>0&&r.meters>0));
 assert.ok(plan.seconds>0&&plan.meters>0);
});
test('snapshot digest changes when order freshness, rider availability or location changes',()=>{
 const before=snapshotDigest(selection,orders,riders,place);
 const stale=copy(orders);stale[0].updatedAt.nanoseconds=4;
 assert.notEqual(before,snapshotDigest(selection,stale,riders,place));
 const offline=copy(riders);offline[0].available=false;
 assert.notEqual(before,snapshotDigest(selection,orders,offline,place));
 assert.notEqual(before,snapshotDigest(selection,orders,riders,{...place,version:3}));
});
test('adjacent confirmed pins still generate a valid positive-cost route',()=>{
 const same=copy(orders);same[1].deliveryLocation.dropoff=same[0].deliveryLocation.dropoff;
 const {points}=validateDispatchSnapshot(selection,same,riders,place);
 assert.ok(buildDispatchRoutes(selection,points).routes.length===2);
});
