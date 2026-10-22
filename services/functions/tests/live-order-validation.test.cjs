const test=require('node:test');
const assert=require('node:assert/strict');
const {selectReadyOrders,limitReadyOrders}=require('../lib/road/live-order-validation.js');
const restaurantId='rest_test_kitchen';
const one='ord_'+'a'.repeat(40),two='ord_'+'b'.repeat(40);
const ready=id=>({id,restaurantId,status:'ready_for_pickup'});
test('accepts a valid batch of ready, unassigned orders',()=>{
 assert.deepEqual(selectReadyOrders({restaurantId,orderIds:[one,two]},[ready(one),ready(two)]),{restaurantId,orderIds:[one,two]});
});
test('rejects duplicate IDs',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one,one]},[ready(one),ready(one)])));
test('rejects missing order',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one]},[])));
test('rejects orders not ready',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one]},[{...ready(one),status:'placed'}])));
test('rejects orders from other restaurants',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one]},[{...ready(one),restaurantId:'rest_other'}])));
test('rejects orders already reserved',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one]},[{...ready(one),assignedRiderUid:'rider'}])));
test('rejects orders already routed',()=>assert.throws(()=>selectReadyOrders({restaurantId,orderIds:[one]},[{...ready(one),activeRouteId:'route_existing'}])));
test('filters assigned and non-ready from discovery',()=>assert.deepEqual(limitReadyOrders([ready(one),{...ready(two),status:'delivered'}]),[ready(one)]));
