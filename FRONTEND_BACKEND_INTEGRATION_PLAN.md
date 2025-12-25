# Frontend-Backend Integration Plan

## 📊 Overview

This document outlines the integration plan to connect the React frontend with the Node.js/Express backend. Backend Phases 1-7 are complete, and we're now integrating the frontend components with real API endpoints.

---

## ✅ Backend Status (Completed Phases)

### Phase 1: Database Setup ✅
- Database migrations created
- All 18 core tables defined
- Models with associations

### Phase 2: Authentication & User Management ✅
- JWT authentication
- User registration/login (email/password + PIN)
- Role-based access control (RBAC)
- User CRUD operations

### Phase 3: Restaurant Settings & Configuration ✅
- Restaurant CRUD
- Dynamic settings (JSONB)
- Tax configuration
- Feature toggles
- Logo upload

### Phase 4: Tables & Floor Management ✅
- Section CRUD with color/icon
- Table CRUD with position fields
- Table status management
- QR code generation
- Socket.IO structure (ready for real-time)

### Phase 5: Menu Management ✅
- Menu category CRUD (with subcategories)
- Menu item CRUD (variants, modifiers, images)
- Image upload
- Availability toggle
- Search and filtering

### Phase 6: Inventory Management ✅
- Ingredient & category CRUD
- Stock tracking & adjustments
- Recipe builder (menu ↔ ingredients)
- Low stock alerts
- Transaction history
- Auto stock deduction (on order completion)

### Phase 7: Order Management ✅
- Order CRUD operations
- Order item management
- Status workflow (pending → confirmed → preparing → ready → served → completed)
- Split/transfer/merge operations
- Real-time Socket.IO integration
- Auto stock deduction integration

---

## 🔗 Frontend Integration Phases

### **Integration Phase 1: Authentication & Core Setup** ✅ (COMPLETED)
**Status**: Complete

**Completed**:
- ✅ API client with axios and interceptors
- ✅ Auth API service (`authApi.ts`)
- ✅ Auth store updated to use real API
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ Protected routes setup

**Files Created**:
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/authApi.ts`
- `frontend/src/lib/api/index.ts`
- Updated: `frontend/src/store/authStore.ts`

**Next Steps**:
- Test login flow end-to-end
- Test token refresh mechanism

---

### **Integration Phase 2: Menu Management**
**Priority**: High | **Estimated Time**: 2-3 days

**Objectives**:
- Connect menu pages to backend API
- Replace mock data with real API calls
- Implement CRUD operations for categories and items

**Tasks**:
1. ✅ Create `menuApi.ts` (Already done)
2. Update `menuStore.ts` to use `menuApi`
3. Update `CategoriesPage.tsx`:
   - Fetch categories from API
   - Create/update/delete categories
   - Reorder categories
4. Update `MenuItemsPage.tsx`:
   - Fetch items with filters
   - Create/update/delete items
   - Toggle availability
   - Image upload
5. Update `RecipesPage.tsx`:
   - Link with recipe API (Phase 6 backend)

**API Endpoints to Use**:
- `GET /api/menu/categories`
- `POST /api/menu/categories`
- `PUT /api/menu/categories/:id`
- `DELETE /api/menu/categories/:id`
- `PUT /api/menu/categories/reorder`
- `GET /api/menu/items`
- `POST /api/menu/items`
- `PUT /api/menu/items/:id`
- `PUT /api/menu/items/:id/availability`
- `PUT /api/menu/items/:id/image`

**Deliverables**:
- Menu categories fully functional
- Menu items fully functional
- Image upload working
- Search and filtering working

---

### **Integration Phase 3: Tables & Floor Management**
**Priority**: High | **Estimated Time**: 1-2 days

**Objectives**:
- Connect tables pages to backend API
- Real-time table status updates via Socket.IO

**Tasks**:
1. ✅ Create `tablesApi.ts` (Already done)
2. Update `tableStore.ts` to use `tablesApi`
3. Update `TablesPage.tsx`:
   - Fetch tables from API
   - Create/update/delete tables
   - Update table status
   - Generate QR codes
4. Update `SectionManager.tsx`:
   - Fetch sections from API
   - CRUD operations for sections
   - Reorder sections
5. Implement Socket.IO client:
   - Connect to backend Socket.IO
   - Listen for `table:status_changed` events
   - Update table status in real-time

**API Endpoints to Use**:
- `GET /api/sections`
- `POST /api/sections`
- `PUT /api/sections/:id`
- `DELETE /api/sections/:id`
- `PUT /api/sections/reorder`
- `GET /api/tables`
- `POST /api/tables`
- `PUT /api/tables/:id`
- `PUT /api/tables/:id/status`
- `GET /api/tables/:id/qr-code`

**Socket.IO Events**:
- `join:restaurant` - Join restaurant room
- `table:status_changed` - Table status update
- `tables:updated` - Multiple tables updated

**Deliverables**:
- Tables fully functional
- Sections fully functional
- Real-time status updates
- QR code generation working

---

### **Integration Phase 4: Orders & POS**
**Priority**: Critical | **Estimated Time**: 3-4 days

**Objectives**:
- Connect POS page to backend
- Real-time order updates
- Order management page

**Tasks**:
1. ✅ Create `ordersApi.ts` (Already done)
2. Update `orderStore.ts` to use `ordersApi`
3. Update `POSPage.tsx`:
   - Load menu items from API
   - Create orders via API
   - Add/remove items from order
   - Update order status
   - Calculate totals (subtotal, tax, total)
4. Update `OrdersPage.tsx`:
   - List orders with filters
   - Order status management
   - Order details view
5. Update `OrderDetailPage.tsx`:
   - Display full order details
   - Split/transfer/merge orders
   - Payment integration (Phase 8)
6. Implement Socket.IO for orders:
   - Listen for `order:created`, `order:status_changed`
   - Real-time order updates in POS
   - KDS integration for kitchen

**API Endpoints to Use**:
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`
- `POST /api/orders/:id/send-to-kitchen`
- `POST /api/orders/:id/split`
- `POST /api/orders/:id/transfer`
- `POST /api/orders/:id/merge`
- `POST /api/orders/:id/items`
- `PUT /api/orders/:id/items/:itemId`
- `DELETE /api/orders/:id/items/:itemId`

