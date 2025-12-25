import { create } from 'zustand';
import { Table, TableStatus } from '@/types';
import { tablesApi, getApiError } from '@/lib/api';

export interface Section {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder: number;
  isActive?: boolean;
}

interface TableStore {
  tables: Table[];
  sections: Section[];
  isLoading: boolean;
  error: string | null;
  
  // Tables
  loadTables: (filters?: { sectionId?: string; status?: string }) => Promise<void>;
  getTable: (id: string) => Promise<Table | null>;
  addTable: (table: Omit<Table, 'id'>) => Promise<void>;
  updateTable: (id: string, table: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateTableStatus: (id: string, status: TableStatus, guestCount?: number) => Promise<void>;
  getTableQrCode: (id: string) => Promise<{ qrCodeUrl: string; externalToken: string } | null>;
  
  // Sections
  loadSections: () => Promise<void>;
  addSection: (section: Omit<Section, 'id' | 'displayOrder'>) => Promise<void>;
  updateSection: (id: string, section: Partial<Section>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (sectionIds: string[]) => Promise<void>;
  
  // Helpers
  clearError: () => void;
}

export const useTableStore = create<TableStore>((set, get) => ({
  tables: [],
  sections: [],
  isLoading: false,
  error: null,

  loadTables: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      // restaurantId removed - backend extracts from JWT token for security
      const response = await tablesApi.listTables({
        ...filters,
      });
      
      // Map API tables to frontend Table type
      const tables: Table[] = response.tables.map(table => ({
        id: table.id,
        tableNumber: table.tableNumber,
        name: table.name || table.tableNumber,
        section: table.section || '',
        capacity: table.capacity,
        status: table.status as TableStatus,
        currentOrderId: table.currentOrderId,
        occupiedAt: table.occupiedAt ? new Date(table.occupiedAt) : undefined,
        guestCount: table.guestCount,
      }));
      
      set({ tables, isLoading: false });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message, isLoading: false });
      throw error;
    }
  },

  getTable: async (id: string) => {
    try {
      const response = await tablesApi.getTable(id);
      const table = response.table;
      
      return {
        id: table.id,
        tableNumber: table.tableNumber,
        name: table.name || table.tableNumber,
        section: table.section || '',
        capacity: table.capacity,
        status: table.status as TableStatus,
        currentOrderId: table.currentOrderId,
        occupiedAt: table.occupiedAt ? new Date(table.occupiedAt) : undefined,
        guestCount: table.guestCount,
      };
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      return null;
    }
  },

