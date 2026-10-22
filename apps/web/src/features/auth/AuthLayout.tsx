import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';

export function AuthLayout({ eyebrow, heading, caption, children }: {
  eyebrow: string; heading: string; caption: string; children: ReactNode;
}) {
  const { configured } = useAuth();
  return <div className="auth-layout">
    <header className="auth-topbar">
      <Link className="brand" to="/" aria-label="FOODROUTE homepage">
        <span className="brand-icon" aria-hidden="true">f<span>↗</span></span>foodroute<span className="brand-dot">.</span>
      </Link>
      <Link className="auth-toplink" to="/">← Back to the menu</Link>
    </header>
    <main className="auth-page">
      <div className="auth-story" aria-hidden="true">
        <div className="auth-story-halo" />
        <img src="/assets/hero-burger.webp" alt="" />
        <span className="auth-story-kicker">GOOD FOOD. GREAT MOOD.</span>
        <h2>A little out<br />of the <em>ordinary.</em></h2>
        <p>Fresh bites, friendly journeys, better moments.</p>
      </div>
      <section className="auth-card" aria-labelledby="authHeading">
        <p className="eyebrow"><span /> {eyebrow}</p>
        <h1 id="authHeading">{heading}<span className="brand-dot">.</span></h1>
        <p className="auth-caption">{caption}</p>
        {!configured && <div className="auth-alert" role="alert">
          Firebase is not configured yet. Add your web app settings in <code>apps/web/.env.local</code> and enable Email/Password authentication.
        </div>}
        {children}
      </section>
    </main>
    <footer className="auth-footer"><span>FOODROUTE 2.0</span><span>Customer and partner accounts · Phase 3</span></footer>
  </div>;
}
