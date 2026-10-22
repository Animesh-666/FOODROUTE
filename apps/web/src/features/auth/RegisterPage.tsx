import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { friendlyAuthError } from './auth.errors';
import { registerCustomer } from './auth.service';
import { useAuth } from './useAuth';

export function RegisterPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (name.trim().length < 2 || name.trim().length > 80) { setError('Name must be 2–80 characters.'); return; }
    if (password.length < 8) { setError('Use a password of at least 8 characters.'); return; }
    if (password !== confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try { await registerCustomer(name, email, password); navigate('/dashboard', { replace: true }); }
    catch (cause) { setError(friendlyAuthError(cause)); }
    finally { setBusy(false); }
  }
  return <AuthLayout eyebrow="MAKE YOUR DAY DELICIOUS" heading="Create account" caption="Join FOODROUTE to save your profile and get ready for real ordering.">
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="registerName">Full name</label>
      <input id="registerName" type="text" autoComplete="name" minLength={2} maxLength={80} required value={name}
        onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      <label htmlFor="registerEmail">Email address</label>
      <input id="registerEmail" type="email" autoComplete="email" required value={email}
        onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <label htmlFor="registerPassword">Password</label>
      <input id="registerPassword" type="password" autoComplete="new-password" minLength={8} required value={password}
        onChange={(e) => setPassword(e.target.value)} aria-describedby="passwordHint" />
      <p id="passwordHint" className="auth-hint">At least 8 characters. A longer unique password is better.</p>
      <label htmlFor="registerConfirm">Confirm password</label>
      <input id="registerConfirm" type="password" autoComplete="new-password" minLength={8} required value={confirm}
        onChange={(e) => setConfirm(e.target.value)} />
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="primary auth-submit" type="submit" disabled={busy || !configured}>{busy ? 'Creating account…' : 'Create customer account ↗'}</button>
      <p className="auth-hint">Restaurant, rider and admin accounts require approval and cannot register here.</p>
    </form>
    <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
  </AuthLayout>;
}
