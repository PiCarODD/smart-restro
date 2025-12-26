# Performance Fix: Excessive `/api/auth/me` Requests

## Problem

The app was making excessive requests to `/api/auth/me` endpoint, causing performance issues and unnecessary server load.

## Root Cause

1. **DashboardLayout** was calling `checkAuth()` in a `useEffect` with `checkAuth` in the dependency array
2. Since Zustand functions can be recreated, this caused the effect to run repeatedly
3. Multiple `ProtectedRoute` instances could each trigger auth checks
4. No guards to prevent duplicate simultaneous calls

## Solution

### 1. Removed Redundant Auth Check from DashboardLayout

**Before:**
```tsx
useEffect(() => {
  checkAuth().then(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadRestaurant();
    }
  });
}, [navigate, loadRestaurant, checkAuth]);
```

**After:**
```tsx
// Only load restaurant data when authenticated
useEffect(() => {
  if (isAuthenticated && user && !hasLoadedRestaurant.current) {
    hasLoadedRestaurant.current = true;
    loadRestaurant();
  }
}, [isAuthenticated, user, loadRestaurant]);
```

**Rationale**: `ProtectedRoute` already handles authentication checking, so `DashboardLayout` doesn't need to check again.

### 2. Added Guards to `checkAuth` Function

**Before:**
```tsx
checkAuth: async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    set({ isAuthenticated: false, user: null });
    return;
  }
  set({ isLoading: true });
  // ... API call
}
```

**After:**
```tsx
checkAuth: async () => {
  // Don't check if already authenticated and user exists
  const currentState = get();
  if (currentState.isAuthenticated && currentState.user) {
    return;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    set({ isAuthenticated: false, user: null, isLoading: false });
    return;
  }

  // Don't check if already loading to prevent multiple simultaneous calls
  if (currentState.isLoading) {
    return;
  }

  set({ isLoading: true });
  // ... API call
}
```

**Rationale**: Prevents unnecessary API calls when:
- User is already authenticated
- Auth check is already in progress
- No token exists

### 3. Optimized ProtectedRoute Component

**Before:**
```tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  // No auth check - relies on persisted state only
}
```

**After:**
```tsx
// Global flag to ensure checkAuth is only called once
let hasCheckedAuthOnMount = false;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuthOnMount && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      const token = localStorage.getItem('auth_token');
      
      // Only call API if we have a token but user is not authenticated
      if (token && !isAuthenticated && !user) {
        hasCheckedAuthOnMount = true;
        checkAuth();
      } else if (!token) {
        hasCheckedAuthOnMount = true;
      }
    }
  }, [checkAuth, isAuthenticated, user]);
  // ...
}
```

**Rationale**:
- Uses a global flag to ensure auth check happens only once across all `ProtectedRoute` instances
- Only calls API if we have a token but no authenticated user (persisted state handles most cases)
- Resets flag when not authenticated to allow re-check after login

## Benefits

1. **Reduced API Calls**: `/api/auth/me` is now called at most once per app session
2. **Better Performance**: No unnecessary network requests
3. **Proper State Management**: Leverages Zustand persist to restore auth state
4. **Idempotent**: `checkAuth` can be called multiple times safely without duplicate API calls

## Testing

1. **Initial Load**: Verify `/api/auth/me` is called only once when app loads
2. **Route Navigation**: Verify no additional calls when navigating between routes
3. **Multiple Protected Routes**: Verify only one auth check occurs even with multiple `ProtectedRoute` instances
4. **Logout/Login**: Verify auth check works correctly after logout and login

## Related Files

- `frontend/src/store/authStore.ts` - Added guards to `checkAuth`
- `frontend/src/components/layout/DashboardLayout.tsx` - Removed redundant `checkAuth` call
- `frontend/src/components/auth/ProtectedRoute.tsx` - Optimized to call `checkAuth` once per session

