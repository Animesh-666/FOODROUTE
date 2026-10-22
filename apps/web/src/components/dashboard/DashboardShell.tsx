import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logoutCustomer } from '../../features/auth/auth.service';
import { useAuth } from '../../features/auth/useAuth';
import { dashboardLabel, dashboardNavigation, roleDisplay, titleForPath, type DashboardRole } from './dashboard.config';
import { DashboardIcon } from './DashboardIcon';
import { StatusBadge } from './DashboardUI';
import './dashboard.css';

export function DashboardShell({ role }: { role: DashboardRole }) {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const navId = useId();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const fullName = profile?.displayName?.trim() || user?.displayName?.trim() || 'FOODROUTE member';
  const initials = fullName.split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('');
  const title = titleForPath(location.pathname, role);
  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const nav = sidebarRef.current;
    nav?.querySelector<HTMLElement>('a')?.focus();
    function close(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMobileOpen(false); menuTriggerRef.current?.focus(); }
      if (event.key === 'Tab' && nav) {
        const list = [...nav.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')];
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener('keydown', close); };
  }, [mobileOpen]);
  async function signOut() {
    setSigningOut(true); setSignOutError('');
    try { await logoutCustomer(); navigate('/', { replace: true }); }
    catch { setSignOutError('Could not sign out. Check your connection and try again.'); }
    finally { setSigningOut(false); }
  }
  return <div className={`frd-shell${collapsed ? ' frd-shell--compact' : ''}`} data-frd-role={role}>
    {mobileOpen && <button className="frd-backdrop" aria-label="Close navigation" onClick={() => { setMobileOpen(false); menuTriggerRef.current?.focus(); }} />}
    <aside ref={sidebarRef} className={`frd-sidebar${mobileOpen ? ' frd-sidebar--open' : ''}`} id={navId} aria-label={`${roleDisplay[role]} navigation`}>
      <div className="frd-logo-row"><Link to="/" className="frd-logo" aria-label="FOODROUTE home"><span className="frd-logo-symbol">f↗</span><span className="frd-logo-word">foodroute<span className="frd-logo-dot">.</span></span></Link><button type="button" className="frd-sidebar-close frd-icon-button" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><DashboardIcon name="close" /></button></div>
      <div className="frd-workspace-mark"><span className="frd-workspace-icon"><DashboardIcon name={role==='admin'?'shield':role==='restaurant'?'chef':role==='rider'?'bike':'utensils'} size={21}/></span><span className="frd-sidebar-text"><small>YOU'RE IN</small><strong>{dashboardLabel[role]}</strong></span></div>
      <nav className="frd-navigation" aria-label="Dashboard pages">
        {dashboardNavigation[role].map(group=><div key={group.label} className="frd-nav-group"><span className="frd-nav-title frd-sidebar-text">{group.label}</span>
          {group.items.map(item=><NavLink key={`${group.label}:${item.to}`} to={item.to} end={item.end} title={collapsed?item.label:undefined} onClick={()=>setMobileOpen(false)} className={({isActive})=>`frd-nav-link${isActive?' frd-nav-link--active':''}`}><DashboardIcon name={item.icon} size={19}/><span className="frd-sidebar-text">{item.label}</span></NavLink>)}
        </div>)}
      </nav>
      <div className="frd-sidebar-bottom"><div className="frd-environment"><span className="frd-live-dot"/><span className="frd-sidebar-text">Development workspace</span></div><button className="frd-collapse-button" type="button" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-pressed={collapsed}><DashboardIcon name="menu" size={18}/><span className="frd-sidebar-text">Collapse sidebar</span></button></div>
    </aside>
    <div className="frd-main">
      <header className="frd-topbar">
        <div className="frd-topbar-leading"><button type="button" ref={menuTriggerRef} className="frd-icon-button frd-mobile-trigger" aria-controls={navId} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(v=>!v)} aria-label="Open navigation"><DashboardIcon name="menu"/></button><div><p className="frd-kicker">FOODROUTE <span aria-hidden="true">/</span> {roleDisplay[role]}</p><h1>{title}</h1></div></div>
        <div className="frd-topbar-actions"><Link to="/" className="frd-view-site">Visit storefront <DashboardIcon name="arrow" size={15}/></Link><div className="frd-account-wrap"><button className="frd-profile-button" onClick={()=>setAccountOpen(v=>!v)} type="button" aria-expanded={accountOpen} aria-label="Account menu"><span className="frd-avatar">{initials||'FR'}</span><span className="frd-profile-name">{fullName}</span><span className="frd-chevron">⌄</span></button>{accountOpen&&<div className="frd-account-popover"><strong>{fullName}</strong><small>{user?.email}</small><StatusBadge tone="good">{roleDisplay[role]}</StatusBadge><Link to="/account"><DashboardIcon name="user" size={16}/> Account settings</Link><button type="button" disabled={signingOut} onClick={()=>void signOut()}><DashboardIcon name="logout" size={16}/>{signingOut?'Signing out…':'Sign out'}</button></div>}</div></div>
      </header>
      {signOutError&&<p className="frd-top-error" role="alert">{signOutError}</p>}
      <div className="frd-body"><Outlet/></div>
      <footer className="frd-footer"><span>© FOODROUTE · Crafted for intelligent delivery</span><span>Secure workspace · {profile?.status==='active'?'Active account':'Account review needed'}</span></footer>
    </div>
  </div>;
}
