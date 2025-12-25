import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, ShoppingCart, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableStore } from '@/store/tableStore';
import { useOrderStore } from '@/store/orderStore';
import { Table, TableStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function WaiterTablesPage() {
  const { t } = useTranslation();
  
  const statusConfig: Record<TableStatus, { label: string; color: string; bgColor: string }> = {
    available: { label: t('waiter.available'), color: 'text-green-700', bgColor: 'bg-green-500' },
    occupied: { label: t('waiter.occupied'), color: 'text-red-700', bgColor: 'bg-red-500' },
    reserved: { label: t('waiter.reserved'), color: 'text-yellow-700', bgColor: 'bg-yellow-500' },
    cleaning: { label: t('waiter.cleaning'), color: 'text-blue-700', bgColor: 'bg-blue-500' },
    blocked: { label: t('waiter.blocked'), color: 'text-gray-700', bgColor: 'bg-gray-500' },
  };
  const navigate = useNavigate();
  const { tables, sections, loadTables } = useTableStore();
  const { loadOrders, getActiveOrderByTable } = useOrderStore();
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    loadTables();
    loadOrders();
  }, [loadTables, loadOrders]);

  const filteredTables = activeSection === 'all' 
    ? tables 
    : tables.filter(t => t.section === activeSection);

  const handleTableClick = (table: Table) => {
    navigate(`/waiter/pos/${table.id}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-green-50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-700">
              {tables.filter(t => t.status === 'available').length}
            </div>
            <div className="text-xs text-green-600">{t('waiter.available')}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-red-700">
              {tables.filter(t => t.status === 'occupied').length}
            </div>
            <div className="text-xs text-red-600">{t('waiter.occupied')}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {tables.filter(t => t.status === 'reserved').length}
            </div>
            <div className="text-xs text-yellow-600">{t('waiter.reserved')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" className="flex-1">{t('common.all')}</TabsTrigger>
          {sections.map(section => (
            <TabsTrigger key={section.id} value={section.name} className="flex-1">
              {section.icon} {section.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredTables.map((table) => {
          const status = statusConfig[table.status];
          const activeOrder = getActiveOrderByTable(table.id);
          
          return (
            <Card 
              key={table.id}
              className={cn(
                "relative overflow-hidden cursor-pointer active:scale-95 transition-all",
                table.status === 'available' && "border-green-200 bg-green-50/50",
                table.status === 'occupied' && "border-red-200 bg-red-50/50"
              )}
              onClick={() => handleTableClick(table)}
            >
              {/* Status indicator */}
              <div className={cn("absolute top-0 left-0 right-0 h-1", status.bgColor)} />
              
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-lg">{table.tableNumber}</span>
                    {table.name && (
                      <p className="text-xs text-muted-foreground">{table.name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {table.capacity}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs", status.bgColor)}>
                    {status.label}
                  </Badge>
                  
                  {table.status === 'occupied' && table.occupiedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(table.occupiedAt), { addSuffix: false })}
                    </span>
                  )}
                </div>

                {/* Active Order */}
                {activeOrder && (
                  <div className="mt-2 pt-2 border-t text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{activeOrder.orderNumber}</span>
                      <span className="font-medium">{formatCurrency(activeOrder.total)}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {activeOrder.items.length} {t('common.items')} • {activeOrder.status}
                    </p>
                  </div>
                )}

                {/* Quick Action Indicator */}
                <div className="absolute bottom-2 right-2">
                  {table.status === 'available' ? (
                    <Plus className="h-5 w-5 text-green-600" />
                  ) : activeOrder ? (
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

