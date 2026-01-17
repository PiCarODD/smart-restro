# Project Overview

## Smart Restaurant Management System

A comprehensive, scalable SaaS platform designed to serve restaurants of all sizes - from small family-owned establishments to large multi-location chains.

## Key Characteristics

### Multi-Tenant SaaS
- Tenant → Restaurant → User hierarchy
- Restaurant-level data isolation
- Subscription-based feature access

### Modular Architecture
- Feature toggles for subscription tiers
- Enable/disable features per restaurant
- Scalable from small to enterprise

### Real-Time Updates
- Socket.IO for instant updates
- Kitchen Display System (KDS)
- Live order and table status

### Comprehensive Features
- Order Management (Portal & Waiter App)
- Kitchen Display System
- Inventory & Stock Management
- Menu Management
- Table & Floor Management
- Analytics & Reporting
- Payment Processing

## Technology Stack

### Frontend
- React 18 + TypeScript
- Material-UI / shadcn/ui
- Zustand (State Management)
- Socket.IO Client
- Vite (Build Tool)

### Backend
- Node.js 20.x + Express.js
- PostgreSQL 15+ (Database)
- Sequelize (ORM)
- Socket.IO (Real-time)
- JWT (Authentication)

## Project Status

### Completed Phases
- ✅ Phase 1: Foundation & Database Setup
- ✅ Phase 2: Authentication & User Management
- ✅ Phase 3: Restaurant Settings & Configuration
- ✅ Phase 4: Tables & Floor Management
- ✅ Phase 5: Menu Management
- ✅ Phase 6: Inventory Management
- ✅ Phase 7: Order Management
- ✅ Socket.IO Integration

### In Progress
- Frontend-Backend Integration
- Advanced Features
- Testing & Optimization

### Planned
- Multi-Location Support
- Customer Self-Ordering
- Loyalty Program
- Delivery/Takeout Module

## Subscription Tiers

### Starter ($49/month)
- Up to 3 users
- Up to 100 menu items
- Up to 15 tables
- Basic features

### Professional ($129/month)
- Up to 10 users
- Up to 500 menu items
- Up to 50 tables
- KDS, Waiter App, Auto Stock Deduction

### Enterprise ($299/month + $99/location)
- Unlimited users
- Unlimited menu items
- Unlimited tables
- Multi-location, API Access, Custom Reports

## Development Phases

See [Development Plan](./02-development-phases.md) for detailed phase breakdown.

## Related Documentation

- [System Architecture](../01-architecture/01-system-architecture.md)
- [Features Overview](../02-features/)
- [API Documentation](../03-api/01-api-overview.md)
- [Getting Started](../06-development/01-getting-started.md)


