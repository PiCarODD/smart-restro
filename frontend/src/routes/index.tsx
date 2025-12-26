import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WaiterLayout } from '@/components/layout/WaiterLayout';
import { SaasAdminLayout } from '@/components/layout/SaasAdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MenuPage } from '@/pages/menu/MenuPage';
import { TablesPage } from '@/pages/tables/TablesPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage';
import { POSPage } from '@/pages/orders/POSPage';
import { KDSPage } from '@/pages/kds/KDSPage';
import { KDSStandalonePage } from '@/pages/kds/KDSStandalonePage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { WaiterLoginPage } from '@/pages/waiter/WaiterLoginPage';
import { WaiterTablesPage } from '@/pages/waiter/WaiterTablesPage';
import { WaiterPOSPage } from '@/pages/waiter/WaiterPOSPage';
import { WaiterOrdersPage } from '@/pages/waiter/WaiterOrdersPage';
import { WaiterNotificationsPage } from '@/pages/waiter/WaiterNotificationsPage';
import { WaiterProfilePage } from '@/pages/waiter/WaiterProfilePage';
// SaaS Admin
import { SaasDashboardPage } from '@/pages/saas-admin/SaasDashboardPage';
import { TenantsPage } from '@/pages/saas-admin/TenantsPage';
import { SaasPlaceholderPage } from '@/pages/saas-admin/SaasPlaceholderPage';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'orders/:orderId',
        element: <OrderDetailPage />,
      },
      {
        path: 'pos/:tableId',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier']}>
            <POSPage />
          </RoleGuard>
        ),
      },
      {
        path: 'tables',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server']}>
            <TablesPage />
          </RoleGuard>
        ),
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
      {
        path: 'kds',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'cook']}>
            <KDSPage />
          </RoleGuard>
        ),
      },
      {
        path: 'inventory',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'inventory']}>
            <InventoryPage />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
            <ReportsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  // Standalone KDS (for kitchen displays)
  {
    path: '/kds/fullscreen',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'cook']}>
          <KDSStandalonePage />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
  // Waiter App Routes (Mobile-optimized)
  {
    path: '/waiter/login',
    element: <WaiterLoginPage />,
  },
  {
    path: '/waiter',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server']}>
          <WaiterLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <WaiterTablesPage />,
      },
      {
        path: 'pos/:tableId',
        element: <WaiterPOSPage />,
      },
      {
        path: 'orders',
        element: <WaiterOrdersPage />,
      },
      {
        path: 'notifications',
        element: <WaiterNotificationsPage />,
      },
      {
        path: 'profile',
        element: <WaiterProfilePage />,
      },
    ],
  },
  // SaaS Admin Routes
  {
    path: '/saas-admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['super_admin']}>
          <SaasAdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SaasDashboardPage />,
      },
      {
        path: 'tenants',
        element: <TenantsPage />,
      },
      {
        path: 'users',
        element: <SaasPlaceholderPage />,
      },
      {
        path: 'subscriptions',
        element: <SaasPlaceholderPage />,
      },
      {
        path: 'settings',
        element: <SaasPlaceholderPage />,
      },
    ],
  },
]);

