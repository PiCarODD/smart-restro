import apiClient, { getApiError } from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  pinCode?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role: string;
  pinCode?: string;
  assignedSections?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string; // Full name for user profile updates
  firstName?: string; // For admin operations (backward compatibility)
  lastName?: string; // For admin operations (backward compatibility)
  phone?: string;
  role?: string;
  pinCode?: string;
  isActive?: boolean;
  assignedSections?: string[];
}

export interface ChangePasswordRequest {
  currentPassword?: string; // Required when changing own password
  newPassword: string;
}

/**
 * Users API service
 */
export const usersApi = {
  /**
   * List users
   */
  list: async (params?: { role?: string; isActive?: boolean }): Promise<{ users: User[] }> => {
    try {
      const response = await apiClient.get<{ users: User[] }>('/users', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<{ user: User }> => {
    try {
      const response = await apiClient.get<{ user: User }>(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Create user
   */
  create: async (data: CreateUserRequest): Promise<{ user: User; message: string }> => {
    try {
      const response = await apiClient.post<{ user: User; message: string }>('/users', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Update user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<{ user: User; message: string }> => {
    try {
      const response = await apiClient.put<{ user: User; message: string }>(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Delete user
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Change user password
   */
  changePassword: async (id: string, data: ChangePasswordRequest): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put<{ message: string }>(`/users/${id}/password`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

