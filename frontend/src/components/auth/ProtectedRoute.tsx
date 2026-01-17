import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Global flag to ensure checkAuth is only called once across all ProtectedRoute instances
let hasCheckedAuthOnMount = false;

/**
 * ProtectedRoute component - redirects to login if not authenticated
 * Checks authentication status once on app mount if we have a token
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const { navigate, currentPage } = useNavigationStore();
  const hasCheckedRef = useRef(false);

  // Check authentication once on first mount if we have a token but no user data
  useEffect(() => {
    if (!hasCheckedAuthOnMount && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const token = localStorage.getItem('auth_token');
      
      // Only call API if we have a token but user is not authenticated
      // This prevents unnecessary calls if user data is already persisted
      if (token && !isAuthenticated && !user) {
        hasCheckedAuthOnMount = true;
        checkAuth();
      } else if (!token) {
        // No token, mark as checked so we don't try again
        hasCheckedAuthOnMount = true;
      }
    }
  }, [checkAuth, isAuthenticated, user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && currentPage !== 'login' && currentPage !== 'qr') {
      hasCheckedAuthOnMount = false;
      navigate('login');
    }
  }, [isAuthenticated, isLoading, currentPage, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Navigation to login will happen in useEffect
  }

  return <>{children}</>;
}

