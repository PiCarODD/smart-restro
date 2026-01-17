import { create } from 'zustand';
import { Tenant, User } from '@/types';
import { saasApi, UserLimitInfo, UserBillingRecord, UpdateUserLimitRequest } from '@/lib/api';

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface BulkOperationState {
    selectedIds: string[];
    isProcessing: boolean;
    lastOperation: {
        type: string;
        success: boolean;
        message: string;
        affected: number;
    } | null;
}

interface LoadingStates {
    tenants: boolean;
    users: boolean;
    stats: boolean;
    tenantDetails: boolean;
    bulkOperation: boolean;
    export: boolean;
}

interface ErrorState {
    message: string | null;
    type: 'network' | 'validation' | 'server' | 'unknown' | null;
    details?: any;
}

interface SaasStore {
    // Data
    tenants: Tenant[];
    users: User[];
    stats: any | null;
    tenantDetails: Tenant | null;
    userLimits: Record<string, UserLimitInfo>; // tenantId -> UserLimitInfo
    billingHistory: Record<string, UserBillingRecord[]>; // tenantId -> UserBillingRecord[]

    // Pagination
    tenantsPagination: PaginationData | null;
    usersPagination: PaginationData | null;

    // Loading states
    loading: LoadingStates;

    // Error handling
    error: ErrorState;

    // Bulk operation state
    bulkOperation: BulkOperationState;

    // Actions - Tenants
    fetchTenants: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        tier?: string;
        sortBy?: string;
        sortOrder?: string;
    }) => Promise<void>;
    fetchTenantDetails: (id: string) => Promise<Tenant | null>;
    createTenant: (data: any) => Promise<void>;
    updateTenant: (id: string, data: Partial<Tenant>) => Promise<void>;
    deleteTenant: (id: string) => Promise<void>;
    updateSubscription: (tenantId: string, tier: string) => Promise<void>;

    // Bulk tenant operations
    bulkUpdateTenantStatus: (tenantIds: string[], status: string) => Promise<void>;
    bulkUpdateTenantTier: (tenantIds: string[], tier: string) => Promise<void>;
    bulkDeleteTenants: (tenantIds: string[], softDelete?: boolean) => Promise<void>;

    // Actions - Users
    fetchUsers: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        tenantId?: string;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: string;
    }) => Promise<void>;
    updateUserStatus: (userId: string, isActive: boolean) => Promise<void>;
    updateUser: (userId: string, data: Partial<User>) => Promise<void>;

    // Bulk user operations
    bulkUpdateUserStatus: (userIds: string[], isActive: boolean) => Promise<void>;
    bulkAssignUserRole: (userIds: string[], role: string) => Promise<void>;
    bulkDeleteUsers: (userIds: string[], softDelete?: boolean) => Promise<void>;

    // Actions - Stats
    fetchStats: () => Promise<void>;

    // Actions - User Limits
    fetchUserLimits: (tenantId: string) => Promise<UserLimitInfo | null>;
    updateUserLimits: (tenantId: string, data: UpdateUserLimitRequest) => Promise<void>;
    fetchUserBilling: (tenantId: string, limit?: number) => Promise<void>;

    // Bulk selection management
    setSelectedIds: (ids: string[]) => void;
    clearSelection: () => void;
    toggleSelection: (id: string) => void;
    selectAll: (ids: string[]) => void;

    // Error management
    clearError: () => void;
    setError: (error: ErrorState) => void;

    // Optimistic updates helpers
    applyOptimisticUpdate: <T extends { id: string }>(
        collection: T[],
        id: string,
        updates: Partial<T>
    ) => T[];
    rollbackOptimisticUpdate: <T extends { id: string }>(
        collection: T[],
        id: string,
        original: T
    ) => T[];
}

