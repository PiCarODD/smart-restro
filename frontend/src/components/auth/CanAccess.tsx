import { useHasRole } from '@/hooks/useHasRole';
import { User } from '@/types';

type UserRole = User['role'];

interface CanAccessProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component-level role guard - conditionally renders children based on user role
 * Use this for showing/hiding UI elements based on permissions
 */
export function CanAccess({ children, roles, fallback = null }: CanAccessProps) {
  const hasRole = useHasRole(roles);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

