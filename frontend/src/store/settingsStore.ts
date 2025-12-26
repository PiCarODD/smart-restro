import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { restaurantApi, taxesApi, featuresApi, tenantApi, getApiError } from '@/lib/api';
import type { Restaurant as ApiRestaurant } from '@/lib/api/restaurantApi';
import type { Tax as ApiTax } from '@/lib/api/taxesApi';
import type { FeatureToggle as ApiFeatureToggle } from '@/lib/api/featuresApi';
import { useRestaurantStore } from './restaurantStore';

export interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'kitchen' | 'ordering' | 'inventory' | 'payments' | 'general';
  requiresPlan?: 'starter' | 'professional' | 'enterprise';
  config?: Record<string, any>;
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  enabled: boolean;
  appliesTo: 'all' | 'food' | 'beverages' | 'alcohol';
}

export interface RestaurantInfo {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  logo?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'receipt' | 'kitchen' | 'label';
  ipAddress: string;
  enabled: boolean;
}

interface SettingsStore {
  // Restaurant Info
  restaurantInfo: RestaurantInfo | null;
  isLoadingRestaurant: boolean;
  loadRestaurant: () => Promise<void>;
  updateRestaurantInfo: (info: Partial<RestaurantInfo>) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  
  // Feature Toggles
  features: FeatureToggle[];
  isLoadingFeatures: boolean;
  loadFeatures: () => Promise<void>;
  toggleFeature: (featureKey: string) => Promise<void>;
  updateFeatureConfig: (featureKey: string, config: Record<string, any>) => Promise<void>;
  isFeatureEnabled: (featureKey: string) => boolean;
  
  // Tax Configuration
  taxes: TaxConfig[];
  isLoadingTaxes: boolean;
  loadTaxes: () => Promise<void>;
  addTax: (tax: Omit<TaxConfig, 'id'>) => Promise<void>;
  updateTax: (id: string, updates: Partial<TaxConfig>) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  
  // Printers (local only, no backend API yet)
  printers: PrinterConfig[];
  addPrinter: (printer: Omit<PrinterConfig, 'id'>) => void;
  updatePrinter: (id: string, updates: Partial<PrinterConfig>) => void;
  deletePrinter: (id: string) => void;
  
  // Theme (local only)
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  kdsTheme: 'light' | 'dark';
  setKdsTheme: (theme: 'light' | 'dark') => void;
  
