import { useEffect } from 'react';
import { useNavigationStore } from '@/store/navigationStore';
import { useAuthStore } from '@/store/authStore';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SaasAdminLayout } from '@/components/layout/SaasAdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MenuPage } from '@/pages/menu/MenuPage';
import { TablesPage } from '@/pages/tables/TablesPage';
import { TableOrdersPage } from '@/pages/tables/TableOrdersPage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage';
import { POSPage } from '@/pages/orders/POSPage';
import { KDSPage } from '@/pages/kds/KDSPage';
import { KDSStandalonePage } from '@/pages/kds/KDSStandalonePage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SaasDashboardPage } from '@/pages/saas-admin/SaasDashboardPage';
import { TenantsPage } from '@/pages/saas-admin/TenantsPage';
import { SaasUsersPage } from '@/pages/saas-admin/SaasUsersPage';
import { SaasSubscriptionsPage } from '@/pages/saas-admin/SaasSubscriptionsPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { QRViewPage } from '@/pages/public/QRViewPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';

// Check QR code from URL on mount
function useQRCodeHandler() {
  const { navigate } = useNavigationStore();

  useEffect(() => {
    // Check for QR token in URL hash or query params
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    if (hash.startsWith('#qr-')) {
      const token = hash.substring(4); // Remove '#qr-'
      navigate('qr', { token });
    } else if (searchParams.has('qr')) {
      const token = searchParams.get('qr');
      if (token) {
        navigate('qr', { token });
      }
    }
  }, [navigate]);
}

export function Router() {
  const { currentPage, pageParams, navigate } = useNavigationStore();
  const { isAuthenticated } = useAuthStore();
  
  // Initialize default page on mount
  useEffect(() => {
    // If not authenticated and not already on login/qr, go to login
    if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'qr') {
      navigate('login');
    }
    // If authenticated and on login, go to dashboard
    else if (isAuthenticated && currentPage === 'login') {
      navigate('dashboard');
    }
    // If not authenticated and on a protected page, go to login
    else if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'qr' && 
             !['login', 'qr'].includes(currentPage)) {
      navigate('login');
    }
  }, [isAuthenticated, currentPage, navigate]);
  
  // Handle QR code from URL
  useQRCodeHandler();

  // Handle public QR route (no auth required)
  if (currentPage === 'qr') {
    return <QRViewPage />;
  }

  // Handle authentication pages
  if (currentPage === 'login') {
    if (isAuthenticated) {
      useNavigationStore.getState().navigate('dashboard');
      return null;
    }
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  }

  // Handle protected routes
  return (
    <ProtectedRoute>
      {renderPage(currentPage, pageParams)}
    </ProtectedRoute>
  );
}

function renderPage(page: string, _params: any) {
  switch (page) {
    // Dashboard Layout Pages
    case 'dashboard':
      return (
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      );

    case 'orders':
      return (
        <DashboardLayout>
          <OrdersPage />
        </DashboardLayout>
      );

    case 'orders.detail':
      return (
        <DashboardLayout>
          <OrderDetailPage />
        </DashboardLayout>
      );

    case 'pos':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier']}>
            <POSPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'tables':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server']}>
            <TablesPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'tables.orders':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier']}>
            <TableOrdersPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'menu':
      return (
        <DashboardLayout>
          <MenuPage />
        </DashboardLayout>
      );

    case 'kds':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'cook']}>
            <KDSPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'kds.fullscreen':
      return (
        <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'cook']}>
          <KDSStandalonePage />
        </RoleGuard>
      );

    case 'inventory':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager', 'inventory']}>
            <InventoryPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'reports':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
            <ReportsPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'settings':
      return (
        <DashboardLayout>
          <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
            <SettingsPage />
          </RoleGuard>
        </DashboardLayout>
      );

    case 'profile':
      return (
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      );

    // SaaS Admin Pages
    case 'saas.dashboard':
      return (
        <SaasAdminLayout>
          <RoleGuard allowedRoles={['super_admin']}>
            <SaasDashboardPage />
          </RoleGuard>
        </SaasAdminLayout>
      );

    case 'saas.tenants':
      return (
        <SaasAdminLayout>
          <RoleGuard allowedRoles={['super_admin']}>
            <TenantsPage />
          </RoleGuard>
        </SaasAdminLayout>
      );

    case 'saas.users':
      return (
        <SaasAdminLayout>
          <RoleGuard allowedRoles={['super_admin']}>
            <SaasUsersPage />
          </RoleGuard>
        </SaasAdminLayout>
      );

    case 'saas.subscriptions':
      return (
        <SaasAdminLayout>
          <RoleGuard allowedRoles={['super_admin']}>
            <SaasSubscriptionsPage />
          </RoleGuard>
        </SaasAdminLayout>
      );

    default:
      return (
        <DashboardLayout>
          <NotFoundPage />
        </DashboardLayout>
      );
  }
}
