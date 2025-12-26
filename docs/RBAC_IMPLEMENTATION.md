# Role-Based Access Control (RBAC) Implementation

This document describes the Role-Based Access Control (RBAC) implementation for both backend API and frontend UI.

## Overview

The system implements role-based access control at multiple levels:
1. **Backend API**: Route-level authorization middleware
2. **Frontend Routes**: Route guards based on user roles
3. **Frontend Components**: Component-level permission checks
4. **Navigation**: Menu items filtered by role

## User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `super_admin` | SaaS platform admin | Full system access (manages all tenants) |
| `tenant_admin` | Tenant owner | Full access to tenant's restaurants |
| `admin` | Restaurant admin | Full restaurant access |
| `manager` | Restaurant manager | Operational management |
| `cashier` | Cashier | Payment processing, order management |
| `waiter` | Waiter | Service staff - orders, tables |
| `server` | Server | Service staff - orders, tables |
| `cook` | Kitchen staff | KDS access, order item status |
| `inventory` | Inventory manager | Inventory management only |

## Backend RBAC Implementation

### Authentication Middleware

All protected routes require authentication via JWT token:

```javascript
// backend/src/middleware/auth.js
router.use(authMiddleware.authenticate);
```

### Authorization Middleware

Routes are protected with role-based authorization:

```javascript
// Example: Only admins/managers can access
router.get('/tables', 
  authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'),
  tableController.list
);
```

**Key Security Features**:
- `restaurantId` is **never** accepted from client - always extracted from JWT token
- Users can only access data for their restaurant
- Role checks happen before route handler execution

### Route Protection Examples

```javascript
// Admin/Manager only
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

// Multiple roles
router.get('/orders', 
  authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'),
  orderController.list
);

// Specific role (cook for KDS)
router.get('/kds/orders',
  authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'),
  kdsController.getOrders
);
```

## Frontend RBAC Implementation

### 1. ProtectedRoute Component

Ensures user is authenticated before accessing routes:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<ProtectedRoute>
  <DashboardLayout />
</ProtectedRoute>
```

**Behavior**:
- Redirects to `/login` if not authenticated
- Shows loading state while checking authentication
- Preserves intended destination for redirect after login

### 2. RoleGuard Component

Restricts route access based on user role:

```tsx
import { RoleGuard } from '@/components/auth/RoleGuard';

<RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
  <SettingsPage />
</RoleGuard>
```

**Behavior**:
- Checks if user has one of the allowed roles
- Redirects to fallback path (default: `/dashboard`) if access denied
- Must be used inside `ProtectedRoute`

### 3. CanAccess Component

Conditionally renders UI elements based on role:

```tsx
import { CanAccess } from '@/components/auth/CanAccess';

<CanAccess roles={['tenant_admin', 'admin', 'manager']}>
  <Button>Delete User</Button>
</CanAccess>
```

**Behavior**:
- Renders children only if user has required role
- Shows fallback (or nothing) if access denied
- Use for buttons, menu items, sections, etc.

### 4. useHasRole Hook

Programmatic role checking in components:

```tsx
import { useHasRole } from '@/hooks/useHasRole';

function MyComponent() {
  const canManageMenu = useHasRole(['tenant_admin', 'admin', 'manager']);
  const canAccessKDS = useHasRole(['tenant_admin', 'admin', 'manager', 'cook']);
  
  return (
    <>
      {canManageMenu && <Button>Edit Menu</Button>}
      {canAccessKDS && <Link to="/kds">Kitchen Display</Link>}
    </>
  );
}
```

### 5. Convenience Hooks

Pre-built hooks for common permission checks:

```tsx
import { 
  useIsAdmin, 
  useCanManageMenu, 
  useCanAccessKDS,
  useCanAccessReports,
  useCanManageOrders,
  useCanManageTables,
  useCanAccessInventory,
  useCanAccessWaiterFeatures
} from '@/hooks/useHasRole';

const isAdmin = useIsAdmin(); // tenant_admin, admin, manager
const canManageMenu = useCanManageMenu(); // tenant_admin, admin, manager
const canAccessKDS = useCanAccessKDS(); // tenant_admin, admin, manager, cook
```

## Route Protection Map

### Main Dashboard Routes

| Route | Allowed Roles | Guard Type |
|-------|---------------|------------|
| `/dashboard` | All authenticated | ProtectedRoute |
| `/orders` | All authenticated | ProtectedRoute |
| `/orders/:orderId` | All authenticated | ProtectedRoute |
| `/pos/:tableId` | `tenant_admin`, `admin`, `manager`, `waiter`, `server`, `cashier` | RoleGuard |
| `/tables` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |
| `/menu` | All authenticated | ProtectedRoute |
| `/kds` | `tenant_admin`, `admin`, `manager`, `cook` | RoleGuard |
| `/kds/fullscreen` | `tenant_admin`, `admin`, `manager`, `cook` | RoleGuard |
| `/inventory` | `tenant_admin`, `admin`, `manager`, `inventory` | RoleGuard |
| `/reports` | `tenant_admin`, `admin`, `manager` | RoleGuard |
| `/settings` | `tenant_admin`, `admin`, `manager` | RoleGuard |
| `/profile` | All authenticated | ProtectedRoute |

### Waiter App Routes

| Route | Allowed Roles | Guard Type |
|-------|---------------|------------|
| `/waiter/login` | Public | None |
| `/waiter` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |
| `/waiter/pos/:tableId` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |
| `/waiter/orders` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |
| `/waiter/notifications` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |
| `/waiter/profile` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | RoleGuard |

### SaaS Admin Routes

| Route | Allowed Roles | Guard Type |
|-------|---------------|------------|
| `/saas-admin` | `super_admin` | RoleGuard |
| `/saas-admin/tenants` | `super_admin` | RoleGuard |
| `/saas-admin/users` | `super_admin` | RoleGuard |
| `/saas-admin/subscriptions` | `super_admin` | RoleGuard |
| `/saas-admin/settings` | `super_admin` | RoleGuard |

## Navigation Filtering

The Sidebar component automatically filters navigation items based on user role:

```tsx
// Sidebar filters navigation items by role
const navigation = [
  {
    title: 'Reports',
    href: '/reports',
    roles: ['tenant_admin', 'admin', 'manager'], // Only these roles see this item
  },
  // ...
];

