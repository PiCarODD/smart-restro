# Smart Restaurant Backend API

Backend API for the Smart Restaurant Management System built with Node.js, Express, and PostgreSQL.

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_restaurant
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Create the database:
```sql
CREATE DATABASE smart_restaurant;
```

5. Run migrations:
```bash
npm run migrate
```

6. (Optional) Seed sample data:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Database Migrations

### Run migrations
```bash
npm run migrate
```

### Undo last migration
```bash
npm run migrate:undo
```

### Undo all migrations
```bash
npm run migrate:undo:all
```

## Project Structure

```
backend/
├── config/              # Database configuration
├── migrations/          # Database migrations
├── seeders/             # Database seeders
├── src/
│   ├── config/          # App configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── sockets/         # Socket.IO handlers
│   ├── utils/           # Utility functions
│   └── app.js           # Express app
└── package.json
```

## Database Schema

The database includes the following main tables:

- **tenants** - Multi-tenant SaaS tenants
- **restaurants** - Restaurant entities
- **users** - User accounts (admin, waiter, kitchen, etc.)
- **sections** - Floor sections
- **tables** - Restaurant tables
- **menu_categories** - Menu categories
- **menu_items** - Menu items
- **ingredient_categories** - Ingredient categories
- **ingredients** - Inventory ingredients
- **recipes** - Menu item recipes (ingredient mapping)
- **orders** - Customer orders
- **order_items** - Order line items
- **payments** - Payment records
- **inventory_transactions** - Stock movement history
- **taxes** - Tax configurations
- **feature_toggles** - Feature flags
- **audit_logs** - Activity logging
- **notifications** - User notifications

## API Documentation

API documentation will be available at `/api-docs` (Swagger/OpenAPI) once implemented.

## Development

- Run in development mode with auto-reload: `npm run dev`
- Run tests: `npm test`
- Watch tests: `npm run test:watch`

## Environment Variables

See `.env.example` for all available environment variables.

