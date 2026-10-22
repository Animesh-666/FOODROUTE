import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { dashboardHome } from '../../components/dashboard/dashboard.config';

export function WorkspaceRedirect() {
  const { profile, profileError, loading } = useAuth();
  if (loading) return <p role="status">Loading your dashboard…</p>;
  if (profileError || !profile || profile.status !== 'active') return <Navigate to="/account" replace/>;
  return <Navigate to={dashboardHome[profile.role]} replace/>;
}
