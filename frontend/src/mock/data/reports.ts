import { subDays, format } from 'date-fns';

// Generate daily sales data for the past 30 days
export const generateDailySales = () => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRevenue = isWeekend ? 2500 : 1800;
    const revenue = baseRevenue + Math.random() * 1000 - 500;
    const orders = Math.floor(revenue / 45);
    
    days.push({
      date: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayShort: format(date, 'MM/dd'),
      revenue: Math.round(revenue * 100) / 100,
      orders,
      avgOrder: Math.round((revenue / orders) * 100) / 100,
      tips: Math.round(revenue * 0.12 * 100) / 100,
    });
  }
  return days;
};

// Sales by hour data
export const generateHourlySales = () => {
  const hours = [];
  const peakHours = [12, 13, 18, 19, 20];
  
  for (let h = 11; h <= 22; h++) {
    const isPeak = peakHours.includes(h);
    const baseSales = isPeak ? 450 : 180;
    const sales = baseSales + Math.random() * 150 - 75;
    
    hours.push({
      hour: `${h}:00`,
      sales: Math.round(sales),
      orders: Math.floor(sales / 42),
    });
  }
  return hours;
};

// Category breakdown
export const categoryBreakdown = [
  { name: 'Main Course', value: 4520, color: '#3b82f6', orders: 156 },
  { name: 'Appetizers', value: 1890, color: '#10b981', orders: 142 },
  { name: 'Beverages', value: 1240, color: '#f59e0b', orders: 248 },
  { name: 'Desserts', value: 980, color: '#ef4444', orders: 89 },
  { name: 'Sides', value: 620, color: '#8b5cf6', orders: 124 },
];

// Top selling items
export const topSellingItems = [
  { id: '1', name: 'Pad Thai', category: 'Main Course', quantity: 156, revenue: 1404, trend: 12 },
  { id: '2', name: 'Fried Rice', category: 'Main Course', quantity: 142, revenue: 1278, trend: 8 },
  { id: '3', name: 'Tom Yum Soup', category: 'Appetizers', quantity: 98, revenue: 882, trend: -3 },
  { id: '4', name: 'Green Curry', category: 'Main Course', quantity: 87, revenue: 1044, trend: 15 },
  { id: '5', name: 'Spring Rolls', category: 'Appetizers', quantity: 134, revenue: 670, trend: 5 },
  { id: '6', name: 'Mango Sticky Rice', category: 'Desserts', quantity: 76, revenue: 608, trend: 22 },
  { id: '7', name: 'Thai Iced Tea', category: 'Beverages', quantity: 198, revenue: 594, trend: 10 },
  { id: '8', name: 'Massaman Curry', category: 'Main Course', quantity: 64, revenue: 832, trend: -5 },
];

// Staff performance
export const staffPerformance = [
  { id: '1', name: 'Sarah Johnson', role: 'Server', orders: 89, revenue: 3842, tips: 461, avgTime: 12, rating: 4.8 },
  { id: '2', name: 'Mike Chen', role: 'Server', orders: 76, revenue: 3280, tips: 394, avgTime: 14, rating: 4.6 },
  { id: '3', name: 'Emily Davis', role: 'Server', orders: 82, revenue: 3540, tips: 425, avgTime: 11, rating: 4.9 },
  { id: '4', name: 'John Smith', role: 'Server', orders: 68, revenue: 2936, tips: 352, avgTime: 15, rating: 4.5 },
  { id: '5', name: 'Lisa Wang', role: 'Host', orders: 0, revenue: 0, tips: 0, avgTime: 0, rating: 4.7 },
];

// Payment methods breakdown
export const paymentMethods = [
  { method: 'Credit Card', amount: 6240, percentage: 62, count: 142 },
  { method: 'Cash', amount: 2010, percentage: 20, count: 56 },
  { method: 'Debit Card', amount: 1206, percentage: 12, count: 34 },
  { method: 'Mobile Pay', amount: 604, percentage: 6, count: 18 },
];

// Inventory usage report
export const inventoryUsage = [
  { id: '1', name: 'Rice', used: 45, unit: 'kg', cost: 67.50, reorderNeeded: false },
  { id: '2', name: 'Chicken Breast', used: 32, unit: 'kg', cost: 256.00, reorderNeeded: true },
  { id: '3', name: 'Vegetable Oil', used: 8, unit: 'L', cost: 32.00, reorderNeeded: false },
  { id: '4', name: 'Soy Sauce', used: 4, unit: 'L', cost: 24.00, reorderNeeded: false },
  { id: '5', name: 'Garlic', used: 3, unit: 'kg', cost: 18.00, reorderNeeded: true },
  { id: '6', name: 'Fish Sauce', used: 2.5, unit: 'L', cost: 20.00, reorderNeeded: false },
  { id: '7', name: 'Coconut Milk', used: 12, unit: 'can', cost: 36.00, reorderNeeded: false },
  { id: '8', name: 'Eggs', used: 120, unit: 'pcs', cost: 24.00, reorderNeeded: true },
];

// Summary stats calculator
export const calculateSummaryStats = (days: ReturnType<typeof generateDailySales>) => {
  const total = days.reduce((acc, day) => ({
    revenue: acc.revenue + day.revenue,
    orders: acc.orders + day.orders,
    tips: acc.tips + day.tips,
  }), { revenue: 0, orders: 0, tips: 0 });

  const previousPeriod = {
    revenue: total.revenue * (0.85 + Math.random() * 0.2),
    orders: total.orders * (0.85 + Math.random() * 0.2),
    tips: total.tips * (0.85 + Math.random() * 0.2),
  };

  return {
    revenue: Math.round(total.revenue * 100) / 100,
    orders: total.orders,
    avgOrder: Math.round((total.revenue / total.orders) * 100) / 100,
    tips: Math.round(total.tips * 100) / 100,
    revenueChange: Math.round(((total.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100),
    ordersChange: Math.round(((total.orders - previousPeriod.orders) / previousPeriod.orders) * 100),
    avgOrderChange: Math.round(Math.random() * 10 - 5),
    tipsChange: Math.round(((total.tips - previousPeriod.tips) / previousPeriod.tips) * 100),
  };
};

