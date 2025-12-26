import apiClient, { getApiError } from './client';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId?: string;
    restaurantId?: string;
    isActive: boolean;
  };
}

export interface PinLoginRequest {
  identifier: string; // email or phone
  pin: string;
  // restaurantId removed - backend extracts from user record for security
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Login with PIN (for waiters)
   */
  loginWithPin: async (data: PinLoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/pin', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get current user info
   */
  me: async (): Promise<LoginResponse['user']> => {
    try {
      const response = await apiClient.get<{ user: LoginResponse['user'] }>('/auth/me');
      return response.data.user;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

