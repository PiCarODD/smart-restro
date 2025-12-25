# API Integration Guide

## Overview

The frontend has been integrated with the backend API. All API calls go through the centralized API client which handles:
- Authentication tokens
- Request/response interceptors
- Error handling
- Token refresh

## Setup

1. **Install dependencies** (if not already installed):
```bash
npm install axios
```

2. **Environment Variables**:
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

3. **Start Backend**:
Make sure the backend is running on port 3001:
```bash
cd backend
npm run dev
```

## API Services

All API services are located in `src/lib/api/`:

- `client.ts` - Axios client with interceptors
- `authApi.ts` - Authentication endpoints
- `menuApi.ts` - Menu categories and items
- `ordersApi.ts` - Orders and order items
- `tablesApi.ts` - Tables and sections

## Usage Example

```typescript
import { authApi } from '@/lib/api';

// Login
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

// The token is automatically stored in localStorage
// and added to subsequent requests via interceptors
```

## Authentication Flow

1. User logs in → `authApi.login()` called
2. Token stored in `localStorage` as `auth_token`
3. Axios interceptor adds token to all requests: `Authorization: Bearer <token>`
4. On 401 error → Attempts token refresh
5. On refresh failure → Redirects to login

## Updated Stores

- ✅ `authStore.ts` - Now uses real API instead of mock data

## Next Steps

Update other stores to use real API:
- `menuStore.ts` → Use `menuApi`
- `orderStore.ts` → Use `ordersApi`
- `tableStore.ts` → Use `tablesApi`
- `inventoryStore.ts` → Use `inventoryApi` (to be created)
- `restaurantStore.ts` → Use `restaurantApi` (to be created)

## Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Use backend credentials to login

