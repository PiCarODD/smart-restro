import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigationStore } from '@/store/navigationStore';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const { navigate } = useNavigationStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

