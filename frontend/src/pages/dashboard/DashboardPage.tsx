import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockDashboardStats, mockOrders, mockPopularItems, mockSalesData } from '@/mock/data/orders';
import { mockTables } from '@/mock/data/tables';
import { formatCurrency } from '@/lib/utils';

export function DashboardPage() {
  const { t } = useTranslation();
  const stats = mockDashboardStats;
  const recentOrders = mockOrders.slice(0, 5);
  const popularItems = mockPopularItems.slice(0, 5);
  const occupiedTables = mockTables.filter(t => t.status === 'occupied').length;
  const totalTables = mockTables.length;

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
            <div className="text-2xl font-bold">{formatCurrency(stats.todaySales)}</div>
            <div className="flex items-center text-sm text-green-600">
              <ArrowUpRight className="mr-1 h-4 w-4" />
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
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <div className="flex items-center text-sm text-green-600">
              <ArrowUpRight className="mr-1 h-4 w-4" />
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
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
            <div className="flex items-center text-sm text-red-600">
              <ArrowDownRight className="mr-1 h-4 w-4" />
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
            <div className="text-2xl font-bold">{stats.tableOccupancy}%</div>
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
            <div className="h-[300px] flex items-end justify-between gap-2">
              {mockSalesData.map((day, index) => {
                const maxSales = Math.max(...mockSalesData.map(d => d.sales));
                const height = (day.sales / maxSales) * 100;
                const isToday = index === mockSalesData.length - 4; // Thursday
                
                return (
                  <div key={day.name} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">
                        {formatCurrency(day.sales)}
                      </span>
                      <div 
                        className={`w-full rounded-t-md transition-all ${
                          isToday ? 'bg-primary' : 'bg-primary/30'
                        }`}
                        style={{ height: `${height * 2.5}px` }}
                      />
                    </div>
                    <span className={`text-xs mt-2 ${isToday ? 'font-bold' : 'text-muted-foreground'}`}>
                      {day.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Popular Items */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.popularItems')}</CardTitle>
            <CardDescription>{t('dashboard.topSellingItemsToday')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity} {t('common.sold')}</p>
                    </div>
                  </div>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
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
          <div className="space-y-4">
            {recentOrders.map((order) => {
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

              const getTimeAgo = (date: Date) => {
                const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
                if (minutes < 60) return `${minutes} min ago`;
                const hours = Math.floor(minutes / 60);
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
              };

              return (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.tableName}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{order.items.length} {t('common.items')}</p>
                    <p className="text-sm text-muted-foreground">{getTimeAgo(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

