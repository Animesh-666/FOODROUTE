import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { getHomeForRole } from './dashboard.meta';
import { useVerifiedDashboardAccess } from './useVerifiedDashboardAccess';

/** Single post-login entry point for customer, admin, restaurant and rider accounts. */
export function DashboardRedirect() {
  const { profile } = useAuth();
  const { status } = useVerifiedDashboardAccess();
  if (status === 'loading') return <main role="status" className="auth-page">Opening your dashboard…</main>;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  // Missing/pending profiles must be repaired or approved, not assigned a guessed role.
  if (status === 'needs-profile' || status === 'inactive') return <Navigate to="/account" replace />;
  if (status === 'error') return <main className="auth-page" role="alert">We couldn't verify your account. Check your connection and <Link to="/account">open account settings</Link>.</main>;
  if (status === 'denied' || !profile) return <main className="auth-page" role="alert">Your dashboard permissions need refreshing. Sign out and sign in again, or <Link to="/account">open account settings</Link>.</main>;
  return <Navigate to={getHomeForRole(profile.role)} replace />;
}