**Socket.IO Events**:
- `order:created` - New order created
- `order:status_changed` - Order status updated
- `order:ready` - Order ready for service
- `order:item_updated` - Order item status changed (KDS)

**Deliverables**:
- POS fully functional
- Order creation and management
- Real-time order updates
- Order status workflow working

---

### **Integration Phase 5: Inventory Management**
**Priority**: Medium | **Estimated Time**: 2-3 days

**Objectives**:
- Connect inventory pages to backend
- Stock management
- Recipe builder

**Tasks**:
1. Create `inventoryApi.ts`
2. Update `inventoryStore.ts` to use `inventoryApi`
3. Update `InventoryPage.tsx`:
   - List ingredients
   - Create/update/delete ingredients
   - Stock adjustments
   - Low stock alerts
4. Update `RecipeBuilder.tsx`:
   - Link with recipe API
   - Build recipes for menu items
   - Calculate recipe costs
5. Implement stock take functionality
6. Transaction history view

**API Endpoints to Use**:
- `GET /api/inventory/categories`
- `POST /api/inventory/categories`
- `GET /api/inventory/ingredients`
- `POST /api/inventory/ingredients`
- `PUT /api/inventory/ingredients/:id/stock`
- `GET /api/inventory/low-stock`
- `POST /api/inventory/stock-take`
- `GET /api/inventory/transactions`
- `GET /api/recipes/:menuItemId`
- `PUT /api/recipes/:menuItemId`
- `GET /api/recipes/:menuItemId/cost`

**Deliverables**:
- Inventory management fully functional
- Stock tracking working
- Recipe builder functional
- Low stock alerts working

---

### **Integration Phase 6: Restaurant Settings & Configuration**
**Priority**: Medium | **Estimated Time**: 1-2 days

**Objectives**:
- Connect settings pages to backend
- Tax configuration
- Feature toggles
- Restaurant profile

**Tasks**:
1. Create `restaurantApi.ts`
2. Create `taxesApi.ts`
3. Create `featuresApi.ts`
4. Update `restaurantStore.ts` to use APIs
5. Update `SettingsPage.tsx`:
   - Restaurant profile management
   - Tax configuration
   - Feature toggles
   - Logo upload

**API Endpoints to Use**:
- `GET /api/restaurants`
- `PUT /api/restaurants/:id`
- `PUT /api/restaurants/:id/settings`
- `PUT /api/restaurants/:id/logo`
- `GET /api/taxes`
- `POST /api/taxes`
- `PUT /api/taxes/:id`
- `GET /api/features`
- `PUT /api/features/:id`

**Deliverables**:
- Settings page fully functional
- Tax configuration working
- Feature toggles working
- Logo upload working

---

### **Integration Phase 7: Real-time Updates & Socket.IO**
**Priority**: High | **Estimated Time**: 2-3 days

**Objectives**:
- Full Socket.IO integration
- Real-time updates across all pages
- KDS integration

**Tasks**:
1. Install `socket.io-client`:
   ```bash
   npm install socket.io-client
   ```
2. Create Socket.IO client utility (`src/lib/socket.ts`)
3. Create Socket.IO context/provider
4. Integrate real-time updates:
   - Tables page: Table status updates
   - Orders page: Order status updates
   - POS page: Order updates
   - KDS page: Order item status updates
5. Implement connection management:
   - Auto-reconnect
   - Connection status indicator
   - Error handling

**Socket.IO Events to Handle**:
- `order:created`
- `order:status_changed`
- `order:ready`
- `order:item_updated`
- `table:status_changed`
- `tables:updated`

**Deliverables**:
- Real-time updates working
- Socket.IO client configured
- Auto-reconnection working
- KDS integration complete