  addTable: async (table) => {
    set({ error: null });
    try {
      const requestData: any = {
        // restaurantId removed - backend extracts from JWT token for security
        sectionId: table.section ? get().sections.find(s => s.name === table.section)?.id : undefined,
        tableNumber: table.tableNumber,
        name: table.name,
        section: table.section,
        floor: 1, // Default floor
        capacity: table.capacity,
        shape: 'square', // Default shape
        // status is set by the backend, don't send it
      };
      
      const response = await tablesApi.createTable(requestData);
      
      const newTable: Table = {
        id: response.table.id,
        tableNumber: response.table.tableNumber,
        name: response.table.name || response.table.tableNumber,
        section: response.table.section || '',
        capacity: response.table.capacity,
        status: response.table.status as TableStatus,
        currentOrderId: response.table.currentOrderId,
        occupiedAt: response.table.occupiedAt ? new Date(response.table.occupiedAt) : undefined,
        guestCount: response.table.guestCount,
      };
      
      set(state => ({
        tables: [...state.tables, newTable],
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateTable: async (id, updates) => {
    set({ error: null });
    try {
      const updateData: any = {};
      if (updates.tableNumber !== undefined) updateData.tableNumber = updates.tableNumber;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.section !== undefined) {
        updateData.section = updates.section;
        const section = get().sections.find(s => s.name === updates.section);
        if (section) updateData.sectionId = section.id;
      }
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      
      const response = await tablesApi.updateTable(id, updateData);
      
      const updatedTable: Table = {
        id: response.table.id,
        tableNumber: response.table.tableNumber,
        name: response.table.name || response.table.tableNumber,
        section: response.table.section || '',
        capacity: response.table.capacity,
        status: response.table.status as TableStatus,
        currentOrderId: response.table.currentOrderId,
        occupiedAt: response.table.occupiedAt ? new Date(response.table.occupiedAt) : undefined,
        guestCount: response.table.guestCount,
      };
      
      set(state => ({
        tables: state.tables.map(table =>
          table.id === id ? updatedTable : table
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  deleteTable: async (id) => {
    set({ error: null });
    try {
      await tablesApi.deleteTable(id);
      
      set(state => ({
        tables: state.tables.filter(table => table.id !== id),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateTableStatus: async (id, status, guestCount) => {
    set({ error: null });
    try {
      const response = await tablesApi.updateTableStatus(id, status, guestCount);
      
      const updatedTable: Table = {
        id: response.table.id,
        tableNumber: response.table.tableNumber,
        name: response.table.name || response.table.tableNumber,
        section: response.table.section || '',
        capacity: response.table.capacity,
        status: response.table.status as TableStatus,
        currentOrderId: response.table.currentOrderId,
        occupiedAt: response.table.occupiedAt ? new Date(response.table.occupiedAt) : undefined,
        guestCount: response.table.guestCount,
      };
      
      set(state => ({
        tables: state.tables.map(table =>
          table.id === id ? updatedTable : table
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  getTableQrCode: async (id: string) => {
    set({ error: null });
    try {
      const response = await tablesApi.getTableQrCode(id);
      
      // QR code URL and token are returned in the response
      // They can be used directly by the caller
      return response;
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      return null;
    }
  },

  // Section management
  loadSections: async () => {
    set({ isLoading: true, error: null });
    try {
      // restaurantId removed - backend extracts from JWT token for security
      const response = await tablesApi.listSections({});
      
      // Map API sections to frontend Section type
      const sections: Section[] = response.sections.map(section => ({
        id: section.id,
        name: section.name,
        description: section.description,
        color: section.color,
        icon: section.icon,
        displayOrder: section.displayOrder,
        isActive: section.isActive,
      }));
      
      set({ sections, isLoading: false });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message, isLoading: false });
      throw error;
    }
  },

  addSection: async (section) => {
    set({ error: null });
    try {
      const requestData: any = {
        // restaurantId removed - backend extracts from JWT token for security
        name: section.name,
        description: section.description,
        color: section.color,
        isActive: section.isActive ?? true,
      };
      
      // Only include icon if it's provided and not empty
      if (section.icon && section.icon.trim()) {
        requestData.icon = section.icon;
      }
      
      const response = await tablesApi.createSection(requestData);
      
      const newSection: Section = {
        id: response.section.id,
        name: response.section.name,
        description: response.section.description,
        color: response.section.color,
        icon: response.section.icon,
        displayOrder: response.section.displayOrder,
        isActive: response.section.isActive,
      };
      
      set(state => ({
        sections: [...state.sections, newSection].sort((a, b) =>
          a.displayOrder - b.displayOrder
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateSection: async (id, updates) => {
    set({ error: null });
    try {
      const response = await tablesApi.updateSection(id, updates);
      
      const updatedSection: Section = {
        id: response.section.id,
        name: response.section.name,
        description: response.section.description,
        color: response.section.color,
        icon: response.section.icon,
        displayOrder: response.section.displayOrder,
        isActive: response.section.isActive,
      };
      
      set(state => ({
        sections: state.sections.map(section =>
          section.id === id ? updatedSection : section
        ),
        // Update section name in tables if section name changed
        tables: updates.name
          ? state.tables.map(table => {
              const oldSection = state.sections.find(s => s.id === id);
              if (oldSection && table.section === oldSection.name && updates.name) {
                return { ...table, section: updates.name };
              }
              return table;
            })
          : state.tables,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  deleteSection: async (id) => {
    set({ error: null });
    try {
      await tablesApi.deleteSection(id);
      
      const section = get().sections.find(s => s.id === id);
      if (section) {
        // Update tables in this section - set section to empty or first available
        const remainingSections = get().sections.filter(s => s.id !== id);
        const newSectionName = remainingSections[0]?.name || '';
        
        set(state => ({
          sections: state.sections.filter(s => s.id !== id),
          tables: state.tables.map(table =>
            table.section === section.name
              ? { ...table, section: newSectionName }
              : table
          ),
        }));
      } else {
        set(state => ({
          sections: state.sections.filter(s => s.id !== id),
        }));
      }
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  reorderSections: async (sectionIds) => {
    set({ error: null });
    try {
      await tablesApi.reorderSections(sectionIds);
      
      // Reload sections to get new order
      await get().loadSections();
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
