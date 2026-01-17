import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - defaults to backend running on port 3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies if using httpOnly cookies
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    // Skip auth for public endpoints
    if (config.skipAuth) {
      return config;
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle token refresh and errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('auth_token', token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage'); // Clear Zustand persisted state
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Error type
 */
export interface ApiError {
  message: string;
  errors?: Array<{ field: string; message: string }>;
  details?: Array<{ field: string; message: string }>;
  status?: number;
}

/**
 * Extract error message from API response
 */
export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (response?.data) {
      // Normalize error response format
      const details = response.data.details || response.data.errors || [];
      
      // Map common error codes to user-friendly messages
      let message = response.data.message || response.data.error || 'An error occurred';
      
      // Enhance messages based on status codes
      if (!response.data.message && !response.data.error) {
        switch (response.status) {
          case 400:
            message = 'Please check your input and try again';
            break;
          case 401:
            message = 'Your session has expired. Please log in again';
            break;
          case 403:
            message = 'You do not have permission to perform this action';
            break;
          case 404:
            message = 'The requested resource was not found';
            break;
          case 409:
            message = 'This record already exists';
            break;
          case 422:
            message = 'Validation error. Please check the form';
            break;
          case 500:
            message = 'An unexpected server error occurred. Please try again later';
            break;
          default:
            message = 'An error occurred';
        }
      }
      
      return {
        message,
        errors: Array.isArray(details) ? details : [],
        details: Array.isArray(details) ? details : [],
        status: response.status,
      };
    }
    return {
      message: error.message || 'Network error occurred',
      status: error.response?.status,
    };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  return { message: 'An unexpected error occurred' };
};

export default apiClient;

