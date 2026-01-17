import { ComponentType } from 'react';

// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Full name for display
  role: UserRole;
  avatar?: string;
  phone?: string;
  pin?: string;
  tenantId?: string;      // For tenant_admin
  restaurantId?: string;  // For restaurant-level users
  tenant?: { id: string; name: string; subscriptionTier?: string }; // Populated in some API responses
  restaurant?: { id: string; name: string }; // Populated in some API responses
  isActive?: boolean;
  createdAt?: Date;
}

// Role hierarchy: super_admin > tenant_admin > admin > manager > others
export type UserRole =
  | 'super_admin'   // SaaS platform admin - manages all tenants
  | 'tenant_admin'  // Tenant owner - manages their restaurants
  | 'admin'         // Restaurant admin
  | 'manager'       // Restaurant manager
  | 'cashier'       // Cashier - handles payments
  | 'waiter'        // Waiter - service staff
  | 'server'        // Server - service staff
  | 'cook'          // Cook - kitchen staff
  | 'inventory';    // Inventory manager

// Check if user is SaaS-level admin
export const isSaasAdmin = (role: UserRole): boolean => role === 'super_admin';
export const isTenantAdmin = (role: UserRole): boolean => role === 'tenant_admin' || role === 'super_admin';
export const isRestaurantAdmin = (role: UserRole): boolean => ['admin', 'manager', 'tenant_admin', 'super_admin'].includes(role);

// Tenant Types (for SaaS)
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  phone?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: Date;
  maxRestaurants: number;
  maxUsers: number;
  restaurantCount: number;
  userCount: number;
  createdAt: Date;
  isActive: boolean;
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial';

export interface LoginCredentials {
  rememberMe?: boolean;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  settings: RestaurantSettings;
}

export interface RestaurantSettings {
  features: {
    kds: { enabled: boolean };
    waiterApp: { enabled: boolean };
    inventory: { enabled: boolean; autoDeduction: boolean };
    reservations: { enabled: boolean };
  };
  operations: {
    taxRate: number;
    currency: string;
  };
}

// Menu Types
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  basePrice: number;
  image?: string;
  variants: MenuVariant[];
  modifiers: MenuModifier[];
  isActive: boolean;
  isAvailable: boolean;
  allergens?: string[];
  dietaryTags?: string[];
}

export interface MenuVariant {
  name: string;
  price: number;
}

export interface MenuModifier {
  name: string;
  price: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableName: string;
  waiterId?: string;
  waiterName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  guestCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'  // Waiter picked up from kitchen
  | 'served'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: string;
  modifiers: Array<{name: string; price: number}>;
  modifiersTotal?: number;
  notes?: string;
  status: OrderItemStatus;
}

export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

// Table Types
export interface Table {
  id: string;
  tableNumber: string;
  name?: string;
  section: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  guestCount?: number;
  occupiedAt?: Date;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'blocked';

// Inventory Types
export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minimumStock: number;
  isLowStock: boolean;
}

export interface Recipe {
  menuItemId: string;
  ingredients: RecipeIngredient[];
  totalCost: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  cost: number;
  variantName?: string; // Optional: for variant-specific recipes
}

// Dashboard Types
export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  avgOrderValue: number;
  tableOccupancy: number;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

