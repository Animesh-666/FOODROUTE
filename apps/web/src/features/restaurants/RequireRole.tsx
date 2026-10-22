import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { UserRole } from '../auth/auth.types';
import { useVerifiedDashboardAccess } from '../dashboard/useVerifiedDashboardAccess';

export function RequireRole({ role }: { role: UserRole }) {
  const { profile } = useAuth();
  const { status } = useVerifiedDashboardAccess();
  if (status === 'loading') return <main className="auth-page"><p role="status">Verifying workspace permissions…</p></main>;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  if (status === 'error') return <main className="auth-page" role="alert">Unable to verify role permissions. Check connectivity and sign in again.</main>;
  if (status !== 'granted' || profile?.role !== role)
    return <main className="auth-page"><div className="auth-alert" role="alert">
      This workspace requires an active {role} account. If your role was recently approved, sign out and sign back in to refresh permissions.
      {' '}<Link to="/dashboard">My dashboard</Link> · <Link to="/account">Account settings</Link>
    </div></main>;
  // This is only frontend routing; server and Firestore rules must still verify access.
  return <Outlet />;
}