  // Current Plan (for feature gating)
  currentPlan: 'starter' | 'professional' | 'enterprise';
  updateSubscriptionTier: (tier: 'starter' | 'professional' | 'enterprise') => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// Store subscription tier from restaurant
let currentSubscriptionTier: 'starter' | 'professional' | 'enterprise' = 'professional';

export function getSubscriptionTier(): 'starter' | 'professional' | 'enterprise' {
  return currentSubscriptionTier;
}

export function setSubscriptionTier(tier: 'starter' | 'professional' | 'enterprise') {
  currentSubscriptionTier = tier;
}

// Map API Restaurant to RestaurantInfo
function mapApiRestaurantToInfo(api: ApiRestaurant): RestaurantInfo {
  return {
    id: api.id,
    name: api.name,
    address: [api.addressLine1, api.addressLine2, api.city, api.state, api.postalCode, api.country]
      .filter(Boolean)
      .join(', '),
    phone: api.phone || '',
    email: api.email || '',
    website: api.website || '',
    currency: api.currency || 'MMK',
    timezone: api.timezone || 'Asia/Yangon',
    logo: api.logoUrl || undefined,
  };
}

// Map API Tax to TaxConfig
function mapApiTaxToConfig(api: ApiTax): TaxConfig {
  // Convert 'beverage' to 'beverages' for frontend consistency
  const appliesTo = api.appliesTo === 'beverage' ? 'beverages' : api.appliesTo;
  return {
    id: api.id,
    name: api.name,
    rate: api.rate,
    enabled: api.isActive,
    appliesTo: appliesTo as 'all' | 'food' | 'beverages' | 'alcohol',
  };
}

// Map API FeatureToggle to FeatureToggle
function mapApiFeatureToToggle(api: ApiFeatureToggle): FeatureToggle {
  // Map feature key to category (simple mapping)
  const categoryMap: Record<string, FeatureToggle['category']> = {
    'kds': 'kitchen',
    'waiter_app': 'ordering',
    'customer_self_order': 'ordering',
    'auto_stock_deduction': 'inventory',
    'low_stock_alerts': 'inventory',
    'split_billing': 'payments',
    'tips': 'payments',
    'reservations': 'general',
    'multi_location': 'general',
  };
  
  return {
    id: api.featureKey,
    name: api.featureKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: '', // API doesn't provide description, generate from feature key
    enabled: api.enabled,
    category: categoryMap[api.featureKey] || 'general',
    config: api.config,
  };
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      restaurantInfo: null,
      isLoadingRestaurant: false,
      features: [],
      isLoadingFeatures: false,
      taxes: [],
      isLoadingTaxes: false,
      printers: [],
      theme: 'light',
      kdsTheme: 'dark',
      currentPlan: 'professional',
      error: null,

      loadRestaurant: async () => {
        set({ isLoadingRestaurant: true, error: null });
        try {
          // No restaurant ID needed - backend extracts from JWT token
          const response = await restaurantApi.getById();
          const apiRestaurant = response.restaurant;
          const info = mapApiRestaurantToInfo(apiRestaurant);
          
          // Update subscription tier if available
          if (apiRestaurant.subscriptionTier) {
            const tier = apiRestaurant.subscriptionTier as 'starter' | 'professional' | 'enterprise';
            setSubscriptionTier(tier);
            set({ currentPlan: tier });
          }
          
          set({ restaurantInfo: info, isLoadingRestaurant: false });
          
          // Sync with restaurantStore for header display
          const restaurantStore = useRestaurantStore.getState();
          if (restaurantStore.restaurant) {
            useRestaurantStore.setState({
              restaurant: {
                ...restaurantStore.restaurant,
                name: info.name,
                address: info.address,
                phone: info.phone,
                logo: info.logo,
              },
            });
          } else {
            // Initialize restaurantStore if it doesn't exist
            useRestaurantStore.setState({
              restaurant: {
                id: info.id || '',
                name: info.name,
                address: info.address,
                phone: info.phone,
                logo: info.logo,
                settings: {
                  features: {
                    kds: { enabled: true },
                    waiterApp: { enabled: true },
                    inventory: { enabled: true, autoDeduction: false },
                    reservations: { enabled: false },
                  },
                  operations: {
                    taxRate: 0,
                    currency: info.currency || 'MMK',
                  },
                },
              },
            });
          }
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to load restaurant', isLoadingRestaurant: false });
        }
      },

      updateRestaurantInfo: async (info: Partial<RestaurantInfo>) => {
        const current = get().restaurantInfo;
        if (!current?.id) {
          set({ error: 'No restaurant loaded' });
          return;
        }

        // Optimistically update local state
        const updatedInfo = { ...current, ...info };
        set({ restaurantInfo: updatedInfo, error: null });
        
        try {
          // Parse address back to components (simple split)
          const addressParts = (info.address || updatedInfo.address)?.split(', ') || [];
          const updateData: Partial<ApiRestaurant> = {
            name: info.name ?? updatedInfo.name,
            phone: info.phone ?? updatedInfo.phone,
            email: info.email ?? updatedInfo.email,
            website: info.website ?? updatedInfo.website,
            currency: info.currency ?? updatedInfo.currency,
            timezone: info.timezone ?? updatedInfo.timezone,
            addressLine1: addressParts[0] || undefined,
            addressLine2: addressParts[1] || undefined,
            city: addressParts[2] || undefined,
            state: addressParts[3] || undefined,
            postalCode: addressParts[4] || undefined,
            country: addressParts[5] || undefined,
          };

          // No restaurant ID needed - backend extracts from JWT token
          const response = await restaurantApi.update(updateData);
          const savedInfo = mapApiRestaurantToInfo(response.restaurant);
          set({ restaurantInfo: savedInfo });
          
          // Update restaurantStore to sync the name in the header
          const restaurantStore = useRestaurantStore.getState();
          if (restaurantStore.restaurant) {
            useRestaurantStore.setState({
              restaurant: {
                ...restaurantStore.restaurant,
                name: savedInfo.name,
              },
            });
          }
        } catch (error) {
          // Revert on error
          set({ restaurantInfo: current });
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to update restaurant' });
        }
      },

      uploadLogo: async (file: File) => {
        set({ error: null });
        try {
          // No restaurant ID needed - backend extracts from JWT token
          const response = await restaurantApi.uploadLogo(file);
          const updatedInfo = mapApiRestaurantToInfo(response.restaurant);
          set({ restaurantInfo: updatedInfo });
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to upload logo' });
        }
      },

      loadFeatures: async () => {
        set({ isLoadingFeatures: true, error: null });
        try {
          const response = await featuresApi.list();
          const features = response.toggles.map(mapApiFeatureToToggle);
          set({ features, isLoadingFeatures: false });
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to load features', isLoadingFeatures: false });
        }
      },

      toggleFeature: async (featureKey: string) => {
        set({ error: null });
        try {
          // Find current feature to get ID
          const currentFeature = get().features.find(f => f.id === featureKey);
          if (!currentFeature) {
            set({ error: 'Feature not found' });
            return;
          }

          // Use upsert to toggle
          const response = await featuresApi.upsert(featureKey, {
            enabled: !currentFeature.enabled,
          });

          // Update local state
          const updated = mapApiFeatureToToggle(response.toggle);
          set((state) => ({
            features: state.features.map((f) => (f.id === featureKey ? updated : f)),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to toggle feature' });
        }
      },

      updateFeatureConfig: async (featureKey: string, config: Record<string, any>) => {
        set({ error: null });
        try {
          const currentFeature = get().features.find(f => f.id === featureKey);
          if (!currentFeature) {
            set({ error: 'Feature not found' });
            return;
          }

          const response = await featuresApi.upsert(featureKey, {
            enabled: currentFeature.enabled,
            config: { ...currentFeature.config, ...config },
          });

          const updated = mapApiFeatureToToggle(response.toggle);
          set((state) => ({
            features: state.features.map((f) => (f.id === featureKey ? updated : f)),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to update feature config' });
        }
      },

      isFeatureEnabled: (featureKey: string) => {
        const feature = get().features.find((f) => f.id === featureKey);
        if (!feature) return false;
        
        // Check plan requirement
        if (feature.requiresPlan) {
          const planOrder = ['starter', 'professional', 'enterprise'];
          const currentPlanIndex = planOrder.indexOf(get().currentPlan);
          const requiredPlanIndex = planOrder.indexOf(feature.requiresPlan);
          if (currentPlanIndex < requiredPlanIndex) return false;
        }
        
        return feature.enabled;
      },

      loadTaxes: async () => {
        set({ isLoadingTaxes: true, error: null });
        try {
          const response = await taxesApi.list();
          const taxes = response.taxes.map(mapApiTaxToConfig);
          set({ taxes, isLoadingTaxes: false });
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to load taxes', isLoadingTaxes: false });
        }
      },

      addTax: async (tax: Omit<TaxConfig, 'id'>) => {
        set({ error: null });
        try {
          const response = await taxesApi.create({
            name: tax.name,
            rate: tax.rate,
            type: 'percentage', // Default to percentage, can be made configurable later
            appliesTo: tax.appliesTo === 'beverages' ? 'beverage' : tax.appliesTo,
            isActive: tax.enabled,
          });
          const newTax = mapApiTaxToConfig(response.tax);
          set((state) => ({ taxes: [...state.taxes, newTax] }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to add tax' });
          throw error;
        }
      },

      updateTax: async (id: string, updates: Partial<TaxConfig>) => {
        set({ error: null });
        try {
          const updateData: Partial<ApiTax> = {};
          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.rate !== undefined) updateData.rate = updates.rate;
          if (updates.appliesTo !== undefined) {
            updateData.appliesTo = updates.appliesTo === 'beverages' ? 'beverage' : updates.appliesTo;
          }
          if (updates.enabled !== undefined) updateData.isActive = updates.enabled;
          
          const response = await taxesApi.update(id, updateData);
          const updated = mapApiTaxToConfig(response.tax);
          set((state) => ({
            taxes: state.taxes.map((t) => (t.id === id ? updated : t)),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to update tax' });
          throw error;
        }
      },

      deleteTax: async (id: string) => {
        set({ error: null });
        try {
          await taxesApi.delete(id);
          set((state) => ({ taxes: state.taxes.filter((t) => t.id !== id) }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to delete tax' });
          throw error;
        }
      },

      // Printers (local only)
      addPrinter: (printer) => {
        set((state) => ({
          printers: [...state.printers, { ...printer, id: `printer-${Date.now()}` }],
        }));
      },

      updatePrinter: (id, updates) => {
        set((state) => ({
          printers: state.printers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      deletePrinter: (id) => {
        set((state) => ({
          printers: state.printers.filter((p) => p.id !== id),
        }));
      },

      setTheme: (theme) => set({ theme }),
      setKdsTheme: (kdsTheme) => set({ kdsTheme }),
      
      updateSubscriptionTier: async (tier) => {
        set({ error: null });
        try {
          await tenantApi.updateSubscription(tier);
          setSubscriptionTier(tier);
          set({ currentPlan: tier });
          // Reload restaurant to get updated subscription tier
          await get().loadRestaurant();
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message || 'Failed to update subscription tier' });
          throw error;
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        theme: state.theme,
        kdsTheme: state.kdsTheme,
        currentPlan: state.currentPlan,
        printers: state.printers,
      }),
    }
  )
);
