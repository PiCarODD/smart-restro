# QR Code Feature - User Flow Guide

## Overview

The QR Code feature is available for **Enterprise** subscription tier tenants. It allows customers to scan QR codes at their table to view menus, create orders, view their orders/invoices, and request bill payment.

## Access Requirements

- **Subscription Tier**: Enterprise
- **User Role**: Tenant Admin, Admin, Manager, Waiter, or Server
- **Feature**: QR Code Support

## User Flow

### 1. Waiter/Staff - Generate QR Code for Table

**Path**: Waiter App → Tables → Select Table → Show QR Code

**Steps**:
1. Log in to the Waiter App
2. Navigate to the Tables page
3. Click on an occupied table
4. In the table options dialog, click **"Show QR Code"**
5. The QR code dialog will display:
   - QR code image (scannable)
   - QR code URL
   - Generation timestamp
   - Expiry status
6. Options available:
   - **Regenerate**: Create a new QR code (invalidates the old one)
   - **Invalidate**: Manually expire the QR code
   - **Download**: Save QR code image
   - **Copy URL**: Copy the QR code URL to clipboard

**Alternative Path**: Admin Dashboard → Tables → Select Table → View QR Code

### 2. Customer - Scan QR Code

**Steps**:
1. Customer scans the QR code displayed at their table using their mobile device camera
2. The device automatically opens the QR code URL (e.g., `https://yourapp.com/qr/{token}`)
3. Customer is taken to the public QR view page (no login required)

### 3. Customer - Public QR View Page

**URL Format**: `/qr/{token}`

**Features Available**:

#### **Menu Tab**
- Browse restaurant menu organized by categories
- View item images, names, descriptions, and prices
- Add items to cart
- View cart summary with total
- Place order from cart

**Actions**:
- Click "Add to Cart" on any menu item
- Adjust quantities in cart
- Click "Place Order" to create order

#### **Orders Tab**
- View all unpaid orders for the table
- See order details:
  - Order number
  - Order status
  - Items ordered
  - Individual item prices
  - Order totals
  - Placed timestamp

**Auto-refresh**: Orders list updates every 10 seconds automatically

#### **Invoice Tab**
- View total invoice amount for all unpaid orders
- See breakdown by order
- **Request Payment** button:
  - Sends notification to restaurant staff (cashier/manager)
  - Staff receives notification to process payment
  - Customer sees confirmation message

### 4. Order Creation Flow (Customer)

1. Customer browses menu in the Menu tab
2. Adds items to cart
3. Reviews cart (items, quantities, total)
4. Clicks "Place Order"
5. Order is created and sent to kitchen
6. Success notification shown
7. Cart is cleared
8. Customer is redirected to Orders tab
9. New order appears in the orders list

### 5. Payment Request Flow (Customer)

1. Customer navigates to Invoice tab
2. Reviews total amount due
3. Clicks "Request Payment" button
4. Notification sent to restaurant staff
5. Customer sees: "Payment request sent to staff. They will be with you shortly."
6. Staff receives notification and processes payment

### 6. Payment Confirmation & QR Expiry

**Automatic Process**:
1. Cashier/Manager processes payment in POS system
2. Payment status changes to 'paid' for all table orders
3. System automatically invalidates QR code
4. QR code expires immediately
5. Socket.IO event notifies all connected clients
6. Customer's QR view page shows: "Payment confirmed. QR code is no longer valid."

**Manual Process** (Waiter):
1. Waiter can manually invalidate QR code from table options
2. Useful if customer leaves without paying or for security reasons

### 7. QR Code Lifecycle

```
┌─────────────────┐
│ Generate QR     │ → Waiter generates QR for table
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display QR      │ → QR shown at table (printed/displayed)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Customer Scans  │ → Opens public QR view page
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Browse Menu     │ → Customer views menu, adds items
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Order    │ → Order sent to kitchen
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Orders     │ → Customer tracks order status
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Request Payment │ → Customer requests bill
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payment Process │ → Staff processes payment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ QR Expires      │ → QR automatically invalidated
└─────────────────┘
```

## Access Points Summary

### For Staff/Waiters:
1. **Waiter App** → Tables → Table Options → Show QR Code
2. **Admin Dashboard** → Tables → Table Details → QR Code Section

### For Customers:
1. **Scan QR Code** → Opens `/qr/{token}` page
2. **Direct URL** (if shared): `https://yourapp.com/qr/{token}`

## Security Features

- **Token-based**: Each QR code uses a unique UUID token (non-guessable)
- **Auto-expiry**: QR codes expire when payment is confirmed
- **Rate limiting**: Public endpoints limited to 100 requests/minute per IP
- **Table-specific**: QR codes only work for their associated table
- **No authentication required**: Customers can scan without login

## Troubleshooting

### QR Code Not Generating
- **Check**: Subscription tier is Enterprise
- **Check**: User has appropriate role (waiter, manager, admin)
- **Check**: Table exists and is accessible

### QR Code Not Working (Customer)
- **Check**: QR code hasn't expired (payment confirmed)
- **Check**: Internet connection
- **Check**: QR code URL is correct

### Orders Not Appearing
- **Check**: Orders are unpaid (paid orders don't show)
- **Check**: Auto-refresh is working (10-second interval)
- **Check**: Network connection

### Payment Request Not Received
- **Check**: Staff are logged in and have notifications enabled
- **Check**: Staff have appropriate roles (manager, cashier, admin)
- **Check**: Socket.IO connection is active

## Feature Availability

- ✅ **Enterprise Plan**: Full access to QR code features
- ❌ **Professional Plan**: Not available
- ❌ **Starter Plan**: Not available

## Notes

- QR codes are generated per table
- Each table can have one active QR code at a time
- Regenerating a QR code invalidates the previous one
- QR codes remain valid until payment is confirmed
- Customers can create multiple orders via the same QR code
- All unpaid orders for a table are visible in the QR view