---

### **Integration Phase 8: Payments** (Backend Phase 8 - Future)
**Priority**: Low | **Status**: Pending Backend

**Objectives**:
- Payment processing
- Payment history
- Payment methods

**Tasks**:
- Wait for backend Phase 8 completion
- Create `paymentsApi.ts`
- Integrate payment endpoints
- Payment UI components

---

### **Integration Phase 9: Reports & Analytics** (Backend Phase 11 - Future)
**Priority**: Low | **Status**: Pending Backend

**Objectives**:
- Sales reports
- Inventory reports
- Analytics dashboards

**Tasks**:
- Wait for backend Phase 11 completion
- Create `reportsApi.ts`
- Integrate report endpoints
- Charts and visualizations

---

## 📝 API Services Status

| Service | Status | File |
|---------|--------|------|
| Auth API | ✅ Complete | `src/lib/api/authApi.ts` |
| Menu API | ✅ Complete | `src/lib/api/menuApi.ts` |
| Orders API | ✅ Complete | `src/lib/api/ordersApi.ts` |
| Tables API | ✅ Complete | `src/lib/api/tablesApi.ts` |
| Inventory API | ⏳ Pending | `src/lib/api/inventoryApi.ts` |
| Restaurant API | ⏳ Pending | `src/lib/api/restaurantApi.ts` |
| Taxes API | ⏳ Pending | `src/lib/api/taxesApi.ts` |
| Features API | ⏳ Pending | `src/lib/api/featuresApi.ts` |
| Users API | ⏳ Pending | `src/lib/api/usersApi.ts` |

---

## 🔄 Store Update Status

| Store | Status | Next Action |
|-------|--------|-------------|
| `authStore.ts` | ✅ Complete | - |
| `menuStore.ts` | ⏳ Pending | Update to use `menuApi` |
| `orderStore.ts` | ⏳ Pending | Update to use `ordersApi` |
| `tableStore.ts` | ⏳ Pending | Update to use `tablesApi` |
| `inventoryStore.ts` | ⏳ Pending | Create `inventoryApi` first |
| `restaurantStore.ts` | ⏳ Pending | Create `restaurantApi` first |
| `settingsStore.ts` | ⏳ Pending | Create APIs first |

---

## 🚀 Quick Start Testing

### 1. Backend Setup
```bash
cd backend
npm install
npm run migrate
npm run seed        # Run seeders for sample data
npm run dev         # Start backend on port 3001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL=http://localhost:3001/api
npm run dev         # Start frontend on port 5173
```

### 3. Test Login
- Navigate to `http://localhost:5173/login`
- Use seeded account credentials (see seeders)

---

## 📋 Integration Checklist

### Phase 1: Auth & Core ✅
- [x] API client setup
- [x] Auth API service
- [x] Auth store integration
- [ ] Test login flow
- [ ] Test token refresh

### Phase 2: Menu Management
- [ ] Menu store integration
- [ ] Categories page integration
- [ ] Menu items page integration
- [ ] Image upload
- [ ] Search/filtering

### Phase 3: Tables Management
- [ ] Table store integration
- [ ] Tables page integration
- [ ] Sections management
- [ ] Socket.IO for real-time

### Phase 4: Orders & POS
- [ ] Order store integration
- [ ] POS page integration
- [ ] Orders page integration
- [ ] Order detail page
- [ ] Socket.IO for orders

### Phase 5: Inventory
- [ ] Create inventory API
- [ ] Inventory store integration
- [ ] Inventory page integration
- [ ] Recipe builder integration

### Phase 6: Settings
- [ ] Create restaurant/taxes/features APIs
- [ ] Settings page integration

### Phase 7: Socket.IO
- [ ] Install socket.io-client
- [ ] Create socket utility
- [ ] Integrate real-time updates

---

## 🎯 Priority Order for Implementation

1. **Phase 2: Menu Management** (Critical for POS)
2. **Phase 4: Orders & POS** (Core functionality)
3. **Phase 3: Tables Management** (Needed for orders)
4. **Phase 7: Socket.IO** (Real-time updates)
5. **Phase 5: Inventory** (Important but not blocking)
6. **Phase 6: Settings** (Configuration)

---

## 📚 Reference Documents

- `BACKEND_DEVELOPMENT_PLAN.md` - Backend API documentation
- `FRONTEND_DEVELOPMENT_PLAN.md` - Frontend architecture
- `frontend/README_API.md` - API integration guide
- `frontend/API_INTEGRATION_SUMMARY.md` - Current integration status

---

## 🔧 Development Tips

1. **Test API endpoints** using Postman/Insomnia before integrating
2. **Use React Query** for data fetching (already set up)
3. **Handle loading states** in all API calls
4. **Error handling** - Use `getApiError` utility
5. **TypeScript types** - Match backend response types
6. **Console logs** - Check Network tab in DevTools for API calls

---

**Last Updated**: 2024-12-26
**Current Phase**: Integration Phase 1 Complete, Phase 2 In Progress

