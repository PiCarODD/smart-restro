import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WaiterLayout } from '@/components/layout/WaiterLayout';
import { SaasAdminLayout } from '@/components/layout/SaasAdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
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
    element: <DashboardLayout />,
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
        element: <POSPage />,
      },
      {
        path: 'tables',
        element: <TablesPage />,
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
      {
        path: 'kds',
        element: <KDSPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
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
    element: <KDSStandalonePage />,
  },
  // Waiter App Routes (Mobile-optimized)
  {
    path: '/waiter/login',
    element: <WaiterLoginPage />,
  },
  {
    path: '/waiter',
    element: <WaiterLayout />,
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
    element: <SaasAdminLayout />,
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

