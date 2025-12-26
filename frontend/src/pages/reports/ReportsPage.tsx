import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Receipt, 
  Users,
  Calendar,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, getCurrencySymbol, cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { reportsApi, DailySales, HourlySales, CategoryBreakdown, TopSellingItem, StaffPerformance, PaymentMethod, InventoryUsage, SummaryStats } from '@/lib/api/reportsApi';
import { getApiError } from '@/lib/api/client';

type DateRange = 'today' | 'week' | 'month' | 'quarter';

// Helper function to calculate date range
function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  const endDate = today.toISOString().split('T')[0];

  const startDate = new Date();
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate,
  };
}

export function ReportsPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [activeTab, setActiveTab] = useState('sales');
  const { restaurantInfo } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';
  const currencySymbol = getCurrencySymbol(currency);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    tips: 0,
    tax: 0,
    discount: 0,
    total: 0,
  });

  // Load data when dateRange changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { startDate, endDate } = getDateRange(dateRange);

        // Load all reports data in parallel
        const [
          dailySalesRes,
          hourlySalesRes,
          categoryRes,
          topItemsRes,
          staffRes,
          paymentRes,
          inventoryRes,
          summaryRes,
        ] = await Promise.all([
          reportsApi.getDailySales({ startDate, endDate }),
          reportsApi.getHourlySales({ date: endDate }),
          reportsApi.getSalesByCategory({ startDate, endDate }),
          reportsApi.getTopSellingItems({ startDate, endDate, limit: 10 }),
          reportsApi.getStaffPerformance({ startDate, endDate }),
          reportsApi.getPaymentMethods({ startDate, endDate }),
          reportsApi.getInventoryUsage({ startDate, endDate }),
          reportsApi.getSummary({ startDate, endDate }),
        ]);

        setDailySales(dailySalesRes.sales);
        setHourlySales(hourlySalesRes.sales);
        setCategoryBreakdown(categoryRes.categories);
        setTopSellingItems(topItemsRes.items);
        setStaffPerformance(staffRes.staff);
        setPaymentMethods(paymentRes.methods);
        setInventoryUsage(inventoryRes.usage);
        setStats(summaryRes.stats);
      } catch (err) {
        const apiError = getApiError(err);
        setError(apiError.message || 'Failed to load reports data');
        console.error('Error loading reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  const StatCard = ({ 
    title, 
    value, 
    change = 0, 
    icon: Icon, 
    prefix = '' 
  }: { 
    title: string; 
    value: string | number; 
    change?: number; 
    icon: any; 
    prefix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{value}</div>
        {change !== 0 && (
          <div className={cn(
            "flex items-center text-xs mt-1",
            change >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(change)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );

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
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">Track your restaurant's performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('reports.today')}</SelectItem>
              <SelectItem value="week">{t('reports.week')}</SelectItem>
              <SelectItem value="month">{t('reports.month')}</SelectItem>
              <SelectItem value="quarter">{t('reports.quarter')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title={t('reports.totalRevenue')} 
          value={formatCurrency(stats.revenue, currency)} 
          icon={DollarSign} 
        />
        <StatCard 
          title={t('reports.totalOrders')} 
          value={stats.orders.toLocaleString()} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title={t('reports.averageOrder')} 
          value={formatCurrency(stats.avgOrder, currency)} 
          icon={Receipt} 
        />
        <StatCard 
          title={t('reports.tipsCollected')} 
          value={formatCurrency(stats.tips, currency)} 
          icon={Users} 
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">{t('reports.sales')}</TabsTrigger>
          <TabsTrigger value="items">{t('reports.items')}</TabsTrigger>
          <TabsTrigger value="staff">{t('reports.staff')}</TabsTrigger>
          <TabsTrigger value="inventory">{t('reports.inventory')}</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.revenueOverTime')}</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayShort" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${currencySymbol}${v}`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value), currency), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.salesByCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length > 0 ? (
                  <>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                      <Pie
                        data={categoryBreakdown as any}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                            {categoryBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.id || cat.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                          <span>{cat.name}</span>
                          <span className="text-muted-foreground ml-auto">{formatCurrency(cat.value, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Hourly Sales */}
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.hourlySales')}</CardTitle>
                <CardDescription>Peak hours analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlySales.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlySales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(v) => `${currencySymbol}${v}`} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value), currency), 'Sales']} />
                        <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.paymentMethods')}</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {paymentMethods.map((method) => (
                    <div key={method.method} className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">{method.method}</p>
                      <p className="text-2xl font-bold">{formatCurrency(method.amount, currency)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary">{method.percentage}%</Badge>
                        <span className="text-sm text-muted-foreground">{method.count} {t('reports.transactions')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.topSellingItems')}</CardTitle>
              <CardDescription>{t('reports.bestPerforming')}</CardDescription>
            </CardHeader>
            <CardContent>
              {topSellingItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>{t('reports.item')}</TableHead>
                      <TableHead>{t('reports.category')}</TableHead>
                      <TableHead className="text-right">{t('reports.qtySold')}</TableHead>
                      <TableHead className="text-right">{t('reports.revenue')}</TableHead>
                      <TableHead className="text-right">{t('reports.trend')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.revenue, currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "flex items-center justify-end gap-1",
                            item.trend >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {item.trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {Math.abs(item.trend)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Category Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.categoryPerformance')}</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryBreakdown.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown as any} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${currencySymbol}${v}`} />
                      <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value), currency), 'Sales']} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.staffPerformance')}</CardTitle>
              <CardDescription>{t('reports.serverMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              {staffPerformance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.name')}</TableHead>
                      <TableHead>{t('reports.role')}</TableHead>
                      <TableHead className="text-right">{t('reports.orders')}</TableHead>
                      <TableHead className="text-right">{t('reports.revenue')}</TableHead>
                      <TableHead className="text-right">{t('reports.tips')}</TableHead>
                      <TableHead className="text-right">{t('reports.avgService')}</TableHead>
                      <TableHead className="text-right">{t('reports.rating')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffPerformance.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{staff.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{staff.orders || '-'}</TableCell>
                        <TableCell className="text-right">
                          {staff.revenue ? formatCurrency(staff.revenue, currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {staff.tips ? formatCurrency(staff.tips, currency) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {staff.avgTime ? `${staff.avgTime} min` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {staff.rating ? (
                            <Badge className={cn(
                              staff.rating >= 4.8 ? "bg-green-100 text-green-700" :
                              staff.rating >= 4.5 ? "bg-yellow-100 text-yellow-700" :
                              "bg-orange-100 text-orange-700"
                            )}>
                              ⭐ {staff.rating.toFixed(1)}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.inventoryUsage')}</CardTitle>
              <CardDescription>{t('reports.ingredientsUsed')}</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryUsage.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.ingredient')}</TableHead>
                      <TableHead className="text-right">{t('reports.quantityUsed')}</TableHead>
                      <TableHead className="text-right">{t('reports.cost')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryUsage.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">
                          {item.used} {item.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.cost, currency)}
                        </TableCell>
                        <TableCell>
                          {item.reorderNeeded ? (
                            <Badge variant="destructive">Reorder Needed</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-12">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.totalInventoryCost')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(inventoryUsage.reduce((sum, i) => sum + i.cost, 0), currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('reports.forThisPeriod')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.itemsNeedingReorder')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {inventoryUsage.filter(i => i.reorderNeeded).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('reports.lowStockItems')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.foodCostRatio')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.revenue > 0 
                    ? ((inventoryUsage.reduce((sum, i) => sum + i.cost, 0) / stats.revenue) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('reports.ofTotalRevenue')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
