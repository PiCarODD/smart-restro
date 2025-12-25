# Database Seeders

This directory contains seed scripts to populate the database with sample data for development and testing.

## Available Seeders

### 1. Demo Tenant and Users (`20241226000001-demo-tenant-and-users.js`)
Creates a demo tenant, restaurant, and user accounts with different roles.

**Credentials Created**:

| Role | Email | Password | PIN | Access Level |
|------|-------|----------|-----|--------------|
| Admin | admin@demo.com | password123 | - | Full access |
| Manager | manager@demo.com | password123 | - | Restaurant management |
| Cashier | cashier@demo.com | password123 | 1111 | POS, payments |
| Waiter | waiter@demo.com | 1234 | 1234 | Waiter app access |
| Server | server@demo.com | 5678 | 5678 | Waiter app access |
| Kitchen | kitchen@demo.com | password123 | 9999 | KDS access |
| Inventory | inventory@demo.com | password123 | - | Inventory management |

### 2. Demo Data (`20241226000002-demo-data.js`)
Creates sample data for the demo restaurant:
- 3 sections (Main Dining, Outdoor Patio, VIP Section)
- 20 tables (distributed across sections)
- 1 tax configuration (8% sales tax)
- 4 menu categories (Appetizers, Main Courses, Desserts, Beverages)
- 8 menu items (with variants and modifiers)

## Usage

### Run All Seeders
```bash
npm run seed
```

### Run Specific Seeder
```bash
npx sequelize-cli db:seed --seed 20241226000001-demo-tenant-and-users.js
npx sequelize-cli db:seed --seed 20241226000002-demo-data.js
```

### Undo All Seeders
```bash
npm run seed:undo
```

### Undo Specific Seeder
```bash
npx sequelize-cli db:seed:undo --seed 20241226000001-demo-tenant-and-users.js
```

## Setup Instructions

1. **Run migrations first**:
   ```bash
   npm run migrate
   ```

2. **Run seeders**:
   ```bash
   npm run seed
   ```

3. **Verify data**:
   - Check database for seeded records
   - Try logging in with demo credentials
   - Verify restaurant, tables, and menu items exist

## Notes

- Seeders are idempotent - running them multiple times will create duplicates
- Use `seed:undo` before re-running if you want fresh data
- Demo passwords are for development only - change in production!
- PIN codes are stored as plain text hashes in the database (for PIN-based login)

## Testing with Frontend

After seeding, you can:

1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Login at `http://localhost:5173/login` using:
   - Email: `admin@demo.com`
   - Password: `password123`

4. Or use PIN login (waiter app):
   - PIN: `1234` (waiter) or `5678` (server)

## Customization

You can modify the seeders to:
- Add more users
- Create additional restaurants
- Add more menu items
- Create sample orders
- Add inventory data

Make sure to maintain the UUID format and proper foreign key relationships.

