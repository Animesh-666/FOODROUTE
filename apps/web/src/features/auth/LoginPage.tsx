import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { friendlyAuthError } from './auth.errors';
import { loginCustomer } from './auth.service';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Every role enters through the same verified dashboard resolver after login.
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await loginCustomer(email, password); navigate('/dashboard', { replace: true }); }
    catch (cause) { setError(friendlyAuthError(cause)); }
    finally { setBusy(false); }
  }
  return <AuthLayout eyebrow="WELCOME BACK" heading="Sign in" caption="Your favourite bites are just a moment away.">
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="signInEmail">Email address</label>
      <input id="signInEmail" type="email" autoComplete="email" required value={email}
        onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <div className="auth-label-row"><label htmlFor="signInPassword">Password</label><Link to="/forgot-password">Forgot password?</Link></div>
      <input id="signInPassword" type="password" autoComplete="current-password" required value={password}
        onChange={(e) => setPassword(e.target.value)} minLength={6}/>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy || !configured}>{busy ? 'Signing in…' : 'Sign in ↗'}</button>
    </form>
    <p className="auth-switch">New to FOODROUTE? <Link to="/signup">Create your account</Link></p>
  </AuthLayout>;
}
