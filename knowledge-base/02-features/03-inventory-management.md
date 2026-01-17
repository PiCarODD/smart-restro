# Inventory & Stock Management

## Overview

The Inventory Management System provides comprehensive stock tracking, automatic deduction, recipe management, and low stock alerts to help restaurants maintain optimal inventory levels.

## Core Features

### Automatic Stock Deduction
- **Trigger Options** (configurable):
  - On Order Placed
  - On Order Confirmed
  - On Order Completed (default)
- **Recipe Mapping**: Menu items mapped to ingredients
- **Unit Conversion**: Automatic conversion (g, kg, ml, L, units)
- **Transaction Logging**: All deductions tracked

### Recipe Builder
- Define ingredients per menu item
- Specify quantities and units
- Support for multiple units per ingredient
- Recipe versioning (future)

### Stock Tracking
- Current stock levels
- Minimum stock thresholds
- Low stock alerts
- Stock history/transactions
- Stock adjustments (manual)

### Supplier Management
- Supplier database
- Purchase order generation
- Cost tracking
- Delivery management

## Recipe Structure

### Recipe Mapping Example
```
Menu Item: Fried Rice
├── Rice: 200g
├── Cooking Oil: 30ml
├── Salt: 5g
├── Chicken: 100g
├── Egg: 1 unit
├── Soy Sauce: 15ml
├── Green Onion: 20g
└── Garlic: 10g
```

### Recipe Entity
```typescript
interface Recipe {
  id: string;
  menuItemId: string;
  ingredientId: string;
  quantity: number;
  unit: string;  // g, kg, ml, L, unit, etc.
}
```

## Ingredient Management

### Ingredient Entity
```typescript
interface Ingredient {
  id: string;
  name: string;
  categoryId: string;
  unit: string;           // Base unit (g, ml, unit)
  currentStock: number;
  minStock: number;       // Low stock threshold
  maxStock?: number;      // Optional max stock
  costPerUnit: number;
  supplierId?: string;
  restaurantId: string;
}
```

### Ingredient Categories
- Organize ingredients by category
- Examples: Proteins, Vegetables, Spices, Beverages
- Category-based filtering and reporting

## Stock Operations

### Stock Adjustment
Manual stock adjustments for:
- Stock received (purchase)
- Stock wasted/spoiled
- Stock correction
- Stock transfer (multi-location)

**Transaction Types**:
- `purchase` - Stock received
- `waste` - Stock wasted/spoiled
- `adjustment` - Manual correction
- `deduction` - Auto deduction from order
- `transfer_in` - Received from another location
- `transfer_out` - Sent to another location

### Stock History
- Complete transaction log
- Filter by date range
- Filter by ingredient
- Filter by transaction type
- Export to CSV

## Low Stock Alerts

### Alert Triggers
- Stock falls below minimum threshold
- Real-time notification
- Email/SMS alerts (optional)
- Dashboard notification

### Alert Configuration
- Per-ingredient thresholds
- Alert frequency (immediate, daily summary)
- Alert recipients (inventory manager, owner)

## Purchase Orders

### Auto-Generation
- Based on low stock alerts
- Based on sales forecasting
- Manual creation

### Purchase Order Structure
```typescript
interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  totalCost: number;
  expectedDeliveryDate?: Date;
}
```

## API Endpoints

### Ingredients

#### GET /api/inventory/ingredients
Get ingredients list.

**Query Parameters**:
- `categoryId`: Filter by category
- `lowStock`: Show only low stock items
- `search`: Search by name

#### POST /api/inventory/ingredients
Create ingredient.

**Request Body**:
```json
{
  "name": "Chicken Breast",
  "categoryId": "uuid",
  "unit": "kg",
  "currentStock": 10,
  "minStock": 5,
  "costPerUnit": 8.50
}
```

#### PUT /api/inventory/ingredients/:id
Update ingredient.

#### DELETE /api/inventory/ingredients/:id
Delete ingredient (soft delete if used in recipes).

### Stock Adjustments

#### POST /api/inventory/adjust
Adjust stock.

**Request Body**:
```json
{
  "ingredientId": "uuid",
  "quantityChange": 10,
  "type": "purchase",
  "notes": "Received from supplier",
  "cost": 85.00
}
```

#### GET /api/inventory/transactions
Get stock transaction history.

**Query Parameters**:
- `ingredientId`: Filter by ingredient
- `type`: Filter by transaction type
- `startDate`: Start date
- `endDate`: End date

### Recipes

#### GET /api/inventory/recipes/:menuItemId
Get recipe for menu item.

#### POST /api/inventory/recipes
Create/update recipe.

**Request Body**:
```json
{
  "menuItemId": "uuid",
  "ingredients": [
    {
      "ingredientId": "uuid",
      "quantity": 200,
      "unit": "g"
    }
  ]
}
```

#### DELETE /api/inventory/recipes/:menuItemId/ingredients/:ingredientId
Remove ingredient from recipe.

### Stock Levels

#### GET /api/inventory/stock-levels
Get current stock levels.

**Query Parameters**:
- `lowStock`: Show only low stock
- `categoryId`: Filter by category

## Auto Deduction Flow

### When Order Item is Completed

1. **Find Recipe**: Get recipe for menu item
2. **Calculate Quantities**: 
   - Recipe quantity × Order item quantity
   - Apply unit conversions if needed
3. **Deduct Stock**: 
   - Update ingredient `currentStock`
   - Create inventory transaction
4. **Check Thresholds**: 
   - If stock < minStock, trigger alert
5. **Log Transaction**: 
   - Record deduction in transaction log

### Unit Conversion

Supported units:
- **Weight**: g, kg, oz, lb
- **Volume**: ml, L, fl oz, cup
- **Count**: unit, piece, each

Conversion handled automatically based on ingredient base unit.

## Reporting

### Inventory Reports
- **Stock Levels**: Current stock by category
- **Usage Report**: Ingredient usage over time
- **Waste Report**: Waste tracking and analysis
- **Cost Analysis**: Food cost per menu item
- **Purchase History**: Historical purchases

### Food Cost Calculation
```
Food Cost = Sum of (Ingredient Cost × Recipe Quantity) for all ingredients in menu item
Food Cost % = (Food Cost / Menu Item Price) × 100
```

## Best Practices

### Recipe Management
- Keep recipes up-to-date
- Use consistent units
- Review recipes regularly
- Document special cases

### Stock Tracking
- Regular stock takes
- Accurate minimum thresholds
- Timely stock adjustments
- Monitor waste patterns

### Auto Deduction
- Test with sample orders
- Monitor deduction accuracy
- Handle edge cases (missing recipes)
- Review transaction logs

## Troubleshooting

### Stock Not Deducting
1. Check if auto-deduction is enabled
2. Verify recipe exists for menu item
3. Check order status (deduction trigger)
4. Review transaction logs

### Incorrect Stock Levels
1. Review transaction history
2. Check for missing adjustments
3. Verify recipe quantities
4. Perform stock take

### Low Stock Alerts Not Working
1. Check minimum stock thresholds
2. Verify alert configuration
3. Check notification settings
4. Review alert logs

## Related Documentation

- [Order Management](./02-order-management.md)
- [Menu Management](./04-menu-management.md)
- [Reports & Analytics](./08-analytics-reporting.md)


