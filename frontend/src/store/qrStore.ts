import { create } from 'zustand';
import * as qrApi from '@/lib/api/qrApi';

interface QRStore {
  // QR Code state
  qrCodes: Record<string, qrApi.QRCodeData>; // tableId -> QRCodeData
  loading: boolean;
  error: string | null;

  // Table info state (for public QR view)
  tableInfo: qrApi.TableInfo | null;
  tableOrders: qrApi.TableOrders | null;
  loadingTableInfo: boolean;
  errorTableInfo: string | null;

  // Actions
  generateQRCode: (tableId: string) => Promise<void>;
  regenerateQRCode: (tableId: string) => Promise<void>;
  invalidateQRCode: (tableId: string) => Promise<void>;
  getQRCode: (tableId: string) => qrApi.QRCodeData | null;

  // Public QR actions
  loadTableInfo: (token: string) => Promise<void>;
  loadTableOrders: (token: string) => Promise<void>;
  createOrderViaQR: (token: string, orderData: qrApi.CreateOrderViaQRData) => Promise<void>;
  requestPayment: (token: string, message?: string) => Promise<void>;
  clearTableInfo: () => void;
}

export const useQRStore = create<QRStore>((set, get) => ({
  // Initial state
  qrCodes: {},
  loading: false,
  error: null,
  tableInfo: null,
  tableOrders: null,
  loadingTableInfo: false,
  errorTableInfo: null,

  // Generate or get QR code
  generateQRCode: async (tableId: string) => {
    set({ loading: true, error: null });
    try {
      const { qrCode } = await qrApi.generateQRCode(tableId);
      set((state) => ({
        qrCodes: {
          ...state.qrCodes,
          [tableId]: qrCode
        },
        loading: false
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to generate QR code'
      });
      throw error;
    }
  },

  // Regenerate QR code
  regenerateQRCode: async (tableId: string) => {
    set({ loading: true, error: null });
    try {
      const { qrCode } = await qrApi.regenerateQRCode(tableId);
      set((state) => ({
        qrCodes: {
          ...state.qrCodes,
          [tableId]: qrCode
        },
        loading: false
      }));
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to regenerate QR code'
      });
      throw error;
    }
  },

  // Invalidate QR code
  invalidateQRCode: async (tableId: string) => {
    set({ loading: true, error: null });
    try {
      await qrApi.invalidateQRCode(tableId);
      set((state) => {
        const updated = { ...state.qrCodes };
        if (updated[tableId]) {
          updated[tableId] = {
            ...updated[tableId],
            isValid: false,
            isExpired: true,
            expiresAt: new Date().toISOString()
          };
        }
        return {
          qrCodes: updated,
          loading: false
        };
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || 'Failed to invalidate QR code'
      });
      throw error;
    }
  },

  // Get QR code from store
  getQRCode: (tableId: string) => {
    return get().qrCodes[tableId] || null;
  },

  // Load table info (public)
  loadTableInfo: async (token: string) => {
    set({ loadingTableInfo: true, errorTableInfo: null });
    try {
      const tableInfo = await qrApi.getTableInfo(token);
      set({ tableInfo, loadingTableInfo: false });
    } catch (error: any) {
      set({
        loadingTableInfo: false,
        errorTableInfo: error.response?.data?.message || error.message || 'Failed to load table info'
      });
      throw error;
    }
  },

  // Load table orders (public)
  loadTableOrders: async (token: string) => {
    try {
      const tableOrders = await qrApi.getTableOrders(token);
      set({ tableOrders });
    } catch (error: any) {
      set({
        errorTableInfo: error.response?.data?.message || error.message || 'Failed to load orders'
      });
      throw error;
    }
  },

  // Create order via QR (public)
  createOrderViaQR: async (token: string, orderData: qrApi.CreateOrderViaQRData) => {
    set({ loadingTableInfo: true, errorTableInfo: null });
    try {
      await qrApi.createOrderViaQR(token, orderData);
      // Reload orders after creating
      await get().loadTableOrders(token);
      set({ loadingTableInfo: false });
    } catch (error: any) {
      set({
        loadingTableInfo: false,
        errorTableInfo: error.response?.data?.message || error.message || 'Failed to create order'
      });
      throw error;
    }
  },

  // Request payment (public)
  requestPayment: async (token: string, message?: string) => {
    try {
      await qrApi.requestPayment(token, message);
    } catch (error: any) {
      set({
        errorTableInfo: error.response?.data?.message || error.message || 'Failed to request payment'
      });
      throw error;
    }
  },

  // Clear table info
  clearTableInfo: () => {
    set({
      tableInfo: null,
      tableOrders: null,
      errorTableInfo: null
    });
  }
}));
