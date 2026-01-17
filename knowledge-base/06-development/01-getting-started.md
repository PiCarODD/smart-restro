# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or higher (20.x LTS recommended)
- **PostgreSQL**: 14+ (15+ recommended)
- **npm** or **yarn**: Package manager
- **Git**: Version control
- **Redis** (optional): For caching and Socket.IO adapter

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/smart-restaurant.git
cd smart-restaurant
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Setup Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend `.env`**:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smart_restaurant

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

**Frontend `.env`**:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 5. Setup Database

```bash
# Create PostgreSQL database
createdb smart_restaurant

# Or using psql
psql -U postgres
CREATE DATABASE smart_restaurant;
\q
```

### 6. Run Database Migrations

```bash
cd backend
npm run migrate
```

### 7. Seed Sample Data (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Demo tenant and restaurant
- Sample users (admin, manager, waiter, kitchen)
- Sample menu items and categories
- Sample tables and sections

### 8. Start Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### 9. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **API Docs**: http://localhost:3001/api-docs (if Swagger enabled)

## Default Login Credentials

After seeding, you can login with:

**Super Admin**:
- Email: `admin@smartresto.com`
- Password: `admin123`

**Restaurant Manager**:
- Email: `manager@demo.com`
- Password: `demo123`

**Waiter**:
- Email: `waiter@demo.com`
- Password: `demo123`

**Kitchen Staff**:
- Email: `kitchen@demo.com`
- Password: `demo123`

## Project Structure

```
smart-restaurant/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── middleware/  # Auth, validation
│   ├── migrations/      # Database migrations
│   └── seeders/         # Sample data
├── frontend/            # React/TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # API clients, utils
│   │   └── store/       # State management
│   └── public/          # Static assets
└── knowledge-base/      # Documentation
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Backend: Add controllers, routes, models
- Frontend: Add components, pages, API integration
- Database: Create migrations for schema changes

### 3. Test Your Changes

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

## Common Commands

### Backend

```bash
# Development server
npm run dev

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:undo

# Seed database
npm run seed

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint
```

## Troubleshooting

### Database Connection Issues

**Error**: `Connection refused` or `database does not exist`

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -l`
3. Verify `DATABASE_URL` in `.env`
4. Check PostgreSQL user permissions

### Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
1. Find process: `lsof -i :3001` (Mac/Linux) or `netstat -ano | findstr :3001` (Windows)
2. Kill process or change `PORT` in `.env`

### Migration Errors

**Error**: `Migration failed`

**Solution**:
1. Check database connection
2. Verify migration files are valid
3. Check for conflicting migrations
4. Rollback and re-run: `npm run migrate:undo` then `npm run migrate`

### Module Not Found

**Error**: `Cannot find module`

**Solution**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Verify package is in `package.json`

## Next Steps

- [Read Architecture Documentation](../01-architecture/01-system-architecture.md)
- [Review API Documentation](../03-api/01-api-overview.md)
- [Understand Security Guidelines](../05-security/01-security-overview.md)
- [Explore Features](../02-features/)

## Getting Help

- **Documentation**: Check `knowledge-base/` folder
- **Issues**: Create GitHub issue
- **Questions**: Contact development team

## Related Documentation

- [Development Workflow](./02-development-workflow.md)
- [Code Patterns](./03-code-patterns.md)
- [Testing Guidelines](./04-testing.md)
- [Troubleshooting](./05-troubleshooting.md)


