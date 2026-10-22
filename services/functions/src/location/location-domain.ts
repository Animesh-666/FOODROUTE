import { OrderError } from '../orders/order-core';export type Point={lat:number;lng:number};
export type ConfirmedPoint=Point&{confirmed:true};
export type LocationConfig={point:Point;radiusMeters:number;version:number;confirmation:'operator-confirmed'};
export const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
export function point(value:unknown):Point{
 if(!record(value)||typeof value.lat!=='number'||typeof value.lng!=='number'||!Number.isFinite(value.lat)||!Number.isFinite(value.lng)||Math.abs(value.lat)>85||Math.abs(value.lng)>180)throw new OrderError('invalid-argument','Enter valid latitude (-85 to 85) and longitude (-180 to 180).');
 return {lat:value.lat,lng:value.lng};
}
export function confirmedPoint(value:unknown):ConfirmedPoint{
 if(!record(value)||value.confirmed!==true)throw new OrderError('invalid-argument','Confirm that the delivery coordinates match your address.');
 return {...point(value),confirmed:true};
}
export function radius(value:unknown){if(typeof value!=='number'||!Number.isInteger(value)||value<100||value>30000)throw new OrderError('invalid-argument','Service radius must be 100–30,000 metres.');return value}
export function restaurantId(value:unknown){if(typeof value!=='string'||!/^rest_[A-Za-z0-9_-]{1,128}$/.test(value))throw new OrderError('invalid-argument','Invalid restaurant ID.');return value}
export function distanceMeters(a:Point,b:Point){const rad=Math.PI/180;const h=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;return 12742000*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))))}
export function assessServiceArea(raw:unknown,delivery:ConfirmedPoint){
 if(!record(raw)||raw.confirmation!=='operator-confirmed'||!Number.isInteger(raw.version)||Number(raw.version)<1)throw new OrderError('failed-precondition','Restaurant pickup location is not configured. Ask the restaurant to save its pickup coordinates and delivery radius.');
 const pickup=point(raw.point),limit=radius(raw.radiusMeters),distance=distanceMeters(pickup,delivery);
 if(distance>limit)throw new OrderError('failed-precondition','This delivery point is outside the restaurant service radius. Check your coordinates or choose another restaurant.');
 return {pickup,dropoff:{lat:delivery.lat,lng:delivery.lng},distanceMeters:Math.round(distance),radiusMeters:limit,locationVersion:Number(raw.version),source:'haversine-service-area' as const,confirmation:'customer-confirmed' as const};
}
export function validateQuoteReceipt(receipt:unknown,uid:string,fingerprint:string,total:number,version:number,now=Date.now()){
 if(!record(receipt)||receipt.customerUid!==uid||receipt.requestFingerprint!==fingerprint||typeof receipt.expiresAtMs!=='number'||receipt.expiresAtMs<=now)throw new OrderError('failed-precondition','Quote expired or does not match this checkout. Confirm prices again.');
 if(receipt.consumedByOrderId)throw new OrderError('failed-precondition','This quote was already used. Confirm a new quote.');
 if(receipt.totalPaise!==total||receipt.locationVersion!==version)throw new OrderError('failed-precondition','Price or restaurant service area changed. Confirm prices again.');
}
