import apiClient from './client';

export interface QRCodeData {
  token: string;
  qrUrl: string;
  qrCodeImage?: string;
  tableId: string;
  tableNumber: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
  };
  generatedAt?: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  isValid?: boolean;
}

export interface TableInfo {
  table: {
    id: string;
    number: string;
    name?: string;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    phone?: string;
    address?: string;
  };
  menuItems: Array<{
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    basePrice: number;
    category?: {
      id: string;
      name: string;
    };
    isAvailable: boolean;
  }>;
  isValid: boolean;
}

export interface TableOrders {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    placedAt: string;
    subtotal: number;
    taxAmount: number;
    serviceCharge: number;
    discountAmount: number;
    totalAmount: number;
    paymentStatus: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
      menuItem?: {
        id: string;
        name: string;
        imageUrl?: string;
      };
    }>;
    waiter?: {
      name: string;
    };
  }>;
  totals: {
    totalAmount: number;
    totalItems: number;
    orderCount: number;
  };
}

export interface CreateOrderViaQRData {
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  orderType?: string;
  guestCount?: number;
  notes?: string;
}

/**
 * Generate or get QR code for a table (waiter app, requires auth)
 */
export async function generateQRCode(tableId: string): Promise<{ qrCode: QRCodeData }> {
  const response = await apiClient.get(`/tables/qr/table/${tableId}`);
  return response.data;
}

/**
 * Regenerate QR code for a table (waiter app, requires auth)
 */
export async function regenerateQRCode(tableId: string): Promise<{ message: string; qrCode: QRCodeData }> {
  const response = await apiClient.post(`/tables/qr/table/${tableId}/regenerate`);
  return response.data;
}

/**
 * Invalidate QR code for a table (waiter app, requires auth)
 */
export async function invalidateQRCode(tableId: string): Promise<{ message: string }> {
  const response = await apiClient.post(`/tables/qr/table/${tableId}/invalidate`);
  return response.data;
}

/**
 * Get table info and menu via QR token (public, no auth)
 */
export async function getTableInfo(token: string): Promise<TableInfo> {
  const response = await apiClient.get(`/public/qr/${token}`, {
    skipAuth: true
  } as any);
  return response.data;
}

/**
 * Get orders for table via QR token (public, no auth)
 */
export async function getTableOrders(token: string): Promise<TableOrders> {
  const response = await apiClient.get(`/public/qr/${token}/orders`, {
    skipAuth: true
  } as any);
  return response.data;
}

/**
 * Create order via QR token (public, no auth)
 */
export async function createOrderViaQR(token: string, orderData: CreateOrderViaQRData): Promise<{ message: string; order: any }> {
  const response = await apiClient.post(`/public/qr/${token}/orders`, orderData, {
    skipAuth: true
  } as any);
  return response.data;
}

/**
 * Request payment via QR token (public, no auth)
 */
export async function requestPayment(token: string, message?: string): Promise<{ message: string; notificationsSent: number }> {
  const response = await apiClient.post(`/public/qr/${token}/request-payment`, { message }, {
    skipAuth: true
  } as any);
  return response.data;
}
