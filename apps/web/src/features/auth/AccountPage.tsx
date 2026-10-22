import { useEffect, useState, type FormEvent } from 'react';
import { reload } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { friendlyAuthError } from './auth.errors';
import { ensureCustomerProfile, logoutCustomer, resendVerification, updateCustomerName } from './auth.service';
import { useAuth } from './useAuth';

export function AccountPage() {
  const { user, profile, profileError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [, setVerificationRefresh] = useState(0);
  useEffect(() => { setName(profile?.displayName ?? user?.displayName ?? ''); }, [profile?.displayName, user?.displayName]);
  if (!user) return null; // Protected by RequireAuth.
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true); setMessage(''); setError('');
    try { await action(); setMessage(success); }
    catch (cause) { setError(cause instanceof Error && cause.message === 'profile/invalid-name' ? 'Name must be 2–80 characters.' : friendlyAuthError(cause)); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => profile ? updateCustomerName(user!, name) : ensureCustomerProfile(user!, name),
      profile ? 'Profile updated.' : 'Customer profile created.');
  }
  async function signOut() {
    await run(async () => { await logoutCustomer(); navigate('/', { replace: true }); }, 'Signed out.');
  }
  return <AuthLayout eyebrow="YOUR FOODROUTE SPACE" heading="My account" caption="Your profile is secured with Firebase Authentication.">
    <div className="account-next"><strong>FOODROUTE partner workspace</strong><p>Open your <Link to="/dashboard">dashboard →</Link> · Want to manage your own kitchen? <Link to="/restaurant/apply">Apply as a restaurant →</Link>{profile?.role==='restaurant'&&<> · <Link to="/restaurant/dashboard">Restaurant dashboard →</Link></>}{profile?.role==='admin'&&<> · <Link to="/admin/restaurant-applications">Review partner applications →</Link></>}</p></div>
    <div className="account-meta">
      <div><span>Email</span><strong>{user.email}</strong></div>
      <div><span>Account type</span><strong>{profile?.role ?? 'Profile pending'}</strong></div>
      <div><span>Email verification</span><strong>{user.emailVerified ? 'Verified' : 'Not yet verified'}</strong></div>
    </div>
    {profileError && <p className="auth-error" role="alert">We couldn't read your profile. Check Firestore permissions and network access.</p>}
    {!profile && !profileError && <div className="auth-alert" role="status">Your account exists, but your customer profile has not been created yet. Enter your name below to finish setup.</div>}
    {profile?.status !== undefined && profile.status !== 'active' && <div className="auth-alert" role="status">This account is {profile.status}. Access to ordering will require an active account.</div>}
    <form className="auth-form" onSubmit={save}>
      <label htmlFor="profileName">Display name</label>
      <input id="profileName" type="text" minLength={2} maxLength={80} required value={name}
        onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="primary auth-submit" disabled={busy || profileError}>{busy ? 'Saving…' : profile ? 'Save profile ↗' : 'Complete customer profile ↗'}</button>
    </form>
    {!user.emailVerified && <div className="auth-verification-actions">
      <button className="auth-inline-button" type="button" disabled={busy}
        onClick={() => void run(() => resendVerification(user), 'Verification email requested. Check your inbox.')}>Resend verification email →</button>
      <button className="auth-inline-button" type="button" disabled={busy}
        onClick={() => void run(async () => { await reload(user); setVerificationRefresh((n) => n + 1); }, 'Email verification status refreshed.')}>I verified my email ↻</button>
    </div>}
    {message && <p role="status" className="auth-success">{message}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <div className="account-next"><strong>Ready to explore?</strong><p>The animated homepage menu is a visual demo. Real restaurant menus and development COD ordering are available from the Restaurants page.</p><Link className="auth-toplink" to="/#menu">Explore menu ↗</Link></div>
    <button className="auth-signout" type="button" disabled={busy} onClick={() => void signOut()}>Sign out</button>
  </AuthLayout>;
}
