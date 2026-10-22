import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { OrderError, place, quote, updateStatus } from './order-core';
function handle(e:unknown):never {
 if(e instanceof OrderError)throw new HttpsError(e.code,e.message);
 console.error('Order service error:',e instanceof Error?e.message:'Unexpected');
 throw new HttpsError('internal','Order service unavailable.');
}
export const calculateOrderQuote=onCall({region:'us-central1',maxInstances:4},async request=>{
 try {return await quote(request.auth?.uid||'',request.data)}catch(e){return handle(e)}
});
export const placeCustomerOrder=onCall({region:'us-central1',maxInstances:4},async request=>{
 try {return await place(request.auth?.uid||'',request.data)}catch(e){return handle(e)}
});
export const updateRestaurantOrder=onCall({region:'us-central1',maxInstances:4},async request=>{
 try {return await updateStatus(request.auth?.uid||'',request.data)}catch(e){return handle(e)}
});
