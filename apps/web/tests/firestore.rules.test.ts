/** Integration tests: requires local Firestore emulator; never run against production. */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
let env:RulesTestEnvironment;
const owner='restaurant-owner'; const customer='customer123';
const menu={name:'Golden Crunch',description:'Fresh burger with cheese',category:'Burgers',pricePaise:24900,imageUrl:'/assets/burger.jpg',vegetarian:false,available:true,published:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
async function seed(){
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(doc(db,'users',customer),{uid:customer,displayName:'Customer',email:'customer@example.com',role:'customer',status:'active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await setDoc(doc(db,'users',owner),{uid:owner,displayName:'Owner',email:'owner@example.com',role:'restaurant',status:'active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await setDoc(doc(db,'users','admin123'),{uid:'admin123',displayName:'Admin',email:'admin@example.com',role:'admin',status:'active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await setDoc(doc(db,'restaurants',`rest_${owner}`),{ownerUid:owner,name:'Golden Kitchen',city:'Kolkata',cuisine:'Burgers',description:'A lovely kitchen',approved:true,status:'active'});
  });
}
beforeAll(async()=>{env=await initializeTestEnvironment({projectId:'demo-foodroute-phase3',firestore:{rules:readFileSync('../../firebase/firestore.rules','utf8')}})});
afterAll(async()=>{await env.cleanup()});
beforeEach(async()=>{await env.clearFirestore();await seed()});
describe('Phase 3 Security Rules',()=>{
  it('lets customer create pending application after email verification',async()=>{
    const db=env.authenticatedContext(customer,{email:'customer@example.com',email_verified:true}).firestore();
    await assertSucceeds(setDoc(doc(db,'restaurantApplications',customer),{ownerUid:customer,contactEmail:'customer@example.com',name:'Cafe Example',city:'Kolkata',cuisine:'Cafe',description:'Coffee and sandwiches',status:'pending',submittedAt:serverTimestamp()}));
  });
  it('rejects customer granting restaurant role to themselves',async()=>{
    const db=env.authenticatedContext(customer,{email:'customer@example.com'}).firestore();
    await assertFails(updateDoc(doc(db,'users',customer),{role:'restaurant',updatedAt:serverTimestamp()}));
  });
  it('rejects unverified restaurant applications',async()=>{
    const db=env.authenticatedContext(customer,{email:'customer@example.com',email_verified:false}).firestore();
    await assertFails(setDoc(doc(db,'restaurantApplications',customer),{ownerUid:customer,contactEmail:'customer@example.com',name:'Cafe Example',city:'Kolkata',cuisine:'Cafe',description:'Coffee and sandwiches',status:'pending',submittedAt:serverTimestamp()}));
  });
  it('only owner with restaurant role can publish a dish',async()=>{
    const db=env.authenticatedContext(owner,{role:'restaurant',email:'owner@example.com'}).firestore();
    await assertSucceeds(setDoc(doc(db,'restaurants',`rest_${owner}`,'menuItems','dish1'),menu));
    const other=env.authenticatedContext(customer,{email:'customer@example.com'}).firestore();
    await assertFails(updateDoc(doc(other,'restaurants',`rest_${owner}`,'menuItems','dish1'),{pricePaise:100,updatedAt:serverTimestamp()}));
  });
  it('visitors can see published dishes but not private drafts',async()=>{
    await env.withSecurityRulesDisabled(async ctx=>{
      const db=ctx.firestore();
      await setDoc(doc(db,'restaurants',`rest_${owner}`,'menuItems','published'),menu);
      await setDoc(doc(db,'restaurants',`rest_${owner}`,'menuItems','draft'),{...menu,published:false});
    });
    const publicDb=env.unauthenticatedContext().firestore();
    await assertSucceeds(getDocs(query(collection(publicDb,'restaurants',`rest_${owner}`,'menuItems'),where('published','==',true))));
    await assertFails(getDoc(doc(publicDb,'restaurants',`rest_${owner}`,'menuItems','draft')));
  });
  it('only an admin can read pending applications list',async()=>{
    const customerDb=env.authenticatedContext(customer,{email:'customer@example.com'}).firestore();
    await assertFails(getDocs(query(collection(customerDb,'restaurantApplications'),where('status','==','pending'))));
    const adminDb=env.authenticatedContext('admin123',{role:'admin',email:'admin@example.com'}).firestore();
    await assertSucceeds(getDocs(query(collection(adminDb,'restaurantApplications'),where('status','==','pending'))));
  });
});

describe('Phase 4 Order Security Rules',()=>{
  async function orderSeed(){
    await env.withSecurityRulesDisabled(async ctx=>{
      await setDoc(doc(ctx.firestore(),'orders','ord_example'),{
        customerUid:customer,restaurantId:`rest_${owner}`,items:[{itemId:'dish1',name:'Golden Crunch',quantity:1,unitPricePaise:24900,lineTotalPaise:24900}],
        totalPaise:24900,subtotalPaise:24900,deliveryFeePaise:0,status:'placed',payment:{method:'cod',status:'unpaid'},
        address:{line1:'Example address',city:'Kolkata',postalCode:'700001',note:''},createdAt:serverTimestamp(),updatedAt:serverTimestamp(),
      });
    });
  }
  it('customer can read own order, but anonymous visitors cannot',async()=>{
    await orderSeed();
    const customerDb=env.authenticatedContext(customer,{role:'customer'}).firestore();
    await assertSucceeds(getDoc(doc(customerDb,'orders','ord_example')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'orders','ord_example')));
  });
  it('another customer cannot read or list the order',async()=>{
    await orderSeed();
    const stranger=env.authenticatedContext('stranger123',{role:'customer'}).firestore();
    await assertFails(getDoc(doc(stranger,'orders','ord_example')));
    await assertFails(getDocs(query(collection(stranger,'orders'),where('customerUid','==',customer))));
  });
  it('only the authenticated owning restaurant can view incoming orders',async()=>{
    await orderSeed();
    const rdb=env.authenticatedContext(owner,{role:'restaurant'}).firestore();
    await assertSucceeds(getDocs(query(collection(rdb,'orders'),where('restaurantId','==',`rest_${owner}`))));
    const customerDb=env.authenticatedContext(customer,{role:'customer'}).firestore();
    await assertFails(getDocs(query(collection(customerDb,'orders'),where('restaurantId','==',`rest_${owner}`))));
  });
  it('clients cannot create orders, alter status or change totals',async()=>{
    await orderSeed();
    const customerDb=env.authenticatedContext(customer,{role:'customer'}).firestore();
    await assertFails(setDoc(doc(customerDb,'orders','ord_forged'),{customerUid:customer,totalPaise:1}));
    await assertFails(updateDoc(doc(customerDb,'orders','ord_example'),{totalPaise:1}));
    const ownerDb=env.authenticatedContext(owner,{role:'restaurant'}).firestore();
    await assertFails(updateDoc(doc(ownerDb,'orders','ord_example'),{status:'delivered'}));
  });
});


describe('Phase 5 Rider Dispatch Security Rules',()=>{
 const rider='rider-one';
 async function seedRider(){await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  await setDoc(doc(db,'users',rider),{uid:rider,displayName:'Rider',email:'rider@example.com',role:'rider',status:'active',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  await setDoc(doc(db,'deliveryAgents',rider),{uid:rider,displayName:'Rider',city:'Kolkata',vehicleType:'bicycle',status:'active',available:false,activeRouteId:'route_test'});
  await setDoc(doc(db,'orders','ord_test'),{customerUid:customer,restaurantId:`rest_${owner}`,assignedRiderUid:rider,activeRouteId:'route_test',status:'ready_for_pickup',address:{city:'Kolkata',line1:'Example',postalCode:'700001',note:''}});
  await setDoc(doc(db,'deliveryRoutes','route_test'),{orderId:'ord_test',riderUid:rider,restaurantId:`rest_${owner}`,status:'offered',mode:'manual-single-order'});
 });}
 it('allows verified customer to apply as rider, never self-approve',async()=>{
  const c=env.authenticatedContext(customer,{email_verified:true}).firestore();
  const ref=doc(c,'riderApplications',customer);
  await assertSucceeds(setDoc(ref,{ownerUid:customer,displayName:'Customer',city:'Kolkata',vehicleType:'bicycle',status:'pending',submittedAt:serverTimestamp()}));
  await assertFails(updateDoc(ref,{status:'approved'}));
  await assertFails(updateDoc(doc(c,'users',customer),{role:'rider'}));
 });
 it('rejects unverified rider application',async()=>{
  const c=env.authenticatedContext(customer,{email_verified:false}).firestore();
  await assertFails(setDoc(doc(c,'riderApplications',customer),{ownerUid:customer,displayName:'Customer',city:'Kolkata',vehicleType:'bicycle',status:'pending',submittedAt:serverTimestamp()}));
 });
 it('allows assigned rider to read their order and route but nobody else',async()=>{
  await seedRider();
  const rdb=env.authenticatedContext(rider,{role:'rider'}).firestore();
  await assertSucceeds(getDoc(doc(rdb,'orders','ord_test')));
  await assertSucceeds(getDoc(doc(rdb,'deliveryRoutes','route_test')));
  const other=env.authenticatedContext('otherRider',{role:'rider'}).firestore();
  await assertFails(getDoc(doc(other,'orders','ord_test')));
  await assertFails(getDoc(doc(other,'deliveryRoutes','route_test')));
 });
 it('blocks clients from writing routes, rider availability, and delivery status',async()=>{
  await seedRider();
  const rdb=env.authenticatedContext(rider,{role:'rider'}).firestore();
  await assertFails(updateDoc(doc(rdb,'deliveryAgents',rider),{available:true}));
  await assertFails(updateDoc(doc(rdb,'deliveryRoutes','route_test'),{status:'delivered'}));
  await assertFails(updateDoc(doc(rdb,'orders','ord_test'),{status:'delivered'}));
 });
});
