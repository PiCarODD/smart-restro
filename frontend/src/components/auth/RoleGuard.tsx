import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

type UserRole = User['role'];

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

/**
 * RoleGuard component - restricts access based on user role
 * Redirects to fallback path (default: /dashboard) if user doesn't have required role
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // User doesn't have required role, redirect to fallback
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

