import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';
import { User } from '@/types';

type UserRole = User['role'];

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPage?: 'dashboard' | 'login';
}

/**
 * RoleGuard component - restricts access based on user role
 * Redirects to fallback page (default: dashboard) if user doesn't have required role
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPage = 'dashboard'
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { navigate, currentPage } = useNavigationStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('login');
    } else if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to fallback
      navigate(fallbackPage);
    }
  }, [isAuthenticated, user, allowedRoles, fallbackPage, navigate, currentPage]);

  if (!isAuthenticated || !user) {
    return null; // Navigation to login will happen in useEffect
  }

  if (!allowedRoles.includes(user.role)) {
    return null; // Navigation to fallback will happen in useEffect
  }

  return <>{children}</>;
}

