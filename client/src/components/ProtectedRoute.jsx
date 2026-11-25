import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginPath } from '../utils/guestNavigation';
import GlobalLoader from './GlobalLoader';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    return <Navigate to={loginPath(location)} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const pathname = location.pathname.replace(/\/$/, '');
  const returnQuery = '?' + new URLSearchParams({ next: location.pathname + location.search + location.hash });

  // Preserve existing setup prerequisites for account features.
  if (user.role === 'student' && !user.activeDomain && pathname !== '/domains' && pathname !== '/career-guide') {
     return <Navigate to={"/domains" + returnQuery} replace />;
  }

  // Force profile setup for students
  if (user.role === 'student' && user.activeDomain && !user.profile?.isProfileComplete && pathname !== '/setup-profile') {
     return <Navigate to={"/setup-profile" + returnQuery} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
