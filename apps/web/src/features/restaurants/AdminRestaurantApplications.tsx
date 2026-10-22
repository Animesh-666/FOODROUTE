import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { approveApplication,rejectApplication,subscribePendingApplications } from './restaurant.service';
import type { RestaurantApplication } from './restaurant.types';
import './restaurants.css';
export function AdminRestaurantApplications(){
  const [pending,setPending]=useState<RestaurantApplication[]>([]);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState<string|null>(null);
  useEffect(()=>subscribePendingApplications(setPending,e=>setError(e.message)),[]);
  async function act(uid:string,approved:boolean){setBusy(uid);setError('');setNotice('');try{
    if(approved){await approveApplication(uid);setNotice('Restaurant approved. Ask the owner to sign out and in again.')}
    else {const reason=window.prompt('Reason for rejection (visible in admin audit record):');if(reason===null){setBusy(null);return}await rejectApplication(uid,reason);setNotice('Application rejected.')}
  }catch(e){setError(e instanceof Error?e.message:'Unable to review application. Are Cloud Functions deployed, and are you a provisioned admin?')}finally{setBusy(null)}}
  return <div className="restaurant-page"><div className="restaurant-top"><Link to="/" className="restaurant-brand">f↗ foodroute<span>.</span></Link><Link to="/account">My account</Link></div><main className="restaurant-container">
    <header className="restaurant-intro"><p className="eyebrow"><span/> OPERATIONS</p><h1>Partner <em>approvals.</em></h1><p>Only trusted administrator accounts can read and approve restaurant applications.</p></header>
    <p className="restaurant-note">Approval uses Firebase Cloud Functions (Blaze plan). For a free development project, use the included trusted CLI approval script instead.</p>
    {error&&<p className="restaurant-error" role="alert">{error}</p>}{notice&&<p className="restaurant-ok" role="status">{notice}</p>}
    {pending.length?<div className="restaurant-approval-list">{pending.map(app=><article className="restaurant-panel" key={app.ownerUid}><p className="restaurant-eyebrow">{app.city} · {app.cuisine}</p><h2>{app.name}</h2><p>{app.description}</p><p className="restaurant-note">Applicant: {app.contactEmail}</p><div className="restaurant-actions"><button className="restaurant-button" disabled={busy!==null} onClick={()=>act(app.ownerUid,true)}>Approve</button><button className="restaurant-secondary" disabled={busy!==null} onClick={()=>act(app.ownerUid,false)}>Reject</button></div></article>)}</div>:<p className="restaurant-empty">No pending applications, or they haven't loaded yet.</p>}
  </main></div>;
}
