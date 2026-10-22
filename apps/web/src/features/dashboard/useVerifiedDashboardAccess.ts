import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { hasDashboardRole } from './dashboard.meta';

type AccessStatus = 'loading' | 'signed-out' | 'needs-profile' | 'inactive' | 'granted' | 'denied' | 'error';
type Verification = { key: string; result: 'granted' | 'denied' | 'error' };

/** UI-level verification. Firestore rules and trusted API checks remain authoritative. */
export function useVerifiedDashboardAccess(): { status: AccessStatus } {
  const { user, profile, profileError, loading } = useAuth();
  const [verification, setVerification] = useState<Verification | null>(null);
  const key = user && profile ? `${user.uid}:${profile.role}:${profile.status}` : '';

  useEffect(() => {
    if (!user || !profile || profile.status !== 'active') return;
    let cancelled = false;
    const expectedKey = `${user.uid}:${profile.role}:${profile.status}`;
    // The ID token, not a client-controlled profile field, must confirm a privileged role.
    user.getIdTokenResult().then(token => {
      if (!cancelled) setVerification({ key: expectedKey, result:
        hasDashboardRole(profile.role, profile, token.claims.role) ? 'granted' : 'denied' });
    }).catch(() => {
      if (!cancelled) setVerification({ key: expectedKey, result: 'error' });
    });
    return () => { cancelled = true; };
  }, [user, profile?.role, profile?.status]);

  if (loading) return { status: 'loading' };
  if (!user) return { status: 'signed-out' };
  if (profileError) return { status: 'error' };
  if (!profile) return { status: 'needs-profile' };
  if (profile.status !== 'active') return { status: 'inactive' };
  if (!verification || verification.key !== key) return { status: 'loading' };
  return { status: verification.result };
}