export const useSaasStore = create<SaasStore>((set, get) => ({
    // Initial state
    tenants: [],
    users: [],
    stats: null,
    tenantDetails: null,
    userLimits: {},
    billingHistory: {},
    tenantsPagination: null,
    usersPagination: null,
    loading: {
        tenants: false,
        users: false,
        stats: false,
        tenantDetails: false,
        bulkOperation: false,
        export: false
    },
    error: {
        message: null,
        type: null
    },
    bulkOperation: {
        selectedIds: [],
        isProcessing: false,
        lastOperation: null
    },

    // Tenants actions
    fetchTenants: async (params = {}) => {
        set({ loading: { ...get().loading, tenants: true }, error: { message: null, type: null } });
        try {
            const data = await saasApi.getTenants(params);
            set({
                tenants: data.tenants,
                tenantsPagination: {
                    total: data.total,
                    page: data.page,
                    limit: data.limit,
                    totalPages: Math.ceil(data.total / data.limit)
                },
                loading: { ...get().loading, tenants: false }
            });
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch tenants',
                    type: 'network',
                    details: error?.response?.data
                },
                loading: { ...get().loading, tenants: false }
            });
            throw error;
        }
    },

    fetchTenantDetails: async (id: string) => {
        set({ loading: { ...get().loading, tenantDetails: true }, error: { message: null, type: null } });
        try {
            const tenant = await saasApi.getTenant(id);
            set({
                tenantDetails: tenant,
                loading: { ...get().loading, tenantDetails: false }
            });
            return tenant;
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch tenant details',
                    type: 'network',
                    details: error?.response?.data
                },
                loading: { ...get().loading, tenantDetails: false }
            });
            return null;
        }
    },

    createTenant: async (data: any) => {
        set({ loading: { ...get().loading, tenants: true }, error: { message: null, type: null } });
        try {
            const result = await saasApi.createTenant(data);
            // Optimistic update
            set((state) => ({
                tenants: [result.tenant, ...state.tenants],
                tenantsPagination: state.tenantsPagination
                    ? {
                          ...state.tenantsPagination,
                          total: state.tenantsPagination.total + 1
                      }
                    : null,
                loading: { ...state.loading, tenants: false }
            }));
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to create tenant',
                    type: 'validation',
                    details: error?.response?.data?.details
                },
                loading: { ...get().loading, tenants: false }
            });
            throw error;
        }
    },

    updateTenant: async (id: string, data: Partial<Tenant>) => {
        const originalTenants = [...get().tenants];
        const originalTenant = originalTenants.find(t => t.id === id);
        
        // Optimistic update
        const optimisticTenants = get().applyOptimisticUpdate(originalTenants, id, data);
        set({ tenants: optimisticTenants, error: { message: null, type: null } });

        try {
            await saasApi.updateTenant(id, data);
            // Refresh from server to get latest data
            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });
        } catch (error: any) {
            // Rollback on error
            if (originalTenant) {
                set({ tenants: get().rollbackOptimisticUpdate(originalTenants, id, originalTenant) });
            }
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to update tenant',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    deleteTenant: async (id: string) => {
        const originalTenants = [...get().tenants];
        
        // Optimistic update
        set({ tenants: originalTenants.filter(t => t.id !== id) });

        try {
            await saasApi.deleteTenant(id);
            // Refresh list
            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });
        } catch (error: any) {
            // Rollback on error
            set({ tenants: originalTenants });
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to delete tenant',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    updateSubscription: async (tenantId: string, tier: string) => {
        const originalTenants = [...get().tenants];
        const originalTenant = originalTenants.find(t => t.id === tenantId);
        
        // Optimistic update
        const optimisticTenants = get().applyOptimisticUpdate(originalTenants, tenantId, {
            subscriptionTier: tier as any
        });
        set({ tenants: optimisticTenants, error: { message: null, type: null } });

        try {
            await saasApi.updateSubscription(tenantId, tier);
            // Refresh from server
            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });
        } catch (error: any) {
            // Rollback on error
            if (originalTenant) {
                set({ tenants: get().rollbackOptimisticUpdate(originalTenants, tenantId, originalTenant) });
            }
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to update subscription',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    // Bulk tenant operations
    bulkUpdateTenantStatus: async (tenantIds: string[], status: string) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkTenantOperation({
                tenantIds,
                action: 'updateStatus',
                value: status
            });

            // Refresh tenants list
            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateStatus',
                        success: true,
                        message: `Successfully updated ${result.updated} tenant(s)`,
                        affected: result.updated || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateStatus',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk operation failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk operation failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    bulkUpdateTenantTier: async (tenantIds: string[], tier: string) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkTenantOperation({
                tenantIds,
                action: 'updateTier',
                value: tier
            });

            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateTier',
                        success: true,
                        message: `Successfully updated ${result.updated} tenant(s)`,
                        affected: result.updated || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateTier',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk operation failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk operation failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    bulkDeleteTenants: async (tenantIds: string[], softDelete = true) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkTenantOperation({
                tenantIds,
                action: 'delete',
                value: softDelete
            });

            await get().fetchTenants({ page: get().tenantsPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'delete',
                        success: true,
                        message: `Successfully deleted ${result.deleted} tenant(s)`,
                        affected: result.deleted || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'delete',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk delete failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk delete failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    // Users actions
    fetchUsers: async (params = {}) => {
        set({ loading: { ...get().loading, users: true }, error: { message: null, type: null } });
        try {
            const data = await saasApi.getUsers(params);
            set({
                users: data.users,
                usersPagination: {
                    total: data.total,
                    page: data.page,
                    limit: data.limit,
                    totalPages: Math.ceil(data.total / data.limit)
                },
                loading: { ...get().loading, users: false }
            });
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch users',
                    type: 'network',
                    details: error?.response?.data
                },
                loading: { ...get().loading, users: false }
            });
            throw error;
        }
    },

    updateUserStatus: async (userId: string, isActive: boolean) => {
        const originalUsers = [...get().users];
        const originalUser = originalUsers.find(u => u.id === userId);
        
        // Optimistic update
        const optimisticUsers = get().applyOptimisticUpdate(originalUsers, userId, { isActive } as Partial<User>);
        set({ users: optimisticUsers, error: { message: null, type: null } });

        try {
            await saasApi.updateUser(userId, { isActive });
            // Refresh from server
            await get().fetchUsers({ page: get().usersPagination?.page || 1 });
        } catch (error: any) {
            // Rollback on error
            if (originalUser) {
                set({ users: get().rollbackOptimisticUpdate(originalUsers, userId, originalUser) });
            }
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to update user',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    updateUser: async (userId: string, data: Partial<User>) => {
        const originalUsers = [...get().users];
        const originalUser = originalUsers.find(u => u.id === userId);
        
        // Optimistic update
        const optimisticUsers = get().applyOptimisticUpdate(originalUsers, userId, data);
        set({ users: optimisticUsers, error: { message: null, type: null } });

        try {
            await saasApi.updateUser(userId, data);
            await get().fetchUsers({ page: get().usersPagination?.page || 1 });
        } catch (error: any) {
            // Rollback on error
            if (originalUser) {
                set({ users: get().rollbackOptimisticUpdate(originalUsers, userId, originalUser) });
            }
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to update user',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    // Bulk user operations
    bulkUpdateUserStatus: async (userIds: string[], isActive: boolean) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkUserOperation({
                userIds,
                action: 'updateStatus',
                value: isActive
            });

            await get().fetchUsers({ page: get().usersPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateStatus',
                        success: true,
                        message: `Successfully updated ${result.updated} user(s)`,
                        affected: result.updated || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'updateStatus',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk operation failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk operation failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    bulkAssignUserRole: async (userIds: string[], role: string) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkUserOperation({
                userIds,
                action: 'assignRole',
                value: role
            });

            await get().fetchUsers({ page: get().usersPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'assignRole',
                        success: true,
                        message: `Successfully updated ${result.updated} user(s)`,
                        affected: result.updated || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'assignRole',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk operation failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk operation failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    bulkDeleteUsers: async (userIds: string[], softDelete = true) => {
        set({
            bulkOperation: { ...get().bulkOperation, isProcessing: true },
            loading: { ...get().loading, bulkOperation: true },
            error: { message: null, type: null }
        });

        try {
            const result = await saasApi.bulkUserOperation({
                userIds,
                action: 'delete',
                value: softDelete
            });

            await get().fetchUsers({ page: get().usersPagination?.page || 1 });

            set({
                bulkOperation: {
                    selectedIds: [],
                    isProcessing: false,
                    lastOperation: {
                        type: 'delete',
                        success: true,
                        message: `Successfully deleted ${result.deleted} user(s)`,
                        affected: result.deleted || 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false }
            });
        } catch (error: any) {
            set({
                bulkOperation: {
                    ...get().bulkOperation,
                    isProcessing: false,
                    lastOperation: {
                        type: 'delete',
                        success: false,
                        message: error?.response?.data?.message || 'Bulk delete failed',
                        affected: 0
                    }
                },
                loading: { ...get().loading, bulkOperation: false },
                error: {
                    message: error?.response?.data?.message || error?.message || 'Bulk delete failed',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    // Stats
    fetchStats: async () => {
        set({ loading: { ...get().loading, stats: true }, error: { message: null, type: null } });
        try {
            const stats = await saasApi.getStats();
            set({
                stats,
                loading: { ...get().loading, stats: false }
            });
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch stats',
                    type: 'network',
                    details: error?.response?.data
                },
                loading: { ...get().loading, stats: false }
            });
        }
    },

    // Bulk selection management
    setSelectedIds: (ids: string[]) => {
        set({ bulkOperation: { ...get().bulkOperation, selectedIds: ids } });
    },

    clearSelection: () => {
        set({ bulkOperation: { ...get().bulkOperation, selectedIds: [] } });
    },

    toggleSelection: (id: string) => {
        const current = get().bulkOperation.selectedIds;
        const newSelection = current.includes(id)
            ? current.filter(i => i !== id)
            : [...current, id];
        set({ bulkOperation: { ...get().bulkOperation, selectedIds: newSelection } });
    },

    selectAll: (ids: string[]) => {
        set({ bulkOperation: { ...get().bulkOperation, selectedIds: ids } });
    },

    // User Limits
    fetchUserLimits: async (tenantId: string) => {
        try {
            const limitInfo = await saasApi.getUserLimits(tenantId);
            set((state) => ({
                userLimits: {
                    ...state.userLimits,
                    [tenantId]: limitInfo
                }
            }));
            return limitInfo;
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch user limits',
                    type: 'network',
                    details: error?.response?.data
                }
            });
            return null;
        }
    },

    updateUserLimits: async (tenantId: string, data: UpdateUserLimitRequest) => {
        try {
            const result = await saasApi.updateUserLimits(tenantId, data);
            set((state) => ({
                userLimits: {
                    ...state.userLimits,
                    [tenantId]: result.limitInfo
                }
            }));
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to update user limits',
                    type: 'server',
                    details: error?.response?.data
                }
            });
            throw error;
        }
    },

    fetchUserBilling: async (tenantId: string, limit = 12) => {
        try {
            const billingHistory = await saasApi.getUserBilling(tenantId, limit);
            set((state) => ({
                billingHistory: {
                    ...state.billingHistory,
                    [tenantId]: billingHistory
                }
            }));
        } catch (error: any) {
            set({
                error: {
                    message: error?.response?.data?.message || error?.message || 'Failed to fetch billing history',
                    type: 'network',
                    details: error?.response?.data
                }
            });
        }
    },

    // Error management
    clearError: () => {
        set({ error: { message: null, type: null } });
    },

    setError: (error: ErrorState) => {
        set({ error });
    },

    // Optimistic update helpers
    applyOptimisticUpdate: <T extends { id: string }>(
        collection: T[],
        id: string,
        updates: Partial<T>
    ): T[] => {
        return collection.map(item => (item.id === id ? { ...item, ...updates } : item));
    },

    rollbackOptimisticUpdate: <T extends { id: string }>(
        collection: T[],
        id: string,
        original: T
    ): T[] => {
        return collection.map(item => (item.id === id ? original : item));
    }
}));
