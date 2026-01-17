import { create } from 'zustand';

export type PageName = 
  | 'login'
  | 'dashboard'
  | 'menu'
  | 'orders'
  | 'orders.detail'
  | 'pos'
  | 'tables'
  | 'tables.orders'
  | 'kds'
  | 'kds.fullscreen'
  | 'inventory'
  | 'reports'
  | 'settings'
  | 'profile'
  | 'saas.dashboard'
  | 'saas.tenants'
  | 'saas.users'
  | 'saas.subscriptions'
  | 'qr'
  | 'not-found';

export interface PageParams {
  orderId?: string;
  tableId?: string;
  token?: string;
  [key: string]: string | undefined;
}

interface NavigationState {
  currentPage: PageName;
  pageParams: PageParams;
  history: PageName[];
  historyIndex: number;
  navigate: (page: PageName, params?: PageParams) => void;
  goBack: () => void;
  setParams: (params: PageParams) => void;
  reset: () => void;
}

const defaultPage: PageName = 'dashboard';

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: defaultPage,
  pageParams: {},
  history: [defaultPage],
  historyIndex: 0,

  navigate: (page: PageName, params?: PageParams) => {
    const { history, historyIndex } = get();
    
    // Add to history if it's a new page (not going back/forward)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(page);
    
    set({
      currentPage: page,
      pageParams: params || {},
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  goBack: () => {
    const { history, historyIndex } = get();
    
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        currentPage: history[newIndex],
        pageParams: {},
        historyIndex: newIndex,
      });
    }
  },

  setParams: (params: PageParams) => {
    set({ pageParams: params });
  },

  reset: () => {
    set({
      currentPage: defaultPage,
      pageParams: {},
      history: [defaultPage],
      historyIndex: 0,
    });
  },
}));
