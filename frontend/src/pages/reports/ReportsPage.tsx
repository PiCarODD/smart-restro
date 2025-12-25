import { useState, useMemo } from 'react';
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
import {
  generateDailySales,
  generateHourlySales,
  categoryBreakdown,
  topSellingItems,
  staffPerformance,
  paymentMethods,
  inventoryUsage,
  calculateSummaryStats,
} from '@/mock/data/reports';

type DateRange = 'today' | 'week' | 'month' | 'quarter';

export function ReportsPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [activeTab, setActiveTab] = useState('sales');
  const { restaurantInfo } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';
  const currencySymbol = getCurrencySymbol(currency);

  // Generate data based on date range
  const dailySales = useMemo(() => generateDailySales(), []);
  const hourlySales = useMemo(() => generateHourlySales(), []);
  const stats = useMemo(() => calculateSummaryStats(dailySales), [dailySales]);

  const filteredSales = useMemo(() => {
    switch (dateRange) {
      case 'today':
        return dailySales.slice(-1);
      case 'week':
        return dailySales.slice(-7);
      case 'month':
        return dailySales;
      case 'quarter':
        return dailySales;
      default:
        return dailySales.slice(-7);
    }
  }, [dailySales, dateRange]);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    prefix = '' 
  }: { 
    title: string; 
    value: string | number; 
    change: number; 
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
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
          value={formatCurrency(stats.revenue)} 
          change={stats.revenueChange} 
          icon={DollarSign} 
        />
        <StatCard 
          title={t('reports.totalOrders')} 
          value={stats.orders.toLocaleString()} 
          change={stats.ordersChange} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title={t('reports.averageOrder')} 
          value={formatCurrency(stats.avgOrder)} 
          change={stats.avgOrderChange} 
          icon={Receipt} 
        />
        <StatCard 
          title={t('reports.tipsCollected')} 
          value={formatCurrency(stats.tips)} 
          change={stats.tipsChange} 
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
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredSales}>
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
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                      <span className="text-muted-foreground ml-auto">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hourly Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Sales by Hour</CardTitle>
                <CardDescription>Peak hours analysis</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.paymentMethods')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{method.method}</p>
                    <p className="text-2xl font-bold">{formatCurrency(method.amount)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary">{method.percentage}%</Badge>
                      <span className="text-sm text-muted-foreground">{method.count} {t('reports.transactions')}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                        {formatCurrency(item.revenue)}
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
            </CardContent>
          </Card>

          {/* Category Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `${currencySymbol}${v}`} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value), currency), 'Sales']} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
                        {staff.revenue ? formatCurrency(staff.revenue) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {staff.tips ? formatCurrency(staff.tips) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {staff.avgTime || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn(
                          staff.rating >= 4.8 ? "bg-green-100 text-green-700" :
                          staff.rating >= 4.5 ? "bg-yellow-100 text-yellow-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          ⭐ {staff.rating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                        {formatCurrency(item.cost)}
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
                  {formatCurrency(inventoryUsage.reduce((sum, i) => sum + i.cost, 0))}
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
                  {((inventoryUsage.reduce((sum, i) => sum + i.cost, 0) / stats.revenue) * 100).toFixed(1)}%
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

