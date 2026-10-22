import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

type Props = { count: number; onOpenCart: () => void };

export function Header({ count, onOpenCart }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const { user } = useAuth();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    const closeOutside = (event: MouseEvent) => {
      if (header.current && !header.current.contains(event.target as Node)) setMobileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('click', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('click', closeOutside);
    };
  }, []);

  return (
    <header ref={header} className={`header${mobileOpen ? ' nav-open' : ''}`}>
      <a className="brand" href="#top" aria-label="FOODROUTE homepage">
        <span className="brand-icon" aria-hidden="true">f<span>↗</span></span>foodroute<span className="brand-dot">.</span>
      </a>
      <button className="mobile-nav-button" type="button" aria-controls="primaryNavigation"
        aria-expanded={mobileOpen} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setMobileOpen((open) => !open)}>
        <span /><span /><span />
      </button>
      <nav id="primaryNavigation" aria-label="Main navigation">
        <a className="active" href="#menu" onClick={() => setMobileOpen(false)}>Explore menu</a>
        <Link to="/restaurants" onClick={() => setMobileOpen(false)}>Restaurants</Link>
        <a href="#story" onClick={() => setMobileOpen(false)}>Our ingredients</a>
        <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
        {user && <Link to="/account" onClick={() => setMobileOpen(false)}>Profile</Link>}
        <Link to="/orders" onClick={() => setMobileOpen(false)}>My orders</Link>
        <Link className="account-link" to={user ? '/dashboard' : '/login'} onClick={() => setMobileOpen(false)}>{user ? 'My dashboard' : 'Sign in'}</Link>
      </nav>
      <button className="bag-button" type="button" onClick={onOpenCart} aria-label={`Open your bag, ${count} items`}>
        Your bag <span id="cartCount">{count}</span><span aria-hidden="true">↗</span>
      </button>
    </header>
  );
}
