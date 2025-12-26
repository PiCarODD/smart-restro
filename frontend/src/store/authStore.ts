import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials } from '@/types';
import { authApi, getApiError } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<boolean>;
  waiterLogin: (identifier: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe || false,
          });
          
          // Store token
          localStorage.setItem('auth_token', response.token);
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
          
          // Map API user to app User type
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            name: `${response.user.firstName} ${response.user.lastName}`,
            role: response.user.role as User['role'],
            tenantId: response.user.tenantId,
            restaurantId: response.user.restaurantId,
            isActive: response.user.isActive,
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return true;
        } catch (error) {
          const apiError = getApiError(error);
          set({ 
            error: apiError.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          return false;
        }
      },

      waiterLogin: async (identifier: string, pin: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.loginWithPin({
            identifier,
            pin,
            // restaurantId removed - backend extracts from user record for security
          });
          
          // Store token
          localStorage.setItem('auth_token', response.token);
          if (response.refreshToken) {
            localStorage.setItem('refresh_token', response.refreshToken);
          }
          
          // Map API user to app User type
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            name: `${response.user.firstName} ${response.user.lastName}`,
            role: response.user.role as User['role'],
            tenantId: response.user.tenantId,
            restaurantId: response.user.restaurantId,
            isActive: response.user.isActive,
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return true;
        } catch (error) {
          const apiError = getApiError(error);
          set({ 
            error: apiError.message || 'Invalid PIN', 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Disconnect socket on logout
          disconnectSocket();
          
          // Clear remembered credentials on logout (user must explicitly check remember me again)
          // Note: We keep the credentials in localStorage if remember_me was true,
          // so they persist across browser sessions. Only clear on explicit logout if desired.
          // For now, we'll keep them unless the user unchecks "remember me"
          
          // Always clear state even if API call fails
          set({ 
            user: null, 
            isAuthenticated: false,
            error: null 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

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
        try {
          const userData = await authApi.me();
          
          const user: User = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role as User['role'],
            tenantId: userData.tenantId,
            restaurantId: userData.restaurantId,
            isActive: userData.isActive,
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          set({ 
            isAuthenticated: false, 
            user: null, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

