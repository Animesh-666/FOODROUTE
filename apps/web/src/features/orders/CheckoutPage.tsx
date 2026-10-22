import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useAuth } from '../auth/useAuth';
import { useLiveCart } from './live-cart';
import type { Address, OrderRequest, Quote } from './order.types';
import { calculateQuote,placeOrder } from './order.service';
import { money } from '../restaurants/restaurant.types';
import './orders.css';
const initialAddress:Address={line1:'',city:'',postalCode:'',note:''};
const newKey=()=>crypto.randomUUID().replace(/-/g,'');
export function CheckoutPage(){
 const {cart,clear,setQuantity}=useLiveCart();const {user,profile}=useAuth();const navigate=useNavigate();
 const [address,setAddress]=useState<Address>(initialAddress);const [quote,setQuote]=useState<Quote|null>(null);
 const [catalogNames,setNames]=useState<Record<string,string>>({});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const idempotencyKey=useRef(newKey());
 const cartSnapshot=cart?JSON.stringify(cart.lines):'';
 useEffect(()=>{setQuote(null);setError('');idempotencyKey.current=newKey()},[cart?.restaurantId,cartSnapshot,address.line1,address.city,address.postalCode,address.note]);
 useEffect(()=>{let canceled=false;async function load(){if(!cart||!firestore)return;const values=await Promise.all(cart.lines.map(async line=>{
  try{const snap=await getDoc(doc(firestore!,'restaurants',cart.restaurantId,'menuItems',line.itemId));return [line.itemId,snap.exists()?String(snap.data().name):'Unavailable dish'] as const}
  catch{return [line.itemId,'Menu item'] as const}
 }));if(!canceled)setNames(Object.fromEntries(values))}void load();return()=>{canceled=true}},[cart?.restaurantId,cartSnapshot]);
 function input():OrderRequest{if(!cart)throw Error('Your bag is empty.');return{restaurantId:cart.restaurantId,lines:cart.lines,address,paymentMethod:'cod'}}
 async function confirmQuote(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{const fresh=await calculateQuote(input());setQuote(fresh)}catch(e){setError(e instanceof Error?e.message:'Could not verify this price.')}finally{setBusy(false)}}
 async function submit(){if(!quote||!cart)return;setBusy(true);setError('');try{
const result = await placeOrder(input(), idempotencyKey.current, quote.totalPaise, quote.quoteId);
clear();
navigate(`/orders?placed=${encodeURIComponent(result.orderId)}`);
 }catch(e){setError(e instanceof Error?e.message:'Order failed. Please retry.')}finally{setBusy(false)}}
 return <div className="restaurant-page"><div className="restaurant-top"><Link className="restaurant-brand" to="/">f↗ foodroute<span>.</span></Link><nav><Link to="/restaurants">Explore restaurants</Link><Link to="/orders">My orders</Link></nav></div><main className="restaurant-container order-page">
  <header className="restaurant-intro"><p className="eyebrow"><span/> SIMPLE, VERIFIED CHECKOUT</p><h1>Your bag<em>.</em></h1><p>One restaurant per checkout. Your final prices are recalculated from the live restaurant menu on our trusted order API.</p></header>
  {!cart?<div className="restaurant-empty">Your live restaurant bag is empty. <Link to="/restaurants">Browse restaurants</Link>.</div>:<div className="order-layout">
   <section className="restaurant-panel"><h2>{cart.restaurantName}</h2><p className="restaurant-note">Available dishes and prices are checked again before you confirm.</p>
    {cart.lines.map(line=><div className="order-line" key={line.itemId}><strong>{catalogNames[line.itemId]||'Loading dish…'}</strong><div className="order-stepper"><button aria-label="Decrease quantity" type="button" onClick={()=>setQuantity(line.itemId,line.quantity-1)}>−</button><span>{line.quantity}</span><button aria-label="Increase quantity" type="button" disabled={line.quantity>=10} onClick={()=>setQuantity(line.itemId,line.quantity+1)}>+</button></div></div>)}
    <button className="restaurant-secondary" type="button" onClick={clear}>Clear bag</button>
    <h2 className="order-subtitle">Delivery details</h2>
    <form onSubmit={confirmQuote} className="restaurant-form"><label>Street address<input required minLength={8} maxLength={180} autoComplete="street-address" value={address.line1} onChange={e=>setAddress(s=>({...s,line1:e.target.value}))}/></label>
     <div className="order-fields"><label>City<input required minLength={2} maxLength={80} autoComplete="address-level2" value={address.city} onChange={e=>setAddress(s=>({...s,city:e.target.value}))}/></label><label>PIN code<input required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} value={address.postalCode} onChange={e=>setAddress(s=>({...s,postalCode:e.target.value}))}/></label></div>
     <label>Delivery note (optional)<textarea maxLength={200} rows={2} value={address.note} onChange={e=>setAddress(s=>({...s,note:e.target.value}))}/></label>
     <p className="restaurant-note">Payment method: Cash on delivery. No online payment or actual rider dispatch is connected yet.</p>
     {profile?.role!=='customer'&&<p className="restaurant-error" role="alert">Ordering requires a separate customer account. Your restaurant account is intended for managing your kitchen.</p>}
     {user&&!user.emailVerified&&<p className="restaurant-error">Verify your email address and sign in again before ordering.</p>}
     {error&&<p role="alert" className="restaurant-error">{error}</p>}
     {!user?<Link className="restaurant-button order-cta" to="/login" state={{from:'/checkout'}}>Sign in to confirm prices ↗</Link>:<button className="restaurant-button" disabled={busy||profile?.role!=='customer'||!user.emailVerified} type="submit">{busy?'Checking…':'Confirm current prices →'}</button>}
    </form></section>
   <aside className="restaurant-panel order-aside"><p className="restaurant-eyebrow">ORDER SUMMARY</p><h2>{quote?'Verified quote':'Ready when you are'}</h2>
    {!quote?<p className="restaurant-note">Fill in your delivery details and confirm prices. The customer app will never decide the final total.</p>:<>
     {quote.items.map(x=><div className="order-cost" key={x.itemId}><span>{x.quantity} × {x.name}</span><strong>{money(x.lineTotalPaise)}</strong></div>)}
     <div className="order-cost"><span>Subtotal</span><strong>{money(quote.subtotalPaise)}</strong></div><div className="order-cost"><span>Delivery fee (demo)</span><strong>{money(quote.deliveryFeePaise)}</strong></div>
     <div className="order-total"><span>Total</span><strong>{money(quote.totalPaise)}</strong></div>
     <p className="restaurant-note">This is a development checkout with zero delivery fees. No payment is processed.</p>
     <button className="restaurant-button order-cta" disabled={busy} type="button" onClick={()=>void submit()}>{busy?'Placing…':'Place COD order →'}</button>
    </>}
   </aside>
  </div>}
 </main></div>
}
