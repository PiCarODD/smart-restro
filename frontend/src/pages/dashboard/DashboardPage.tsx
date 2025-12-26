import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { reportsApi, DailySales, TopSellingItem } from '@/lib/api/reportsApi';
import { ordersApi, Order } from '@/lib/api/ordersApi';
import { useTableStore } from '@/store/tableStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getApiError } from '@/lib/api/client';

export function DashboardPage() {
  const { t } = useTranslation();
  const { tables } = useTableStore();
  const { restaurantInfo } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState({
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    tips: 0,
  });
  const [weeklySales, setWeeklySales] = useState<DailySales[]>([]);
  const [popularItems, setPopularItems] = useState<TopSellingItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const todayEnd = today.toISOString().split('T')[0];
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartStr = todayStart.toISOString().split('T')[0];

        // Get last 7 days for weekly chart
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        // Load all dashboard data in parallel
        const [
          summaryRes,
          dailySalesRes,
          topItemsRes,
          ordersRes,
        ] = await Promise.all([
          reportsApi.getSummary({ startDate: todayStartStr, endDate: todayEnd }),
          reportsApi.getDailySales({ startDate: weekStartStr, endDate: todayEnd }),
          reportsApi.getTopSellingItems({ startDate: todayStartStr, endDate: todayEnd, limit: 5 }),
          ordersApi.list({ 
            limit: 5
          }),
        ]);

        setTodayStats(summaryRes.stats);
        setWeeklySales(dailySalesRes.sales);
        setPopularItems(topItemsRes.items);
        setRecentOrders(ordersRes.orders);
      } catch (err) {
        const apiError = getApiError(err);
        setError(apiError.message || 'Failed to load dashboard data');
        console.error('Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const totalTables = tables.length;
  const tableOccupancy = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} ${t('common.minAgo')}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ${hours > 1 ? t('common.hoursAgo') : t('common.hourAgo')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcomeBack')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.todaySales')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.revenue, currency)}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              {t('dashboard.fromYesterday')}
            </div>
          </CardContent>
        </Card>

        {/* Today's Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.todayOrders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.orders}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              {t('dashboard.ordersFromYesterday')}
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.avgOrderValue')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.avgOrder, currency)}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              {t('dashboard.avgFromYesterday')}
            </div>
          </CardContent>
        </Card>

        {/* Table Occupancy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.tableOccupancy')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableOccupancy}%</div>
            <div className="text-sm text-muted-foreground">
              {occupiedTables} {t('common.of')} {totalTables} {t('common.tablesOccupied')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.salesOverview')}</CardTitle>
            <CardDescription>{t('dashboard.dailySalesThisWeek')}</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklySales.length > 0 ? (
              <div className="h-[300px] flex items-end justify-between gap-2">
                {weeklySales.map((day, index) => {
                  const maxSales = Math.max(...weeklySales.map(d => d.revenue));
                  const height = maxSales > 0 ? (day.revenue / maxSales) * 100 : 0;
                  const isToday = index === weeklySales.length - 1;
                  
                  return (
                    <div key={day.date || index} className="flex flex-col items-center flex-1">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">
                          {formatCurrency(day.revenue, currency)}
                        </span>
                        <div 
                          className={`w-full rounded-t-md transition-all ${
                            isToday ? 'bg-primary' : 'bg-primary/30'
                          }`}
                          style={{ height: `${Math.max(height * 2.5, 5)}px`, minHeight: '5px' }}
                        />
                      </div>
                      <span className={`text-xs mt-2 ${isToday ? 'font-bold' : 'text-muted-foreground'}`}>
                        {day.dayShort || day.dayName?.substring(0, 3) || 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.popularItems')}</CardTitle>
            <CardDescription>{t('dashboard.topSellingItemsToday')}</CardDescription>
          </CardHeader>
          <CardContent>
            {popularItems.length > 0 ? (
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} {t('common.sold')}</p>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(item.revenue, currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                {t('common.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentOrders')}</CardTitle>
          <CardDescription>{t('dashboard.latestOrders')}</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.table?.name || `Table ${order.table?.tableNumber || 'N/A'}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{order.orderItems?.length || 0} {t('common.items')}</p>
                    <p className="text-sm text-muted-foreground">{getTimeAgo(order.placedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.totalAmount, currency)}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {t('common.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
