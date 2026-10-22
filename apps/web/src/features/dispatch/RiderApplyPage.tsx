import { useEffect,useState,type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../auth/AuthLayout';
import { useAuth } from '../auth/useAuth';
import { submitRiderApplication, watchApplication, type RiderApplication } from './dispatch.service';
export function RiderApplyPage(){
 const {user,profile}=useAuth();const [application,setApplication]=useState<RiderApplication|null>(null);
 const [name,setName]=useState(''),[city,setCity]=useState(''),[vehicle,setVehicle]=useState<RiderApplication['vehicleType']>('bicycle');
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!user)return;return watchApplication(user.uid,x=>{setApplication(x);setLoading(false)},e=>{setError(e.message);setLoading(false)})},[user]);
 async function submit(e:FormEvent){e.preventDefault();if(!user)return;setBusy(true);setError('');try{await submitRiderApplication(user.uid,name,city,vehicle)}catch(err){setError(err instanceof Error?err.message:'Application failed')}finally{setBusy(false)}}
 return <AuthLayout eyebrow="JOIN THE FLEET" heading="Ride with purpose" caption="Apply with your verified customer account. Rider access requires trusted administrator approval.">
  {error&&<p role="alert" className="auth-error">{error}</p>}
  {loading?<p role="status">Checking your application…</p>:profile?.role==='rider'?<p className="auth-success">You're approved. <Link to="/rider/dashboard">Open rider workspace →</Link></p>:application?<div className="restaurant-application-state"><h2>Application: {application.status}</h2><p>{application.city} · {application.vehicleType}</p><p>Only the platform administrator can approve your application.</p></div>:profile?.role!=='customer'||profile.status!=='active'||!user?.emailVerified?<p className="auth-alert">A verified, active customer account is required. <Link to="/account">Manage your account</Link>.</p>:<form className="auth-form" onSubmit={submit}>
  <label htmlFor="riderName">Your name</label><input id="riderName" required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)}/>
  <label htmlFor="riderCity">Service city</label><input id="riderCity" required minLength={2} maxLength={80} value={city} onChange={e=>setCity(e.target.value)}/>
  <label htmlFor="vehicle">Vehicle</label><select id="vehicle" value={vehicle} onChange={e=>setVehicle(e.target.value as RiderApplication['vehicleType'])}><option value="bicycle">Bicycle</option><option value="scooter">Scooter</option><option value="motorbike">Motorbike</option></select>
  <button disabled={busy} className="primary auth-submit">{busy?'Submitting…':'Apply as delivery partner →'}</button>
  <p className="auth-hint">No live GPS access, driving instructions, or delivery payments are included in this release.</p>
 </form>}
 </AuthLayout>;
}
