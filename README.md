# 🍽️ Smart Restaurant Management System

A comprehensive, scalable restaurant management system designed to serve restaurants of all sizes - from small family-owned establishments to large multi-location chains.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

## ✨ Key Features

### 🍳 Kitchen Display System (KDS)
- Real-time order display with Socket.IO
- Station-based routing (Grill, Fryer, Prep, etc.)
- Color-coded priority (green → yellow → red)
- One-click bump system
- Audio alerts for new orders

### 📝 Flexible Order Management
- **Portal Mode**: Direct POS entry for small restaurants
- **Waiter App**: Mobile PWA for large restaurants
- QR code/link per table for external access
- Course timing and fire control
- Split bills and multiple payment methods

### 📦 Smart Inventory Management
- **Auto Stock Deduction**: Automatically deduct ingredients when orders are placed
- Recipe builder with ingredient mapping
- Unit conversion (g, kg, ml, L, units)
- Low stock alerts and notifications
- Purchase order generation
- Waste tracking

### 🪑 Table & Floor Management
- Visual drag-and-drop floor plan
- Real-time table status
- Reservation system
- Wait list management

### 📊 Analytics & Reporting
- Real-time sales dashboard
- Item performance analysis
- Staff performance tracking
- Food cost analysis
- Custom report builder

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Management  │  │   Waiter    │  │    KDS      │         │
│  │   Portal    │  │    App      │  │   Display   │         │
│  │  (React)    │  │   (PWA)     │  │   (PWA)     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/smart-restaurant.git
cd smart-restaurant

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cd ..
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
cd backend
npm run migrate

# Seed sample data (optional)
npm run seed

# Start development servers
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_restaurant

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# Frontend
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📁 Project Structure

```
smart-restaurant/
├── backend/
│   ├── src/
│   │   ├── config/           # Database, auth configuration
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Sequelize models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── sockets/          # Socket.IO handlers
│   │   ├── utils/            # Helper functions
│   │   └── app.js            # Express app
│   ├── migrations/           # Database migrations
│   ├── seeders/              # Sample data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── store/            # State management
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx
│   └── package.json
├── kds/                      # Kitchen Display PWA
├── waiter-app/               # Waiter Mobile PWA
├── docs/                     # Documentation
├── docker-compose.yml
└── README.md
```

## 💳 Subscription Tiers

| Feature | Starter ($49/mo) | Professional ($129/mo) | Enterprise ($299/mo) |
|---------|:----------------:|:----------------------:|:--------------------:|
| Users | 3 | 10 | Unlimited |
| Menu Items | 100 | 500 | Unlimited |
| Tables | 15 | 50 | Unlimited |
| KDS | ❌ | ✅ | ✅ |
| Waiter App | ❌ | ✅ | ✅ |
| Auto Stock Deduction | ❌ | ✅ | ✅ |
| Reservations | ❌ | ✅ | ✅ |
| Multi-Location | ❌ | ❌ | ✅ |
| Loyalty Program | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |

## 📖 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Comprehensive project overview
- [Feature Specifications](./docs/FEATURE_SPECIFICATIONS.md) - Detailed feature specs
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database design
- [API Documentation](./docs/API.md) - REST API reference

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Code Style

```bash
# Lint
npm run lint

# Format
npm run format
```

### Building for Production

```bash
# Build all
npm run build

# Build with Docker
docker-compose -f docker-compose.prod.yml build
```

## 🔐 Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- SQL injection prevention (Sequelize ORM)
- XSS protection
- HTTPS everywhere

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- Documentation: [docs.smartresto.com](https://docs.smartresto.com)
- Email: support@smartresto.com
- Issues: [GitHub Issues](https://github.com/your-org/smart-restaurant/issues)

---

Made with ❤️ for restaurants everywhere

