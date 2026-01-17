# Frontend-Backend Integration

## Overview

This guide covers how the React frontend integrates with the Node.js/Express backend, including API client setup, authentication flow, and real-time communication.

## API Client Setup

### Base Configuration

**File**: `frontend/src/lib/api/client.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Request Interceptor

Adds JWT token to all requests:

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor

Handles token refresh and errors:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request
        return apiClient.request(error.config);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## API Service Files

### Structure

Each feature has its own API service file:

```
frontend/src/lib/api/
├── client.ts          # Base axios client
├── authApi.ts         # Authentication endpoints
├── menuApi.ts         # Menu endpoints
├── ordersApi.ts       # Order endpoints
├── inventoryApi.ts    # Inventory endpoints
├── tablesApi.ts       # Table endpoints
└── index.ts           # Export all APIs
```

### Example: Menu API

```typescript
// frontend/src/lib/api/menuApi.ts
import apiClient from './client';

export const menuApi = {
  getCategories: () => apiClient.get('/menu/categories'),
  
  createCategory: (data: CreateCategoryDto) =>
    apiClient.post('/menu/categories', data),
  
  updateCategory: (id: string, data: UpdateCategoryDto) =>
    apiClient.put(`/menu/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    apiClient.delete(`/menu/categories/${id}`),
  
  getMenuItems: (params?: MenuItemFilters) =>
    apiClient.get('/menu/items', { params }),
  
  createMenuItem: (data: CreateMenuItemDto) =>
    apiClient.post('/menu/items', data),
  
  updateMenuItem: (id: string, data: UpdateMenuItemDto) =>
    apiClient.put(`/menu/items/${id}`, data),
  
  deleteMenuItem: (id: string) =>
    apiClient.delete(`/menu/items/${id}`),
};
```

## State Management Integration

### Zustand Store Pattern

**File**: `frontend/src/store/menuStore.ts`

```typescript
import { create } from 'zustand';
import { menuApi } from '../lib/api';

interface MenuStore {
  categories: Category[];
  menuItems: MenuItem[];
  loading: boolean;
  error: string | null;
  
  loadCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryDto) => Promise<void>;
  // ... other actions
}

export const useMenuStore = create<MenuStore>((set) => ({
  categories: [],
  menuItems: [],
  loading: false,
  error: null,
  
  loadCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await menuApi.getCategories();
      set({ categories: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  createCategory: async (data) => {
    try {
      const response = await menuApi.createCategory(data);
      set((state) => ({
        categories: [...state.categories, response.data.data],
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

## Component Integration

### Using Store in Components

```typescript
// frontend/src/pages/menu/CategoriesPage.tsx
import { useEffect } from 'react';
import { useMenuStore } from '../../store/menuStore';

export const CategoriesPage = () => {
  const { categories, loading, loadCategories, createCategory } = useMenuStore();
  
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  
  const handleCreate = async (data: CreateCategoryDto) => {
    try {
      await createCategory(data);
      // Show success message
    } catch (error) {
      // Show error message
    }
  };
  
  if (loading) return <Loading />;
  
  return (
    <div>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};
```

## Authentication Flow

### Login Process

1. **User submits login form**
2. **Frontend calls auth API**:
   ```typescript
   const response = await authApi.login({ email, password });
   ```
3. **Store tokens**:
   ```typescript
   localStorage.setItem('accessToken', response.data.data.accessToken);
   localStorage.setItem('refreshToken', response.data.data.refreshToken);
   ```
4. **Update auth store**:
   ```typescript
   setUser(response.data.data.user);
   setAuthenticated(true);
   ```
5. **Redirect to dashboard**

### Token Refresh

```typescript
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await authApi.refresh({ refreshToken });
    
    localStorage.setItem('accessToken', response.data.data.accessToken);
    return true;
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
};
```

## Real-Time Integration

### Socket.IO Setup

**File**: `frontend/src/lib/socket.ts`

```typescript
import { io } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string, restaurantId: string) => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.emit('join:restaurant', { restaurantId });
  
  return socket;
};

export const subscribeToOrders = (callback: (order: Order) => void) => {
  if (!socket) return;
  
  socket.on('order:created', callback);
  socket.on('order:status_changed', callback);
  
  return () => {
    socket?.off('order:created');
    socket?.off('order:status_changed');
  };
};
```

### Using Socket in Store

```typescript
// frontend/src/store/orderStore.ts
import { subscribeToOrders } from '../lib/socket';

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  
  initOrderSocketSubscriptions: () => {
    const unsubscribe = subscribeToOrders((order) => {
      // Update orders list when order changes
      get().loadOrders();
    });
    
    return unsubscribe;
  },
}));
```

## Error Handling

### API Error Handling

```typescript
try {
  const response = await menuApi.createCategory(data);
  // Success
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message || 'An error occurred';
    // Show error to user
    toast.error(message);
  }
}
```

### Network Error Handling

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);
```

## File Upload Integration

### Upload Service

```typescript
// frontend/src/lib/api/uploadApi.ts
export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data.url;
  },
};
```

### Using Upload in Component

```typescript
const handleImageUpload = async (file: File) => {
  try {
    const imageUrl = await uploadApi.uploadImage(file);
    setFormData({ ...formData, imageUrl });
  } catch (error) {
    toast.error('Failed to upload image');
  }
};
```

## Best Practices

### 1. Centralized API Client
- Use single axios instance
- Configure interceptors once
- Reuse across all API services

### 2. Type Safety
- Define TypeScript interfaces for all API responses
- Use types in API service functions
- Type store state and actions

### 3. Error Handling
- Handle errors at API level
- Show user-friendly messages
- Log errors for debugging

### 4. Loading States
- Show loading indicators during API calls
- Use optimistic updates where appropriate
- Handle race conditions

### 5. Caching
- Cache API responses in store
- Invalidate cache on mutations
- Use stale-while-revalidate pattern

## Related Documentation

- [Socket.IO Integration](./02-socket-io-integration.md)
- [API Documentation](../03-api/01-api-overview.md)
- [State Management](../06-development/03-code-patterns.md)


