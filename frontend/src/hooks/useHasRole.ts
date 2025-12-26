import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';

type UserRole = User['role'];

/**
 * Hook to check if current user has one of the specified roles
 * @param roles - Array of roles to check
 * @returns boolean indicating if user has one of the roles
 */
export function useHasRole(roles: UserRole[]): boolean {
  const { user } = useAuthStore();

  if (!user) {
    return false;
  }

  return roles.includes(user.role);
}

/**
 * Hook to check if current user has a specific role
 * @param role - Role to check
 * @returns boolean indicating if user has the role
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  return useHasRole(roles);
}

/**
 * Hook to check if current user has admin/manager role
 */
export function useIsAdmin(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager']);
}

/**
 * Hook to check if current user can manage menu
 */
export function useCanManageMenu(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager']);
}

/**
 * Hook to check if current user can access inventory
 */
export function useCanAccessInventory(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager', 'inventory']);
}

/**
 * Hook to check if current user can access KDS
 */
export function useCanAccessKDS(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager', 'cook']);
}

/**
 * Hook to check if current user can access reports
 */
export function useCanAccessReports(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager']);
}

/**
 * Hook to check if current user can manage orders
 */
export function useCanManageOrders(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier']);
}

/**
 * Hook to check if current user can manage tables
 */
export function useCanManageTables(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager', 'waiter', 'server']);
}

/**
 * Hook to check if current user can access waiter features
 */
export function useCanAccessWaiterFeatures(): boolean {
  return useHasRole(['tenant_admin', 'admin', 'manager', 'waiter', 'server']);
}

