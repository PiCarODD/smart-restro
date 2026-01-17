# System Architecture

## Overview

The Smart Restaurant Management System is a comprehensive, scalable SaaS platform designed to serve restaurants of all sizes - from small family-owned establishments to large multi-location chains.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Management  │  │   Waiter    │  │    KDS      │         │
│  │   Portal    │  │    App      │   │   Display   │         │
│  │  (React)    │  │   (PWA)     │   │   (PWA)     │         │
│  └─────────────┘  └─────────────┘   └─────────────┘         │
└────────────────────────────┬────────────────────────────────┘
                             │
                        REST API / WebSocket
                             │
┌────────────────────────────┴────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Node.js + Express                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Auth    │  │  Orders  │  │ Inventory │          │   │
│  │  │ Service  │  │ Service  │  │  Service  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └─────────────────────────────────────────────────────┘   │
│                             │                               │
│  ┌──────────────┐  ┌────────┴───────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │   Socket.IO    │  │    Redis     │   │
│  │  (Database)  │  │  (Real-time)   │  │   (Cache)    │   │
│  └──────────────┘  └────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) / shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router
- **Real-time**: Socket.IO Client
- **Build Tool**: Vite
- **PWA**: Service Workers for offline support

### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15+
- **ORM**: Sequelize 6.x
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO 4.x
- **Validation**: Joi/Zod
- **File Upload**: Multer
- **Testing**: Jest + Supertest

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Caching**: Redis (optional)
- **File Storage**: Local filesystem / AWS S3
- **Email**: Nodemailer

## Multi-Tenant Architecture

The system uses a **multi-tenant SaaS architecture** with the following hierarchy:

```
Tenant (Organization)
  └── Restaurants (Multiple locations)
      └── Users (Staff members)
          └── Resources (Orders, Menu, Inventory, etc.)
```

### Tenant Isolation
- Each tenant has a unique `slug` for subdomain routing
- All resources are scoped by `restaurantId` (extracted from JWT)
- Database-level isolation through foreign keys
- Row-level security via middleware

## Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/           # Database, auth, app config
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── sockets/          # Socket.IO handlers
│   ├── utils/            # Helper functions
│   └── validators/       # Request validation
├── migrations/           # Database migrations
├── seeders/              # Sample data
└── uploads/              # File uploads
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & API clients
│   ├── store/            # State management (Zustand)
│   ├── types/            # TypeScript interfaces
│   └── routes/           # Route definitions
└── public/               # Static assets
```

## Design Patterns

### 1. MVC Pattern (Backend)
- **Models**: Sequelize models for database entities
- **Views**: JSON API responses
- **Controllers**: Request handlers that orchestrate services

### 2. Service Layer Pattern
- Business logic separated from controllers
- Reusable services (e.g., `orderService`, `inventoryService`)
- Easier testing and maintenance

### 3. Repository Pattern (via Sequelize)
- Database access abstracted through models
- Consistent query interface
- Easy to swap database implementations

### 4. Middleware Pattern
- Authentication middleware
- Validation middleware
- Error handling middleware
- Rate limiting middleware

### 5. Observer Pattern (Socket.IO)
- Real-time event broadcasting
- Decoupled event emitters and listeners
- Room-based event scoping

## Real-Time Communication

### Socket.IO Architecture
- **Server**: Express HTTP server with Socket.IO
- **Rooms**: 
  - `restaurant:{restaurantId}` - Restaurant-wide events
  - `kds:{restaurantId}` - Kitchen Display System
  - `waiter:{waiterId}` - Waiter-specific events
- **Events**: Order updates, table status changes, notifications

### Event Flow
1. Backend action triggers event (e.g., order created)
2. Socket.IO emits to appropriate rooms
3. Frontend clients in room receive event
4. UI updates automatically via store subscriptions

## Security Architecture

### Authentication Flow
1. User logs in with email/password
2. Server validates credentials
3. JWT token issued with user/restaurant info
4. Token stored in localStorage (frontend)
5. Token sent in `Authorization` header for API requests
6. Middleware validates token on each request

### Authorization
- **Role-Based Access Control (RBAC)**: User roles determine permissions
- **Resource-Level Security**: `restaurantId` from JWT (never from client)
- **API Route Protection**: Middleware checks permissions per route

## Scalability Considerations

### Horizontal Scaling
- Stateless API design (JWT tokens)
- Database connection pooling
- Socket.IO with Redis adapter (for multi-server)

### Performance Optimization
- Database indexing on foreign keys
- Query optimization with Sequelize
- Caching with Redis (optional)
- Frontend code splitting
- Lazy loading of routes

### Multi-Location Support
- Restaurant-level data isolation
- Cross-location reporting (Enterprise tier)
- Inventory transfers between locations

## Deployment Architecture

### Development
- Local PostgreSQL database
- Hot-reload for frontend/backend
- Environment variables via `.env`

### Production
- Docker containers for services
- Docker Compose for orchestration
- Environment-specific configurations
- SSL/TLS for HTTPS
- Reverse proxy (Nginx)

## Related Documentation

- [Database Schema](../04-database/01-database-schema.md)
- [API Documentation](../03-api/01-api-overview.md)
- [Security Guidelines](../05-security/01-security-overview.md)
- [Socket.IO Integration](../07-integration/02-socket-io-integration.md)


