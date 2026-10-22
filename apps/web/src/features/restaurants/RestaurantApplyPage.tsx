import { useEffect,useState,type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../auth/AuthLayout';
import { useAuth } from '../auth/useAuth';
import { requestRestaurant,subscribeApplication } from './restaurant.service';
import type { RestaurantApplication } from './restaurant.types';
import './restaurants.css';
export function RestaurantApplyPage(){
  const { user,profile,profileError }=useAuth();const [application,setApplication]=useState<RestaurantApplication|null>(null);
  const [name,setName]=useState('');const [city,setCity]=useState('');const [cuisine,setCuisine]=useState('');const [description,setDescription]=useState('');
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{if(!user)return;const unsubscribe=subscribeApplication(user.uid,a=>{setApplication(a);setLoading(false)},e=>{setError(e.message);setLoading(false)});return unsubscribe},[user]);
  async function submit(e:FormEvent){e.preventDefault();if(!user?.email)return;setBusy(true);setError('');try{await requestRestaurant(user.uid,user.email,{name,city,cuisine,description})}catch(e){setError(e instanceof Error?e.message:'Could not submit application.')}finally{setBusy(false)}}
  return <AuthLayout eyebrow="PARTNER WITH FOODROUTE" heading="List your kitchen" caption="Start as a customer account. Restaurant management is unlocked only after approval.">
    {profileError?<p role="alert" className="auth-error">We couldn't verify your account profile.</p>:loading?<p role="status">Checking your application…</p>:profile?.role==='restaurant'?<div className="auth-success">Your kitchen has been approved. <Link to="/restaurant/dashboard">Open restaurant dashboard →</Link></div>:!user?.emailVerified?<div className="auth-alert">Please verify your email and sign in again before applying. Check your inbox or <Link to="/account">resend the verification email from your account</Link>.</div>:profile?.role!=='customer'||profile.status!=='active'?<div className="auth-alert">An active customer profile is required. <Link to="/account">Visit your account.</Link></div>:application?<div className="restaurant-application-state"><h2>Application: {application.status}</h2><p>{application.name} · {application.city}</p><p>{application.status==='pending'?'Our team must review your application before you can publish a menu.':application.status==='rejected'?'This application was not approved. Contact the FOODROUTE administrator for review.':'Approved — refresh your login to receive the updated restaurant role.'}</p></div>:
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="restaurantName">Restaurant name</label><input id="restaurantName" minLength={3} maxLength={90} required value={name} onChange={e=>setName(e.target.value)}/>
      <label htmlFor="restaurantCity">City</label><input id="restaurantCity" minLength={2} maxLength={70} required value={city} onChange={e=>setCity(e.target.value)}/>
      <label htmlFor="restaurantCuisine">Cuisine</label><input id="restaurantCuisine" minLength={2} maxLength={50} required value={cuisine} onChange={e=>setCuisine(e.target.value)} placeholder="Burgers, Indian, Continental…" />
      <label htmlFor="restaurantDescription">Describe your kitchen</label><textarea id="restaurantDescription" minLength={10} maxLength={300} required rows={4} value={description} onChange={e=>setDescription(e.target.value)}/>
      {error&&<p className="auth-error" role="alert">{error}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy}>{busy?'Submitting…':'Submit application →'}</button>
      <p className="auth-hint">Applying does not grant restaurant permissions. Approval is performed on a trusted backend.</p>
    </form>}
  </AuthLayout>;
}
