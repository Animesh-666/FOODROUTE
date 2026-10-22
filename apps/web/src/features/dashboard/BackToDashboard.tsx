import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { showDashboardReturn } from './dashboard.meta';
import { useVerifiedDashboardAccess } from './useVerifiedDashboardAccess';
import './back-to-dashboard.css';

/** A consistent return action on account, browsing, orders, and operational pages. */
export function BackToDashboard() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const { status } = useVerifiedDashboardAccess();
  if (!profile || !showDashboardReturn(pathname, status === 'granted')) return null;

  return <nav className="fr-back-to-dashboard" aria-label="Return to dashboard">
    <Link to="/dashboard" title="Return to your dashboard" aria-label="Back to Dashboard">
      <span className="fr-back-arrow" aria-hidden="true">←</span>
      <span>Back to Dashboard</span>
    </Link>
  </nav>;
}
