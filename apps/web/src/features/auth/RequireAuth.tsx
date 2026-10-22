import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { configured, user, loading } = useAuth();
  const location = useLocation();
  if (!configured) return <Navigate to="/login" replace />;
  if (loading) return <main className="auth-page"><p className="auth-note" role="status">Loading account…</p></main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
