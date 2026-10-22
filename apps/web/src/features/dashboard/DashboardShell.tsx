import { useEffect,useState } from 'react';
import { Link,NavLink,Outlet,useLocation,useNavigate } from 'react-router-dom';
import { logoutCustomer } from '../auth/auth.service';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { DashboardIcon } from './DashboardIcon';
import {roleNav,roleTitle} from './dashboard.meta';
import './dashboard.css';
import {NotificationBell} from '../notifications/NotificationBell';
export function DashboardShell({role}:{role:UserRole}){
 const {profile,user}=useAuth(); const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const location=useLocation();const navigate=useNavigate();
 useEffect(()=>setOpen(false),[location.pathname]);
 useEffect(()=>{if(!open)return;const onEsc=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};document.addEventListener('keydown',onEsc);return()=>document.removeEventListener('keydown',onEsc)},[open]);
 async function logout(){setBusy(true);setError('');try{await logoutCustomer();navigate('/',{replace:true})}catch(e){setError(e instanceof Error?e.message:'Sign out failed')}finally{setBusy(false)}}
 const name=profile?.displayName?.trim()||user?.email?.split('@')[0]||'Member';
 return <div className="frd" id="dashboardTop">
   <a href="#dashboardContent" className="frd-skip">Skip to dashboard content</a>
   {open&&<button type="button" className="frd-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
   <aside className={`frd-sidebar ${open?'is-open':''}`} id="dashboardNav" aria-label={`${role} dashboard navigation`}>
     <Link to="/" className="frd-brand" aria-label="FOODROUTE home"><span className="frd-brand-symbol">f↗</span> foodroute<span className="frd-brand-dot">.</span></Link>
     <div className="frd-workspace-label"><span className="frd-spot"/> {role.toUpperCase()} WORKSPACE</div>
     <nav aria-label="Dashboard pages" className="frd-sidebar-links">
      {roleNav[role].map(item=><NavLink key={item.to} to={item.to} end={item.end} className={({isActive})=>`frd-sidebar-link ${isActive?'is-active':''}`}><DashboardIcon name={item.icon}/><span>{item.label}</span></NavLink>)}
     </nav>
     <div className="frd-sidebar-bottom"><p>FOODROUTE 2.0</p><small>Purpose-built for food & delivery.</small><Link to="/" className="frd-back-home">← Back to storefront</Link></div>
   </aside>
   <div className="frd-main">
     <header className="frd-topbar"><div className="frd-topbar-left">
       <button type="button" aria-label="Open navigation" aria-controls="dashboardNav" aria-expanded={open} className="frd-mobile-menu" onClick={()=>setOpen(v=>!v)}><DashboardIcon name={open?'close':'menu'}/></button>
       <div><span className="frd-breadcrumb">WORKSPACE / {role.toUpperCase()}</span><p className="frd-topbar-title">{roleTitle[role]}</p></div>
     </div><div className="frd-topbar-actions"><span className="frd-private-label">Private workspace</span><NotificationBell role={role}/><Link className="frd-top-avatar" to="/account" title="Account settings" aria-label="Go to account settings">{name.charAt(0).toUpperCase()}</Link><button type="button" className="frd-logout" disabled={busy} onClick={()=>void logout()}><DashboardIcon name="logout" size={17}/><span>{busy?'Signing out…':'Sign out'}</span></button></div></header>
     {error&&<p className="frd-error" role="alert">{error}</p>}
     <main id="dashboardContent" className="frd-content" tabIndex={-1}><Outlet/></main>
     <footer className="frd-footer">FOODROUTE · Designed for clarity, driven by smarter routes. <span>Development workspace · No simulated totals presented as live</span></footer>
   </div>
 </div>;
}
