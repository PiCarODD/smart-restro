import apiClient from './client';
import { User, Tenant } from '@/types';

export interface SaasStats {
    totalTenants: number;
    totalRevenue: number;
    activeSubscriptions: number;
}

export interface TenantListResponse {
    tenants: Tenant[];
    total: number;
    page: number;
    limit: number;
}

export interface UserListResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
}

export interface SaasStatsData {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    totalRestaurants: number;
    totalUsers: number;
    monthlyRevenue: number;
    byTier: {
        starter: number;
        professional: number;
        enterprise: number;
    };
    byStatus: {
        active: number;
        trial: number;
        past_due: number;
        cancelled: number;
    };
}

export interface BulkOperationRequest {
    tenantIds?: string[];
    userIds?: string[];
    action: string;
    value: string | boolean;
}

export interface BulkOperationResponse {
    updated?: number;
    deleted?: number;
    tenantIds?: string[];
    userIds?: string[];
    message: string;
}

export interface ExportQueryParams {
    format?: 'csv' | 'pdf';
    startDate?: string;
    endDate?: string;
    status?: string;
    tier?: string;
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    columns?: string[];
}

export interface SubscriptionHistoryEntry {
    id: string;
    tenantId: string;
    action: string;
    previousValue: string;
    newValue: string;
    timestamp: string;
    performedBy: string;
}

export interface SubscriptionHistoryResponse {
    history: SubscriptionHistoryEntry[];
}

export interface UserLimitInfo {
    tenantId: string;
    currentUserCount: number;
    baseIncludedUsers: number;
    extraUsersAllowed: number;
    totalAllowed: number;
    actualExtraUsers: number;
    extraUserMonthlyRate: number;
    monthlyCharge: number;
    canCreateMore: boolean;
    remainingSlots: number;
}

export interface UserBillingRecord {
    id: string;
    tenantId: string;
    billingMonth: string;
    extraUsersCount: number;
    ratePerUser: number;
    totalAmount: number;
    billedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserLimitRequest {
    baseIncludedUsers?: number;
    extraUserMonthlyRate?: number;
}

export interface TenantQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    tier?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface UserQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
}

export interface CreateTenantRequest {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    password: string;
    subscriptionTier?: 'starter' | 'professional' | 'enterprise';
    phone?: string;
    billingEmail?: string;
}

export interface UpdateTenantRequest {
    name?: string;
    ownerEmail?: string;
    phone?: string;
    billingEmail?: string;
}

export interface UpdateSubscriptionRequest {
    subscriptionTier?: 'starter' | 'professional' | 'enterprise';
    status?: 'active' | 'trial' | 'past_due' | 'cancelled';
}

export interface UpdateSaasUserRequest {
    isActive?: boolean;
    role?: string;
    tenantId?: string;
    restaurantId?: string | null;
}

export const saasApi = {
    // Tenants
    getTenants: async (params?: TenantQueryParams) => {
        const response = await apiClient.get<TenantListResponse>('/saas/tenants', { params });
        return response.data;
    },

    getTenant: async (id: string, includeDetails?: boolean) => {
        const response = await apiClient.get<{ tenant: Tenant }>(`/saas/tenants/${id}`, {
            params: includeDetails ? { includeDetails: 'true' } : {}
        });
        return response.data.tenant;
    },

    getTenantAdmin: async (id: string) => {
        const response = await apiClient.get<{ userId: string; email: string; name: string }>(`/saas/tenants/${id}/admin`);
        return response.data;
    },

    createTenant: async (data: CreateTenantRequest) => {
        const response = await apiClient.post<{ tenant: Tenant; user: any; message: string }>('/saas/tenants', data);
        return response.data;
    },

    updateTenant: async (id: string, data: UpdateTenantRequest) => {
        const response = await apiClient.put<{ tenant: Tenant; message: string }>(`/saas/tenants/${id}`, data);
        return response.data;
    },

    deleteTenant: async (id: string) => {
        const response = await apiClient.delete<{ message: string }>(`/saas/tenants/${id}`);
        return response.data;
    },

    getTenantStats: async (id: string) => {
        const response = await apiClient.get(`/saas/tenants/${id}/stats`);
        return response.data;
    },

    // Bulk tenant operations
    bulkTenantOperation: async (data: BulkOperationRequest) => {
        const response = await apiClient.post<BulkOperationResponse>('/saas/tenants/bulk', data);
        return response.data;
    },

    // Users
    getUsers: async (params?: UserQueryParams) => {
        const response = await apiClient.get<UserListResponse>('/saas/users', { params });
        return response.data;
    },

    getUser: async (id: string) => {
        const response = await apiClient.get<{ user: User }>(`/saas/users/${id}`);
        return response.data.user;
    },

    updateUser: async (userId: string, data: UpdateSaasUserRequest) => {
        const response = await apiClient.put<{ user: User; message: string }>(`/saas/users/${userId}`, data);
        return response.data;
    },

    // Bulk user operations
    bulkUserOperation: async (data: BulkOperationRequest) => {
        const response = await apiClient.post<BulkOperationResponse>('/saas/users/bulk', data);
        return response.data;
    },

    // Subscriptions
    updateSubscription: async (tenantId: string, subscriptionTier: string, status?: string) => {
        const response = await apiClient.put<{ tenant: Tenant; message: string }>(
            `/saas/tenants/${tenantId}/subscription`,
            { subscriptionTier, status }
        );
        return response.data;
    },

    bulkSubscriptionOperation: async (data: BulkOperationRequest) => {
        const response = await apiClient.post<BulkOperationResponse>('/saas/subscriptions/bulk', data);
        return response.data;
    },

    getSubscriptionHistory: async (tenantId: string, limit?: number) => {
        const response = await apiClient.get<SubscriptionHistoryResponse>('/saas/subscriptions/history', {
            params: { tenantId, limit }
        });
        return response.data;
    },

    // Stats & Analytics
    getStats: async () => {
        const response = await apiClient.get<SaasStatsData>('/saas/stats');
        return response.data;
    },

    getAnalytics: async () => {
        const response = await apiClient.get('/saas/analytics');
        return response.data;
    },

    // Export
    exportTenants: async (params?: ExportQueryParams) => {
        const response = await apiClient.get('/saas/export/tenants', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    exportUsers: async (params?: ExportQueryParams) => {
        const response = await apiClient.get('/saas/export/users', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    // User Limits
    getUserLimits: async (tenantId: string) => {
        const response = await apiClient.get<{ limitInfo: UserLimitInfo }>(`/saas/tenants/${tenantId}/user-limits`);
        return response.data.limitInfo;
    },

    updateUserLimits: async (tenantId: string, data: UpdateUserLimitRequest) => {
        const response = await apiClient.put<{ limitInfo: UserLimitInfo; message: string }>(
            `/saas/tenants/${tenantId}/user-limits`,
            data
        );
        return response.data;
    },

    getUserBilling: async (tenantId: string, limit?: number) => {
        const response = await apiClient.get<{ billingHistory: UserBillingRecord[] }>(
            `/saas/tenants/${tenantId}/user-billing`,
            { params: { limit } }
        );
        return response.data.billingHistory;
    }
};