const filteredNavigation = navigation.filter(item => 
  isFeatureEnabled(item.feature) && hasRoleAccess(item.roles)
);
```

## Component-Level Access Control

### Example: Conditional Button Rendering

```tsx
import { CanAccess } from '@/components/auth/CanAccess';

function UserManagementPage() {
  return (
    <div>
      <h1>Users</h1>
      
      <CanAccess roles={['tenant_admin', 'admin', 'manager']}>
        <Button onClick={handleCreateUser}>Create User</Button>
      </CanAccess>
      
      <CanAccess roles={['tenant_admin', 'admin']}>
        <Button onClick={handleDeleteUser} variant="destructive">
          Delete User
        </Button>
      </CanAccess>
    </div>
  );
}
```

### Example: Conditional Section Rendering

```tsx
import { useHasRole } from '@/hooks/useHasRole';

function SettingsPage() {
  const canManageSettings = useHasRole(['tenant_admin', 'admin', 'manager']);
  const canManageUsers = useHasRole(['tenant_admin', 'admin', 'manager']);
  
  return (
    <div>
      {canManageSettings && (
        <Section title="General Settings">
          {/* Settings content */}
        </Section>
      )}
      
      {canManageUsers && (
        <Section title="User Management">
          {/* User management content */}
        </Section>
      )}
    </div>
  );
}
```

## API Endpoint Access

See `docs/API_ROLE_MAPPING.md` for complete API endpoint role mappings.

Key points:
- All endpoints require authentication (except `/api/auth/login`, `/api/auth/login/pin`, `/api/health`)
- Role checks are enforced at the route level
- `restaurantId` is never accepted from client - always from JWT token
- Waiter endpoints filter by `waiterId` from JWT token

## Security Best Practices

### Backend

1. **Never trust client input for `restaurantId`**: Always extract from JWT token
2. **Role validation**: Check roles before processing requests
3. **Data filtering**: Filter all queries by `restaurantId` from token
4. **Error messages**: Don't leak sensitive information in error responses

### Frontend

1. **Defense in depth**: Use both route guards and component-level checks
2. **Graceful degradation**: Hide UI elements rather than showing errors
3. **Loading states**: Show appropriate loading states during auth checks
4. **User feedback**: Redirect unauthorized users with clear feedback

## Testing RBAC

### Testing Backend Routes

```javascript
// Test that unauthorized role cannot access
const response = await request(app)
  .get('/api/settings')
  .set('Authorization', `Bearer ${cookToken}`)
  .expect(403);

// Test that authorized role can access
const response = await request(app)
  .get('/api/settings')
  .set('Authorization', `Bearer ${adminToken}`)
  .expect(200);
```

### Testing Frontend Routes

1. Login as different roles
2. Navigate to protected routes
3. Verify redirect behavior for unauthorized access
4. Verify navigation items are filtered correctly
5. Verify component-level elements are hidden/shown correctly

## Common Patterns

### Pattern 1: Admin-Only Actions

```tsx
<CanAccess roles={['tenant_admin', 'admin', 'manager']}>
  <Button onClick={handleDelete}>Delete</Button>
</CanAccess>
```

### Pattern 2: Multiple Roles with Different Permissions

```tsx
const canEdit = useHasRole(['tenant_admin', 'admin', 'manager']);
const canView = useHasRole(['tenant_admin', 'admin', 'manager', 'waiter', 'server']);

{canView && (
  <div>
    {canEdit && <Button>Edit</Button>}
    <Button>View</Button>
  </div>
)}
```

### Pattern 3: Route-Level Protection

```tsx
{
  path: '/settings',
  element: (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['tenant_admin', 'admin', 'manager']}>
        <SettingsPage />
      </RoleGuard>
    </ProtectedRoute>
  ),
}
```

## Migration Notes

### Removed Endpoints

The following endpoints have been removed (handled by administrators only):
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

These operations are now handled by administrators through:
- `POST /api/users` - Create new users
- `PUT /api/users/:id/password` - Change user password

## Troubleshooting

### Issue: User can access route but gets 403 from API

**Solution**: Check that backend route has correct role authorization. Frontend guards prevent navigation, but API will reject unauthorized requests.

### Issue: Navigation item shows but route is protected

**Solution**: Ensure navigation item has correct `roles` array matching route guard.

### Issue: Component shows but action fails

**Solution**: Add API-level role check. Frontend UI control is for UX, API enforcement is for security.

### Issue: Role check not working

**Solution**: 
1. Verify user role is correctly set in JWT token
2. Check that role name matches exactly (case-sensitive)
3. Ensure user is authenticated (token valid)
4. Verify role is in allowed roles array

## Related Documentation

- `docs/API_ROLE_MAPPING.md` - Complete API endpoint role mappings
- `backend/src/middleware/auth.js` - Authentication/Authorization middleware
- `frontend/src/components/auth/` - RBAC components
- `frontend/src/hooks/useHasRole.ts` - Role checking hooks

