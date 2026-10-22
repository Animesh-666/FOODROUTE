import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { friendlyAuthError } from './auth.errors';
import { resetPassword } from './auth.service';
import { useAuth } from './useAuth';

export function ForgotPasswordPage() {
  const { configured } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await resetPassword(email); setSent(true); }
    catch (cause) { setError(friendlyAuthError(cause)); }
    finally { setBusy(false); }
  }
  return <AuthLayout eyebrow="GET BACK ON TRACK" heading="Reset password" caption="We’ll send a password-reset link if this email is registered.">
    {sent ? <div className="auth-success" role="status">If this address has an account, check your inbox for a reset link.</div> :
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="resetEmail">Email address</label>
        <input id="resetEmail" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="primary auth-submit" disabled={busy || !configured}>{busy ? 'Sending…' : 'Send reset link ↗'}</button>
      </form>}
    <p className="auth-switch"><Link to="/login">← Back to sign in</Link></p>
  </AuthLayout>;
}
