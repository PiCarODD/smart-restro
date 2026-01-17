import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigationStore } from '@/store/navigationStore';
import { Plus, Users, Clock, Pencil, Trash2, Settings2, ShoppingCart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTableStore } from '@/store/tableStore';
import { useOrderStore } from '@/store/orderStore';
import { Table, TableStatus } from '@/types';
import { TableDialog } from '@/components/features/tables/TableDialog';
import { SectionManager } from '@/components/features/tables/SectionManager';
import { NoSectionsPrompt } from '@/components/features/tables/NoSectionsPrompt';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export function TablesPage() {
  const { t } = useTranslation();
  const { navigate } = useNavigationStore();
  const { tables, sections, loadTables, loadSections, updateTableStatus, deleteTable, isLoading, error, clearError } = useTableStore();
  const { getOrdersByTable, loadOrders } = useOrderStore();

  const statusConfig: Record<TableStatus, { label: string; color: string; bgColor: string }> = {
    available: { label: t('tables.available'), color: 'text-green-700', bgColor: 'bg-green-100' },
    occupied: { label: t('tables.occupied'), color: 'text-red-700', bgColor: 'bg-red-100' },
    reserved: { label: t('tables.reserved'), color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    cleaning: { label: t('tables.cleaning'), color: 'text-blue-700', bgColor: 'bg-blue-100' },
    blocked: { label: t('tables.blocked'), color: 'text-gray-700', bgColor: 'bg-gray-100' },
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);
  const [isTableOptionsOpen, setIsTableOptionsOpen] = useState(false);
  const [shouldOpenTableDialogAfterSection, setShouldOpenTableDialogAfterSection] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeSection, setActiveSection] = useState('all');
  const [showNoSectionsPrompt, setShowNoSectionsPrompt] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await loadSections();
      await loadTables();
      await loadOrders();
    };
    loadData();
  }, []);

  // Auto-open table dialog after section is created
  useEffect(() => {
    if (shouldOpenTableDialogAfterSection && sections.length > 0 && !isSectionManagerOpen) {
      setShouldOpenTableDialogAfterSection(false);
      setIsDialogOpen(true);
    }
  }, [sections.length, shouldOpenTableDialogAfterSection, isSectionManagerOpen]);

  const filteredTables = activeSection === 'all'
    ? tables
    : tables.filter(t => t.section === activeSection);

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const getSectionColor = (sectionName: string) => {
    return sections.find(s => s.name === sectionName)?.color || '#6b7280';
  };

  const getSectionIcon = (sectionName: string) => {
    const icon = sections.find(s => s.name === sectionName)?.icon;
    // Only return icon if it exists and is not empty, otherwise return default
    return (icon && icon.trim()) ? icon : '📍';
  };

  const openCreateDialog = () => {
    // Check if sections exist
    if (sections.length === 0) {
      setShowNoSectionsPrompt(true);
      return;
    }
    setEditingTable(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (table: Table) => {
    setEditingTable(table);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (table: Table) => {
    setDeletingTable(table);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingTable) {
      try {
        await deleteTable(deletingTable.id);
        setIsDeleteDialogOpen(false);
        setDeletingTable(null);
      } catch (error) {
        console.error('Failed to delete table:', error);
      }
    }
  };

  // Check if table has unpaid orders (any active orders that aren't completed/cancelled)
  const hasUnpaidOrders = (tableId: string): boolean => {
    const tableOrders = getOrdersByTable(tableId);
    // If there are any active orders (not completed or cancelled), consider them unpaid
    // The backend will enforce the actual payment check
    return tableOrders.some(order => 
      order.status !== 'completed' && 
      order.status !== 'cancelled'
    );
  };

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    try {
      await updateTableStatus(tableId, status);
      await loadTables(); // Reload tables to reflect changes
      await loadOrders(); // Reload orders to update unpaid check
    } catch (error: any) {
      console.error('Failed to update table status:', error);
      // Show error message to user
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update table status';
      // Show error to user - you might want to use a toast library instead of alert
      alert(errorMessage); // Simple alert for now - you might want to use a toast library
    }
  };

  const handleTableClick = (table: Table) => {
    if (table.status === 'occupied') {
      // Show options dialog for occupied tables
      setSelectedTable(table);
      setIsTableOptionsOpen(true);
      return;
    }
    // Navigate to POS for available tables
    navigate('pos', { tableId: table.id });
  };

  const handleAddOrder = (table: Table) => {
    setIsTableOptionsOpen(false);
    setSelectedTable(null);
    navigate('pos', { tableId: table.id });
  };

  const handleViewOrders = (table: Table) => {
    setIsTableOptionsOpen(false);
    setSelectedTable(null);
    navigate('tables.orders', { tableId: table.id });
  };

  const getTableOrders = (tableId: string) => {
    return getOrdersByTable(tableId).filter(order =>
      !['completed', 'cancelled'].includes(order.status)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>×</Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tables.title')}</h1>
          <p className="text-muted-foreground">{t('tables.clickToStartOrder')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSectionManagerOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            {t('tables.manageSections')}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tables.addTable')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('tables.totalTables')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('all')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t('tables.available')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">{t('tables.occupied')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">{t('tables.reserved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State - No Sections */}
      {sections.length === 0 && !isLoading && (
        <Card className="p-12">
          <EmptyState
            title="No sections yet"
            description="Create a section to organize your restaurant floor plan before adding tables."
            action={{
              label: 'Create Section',
              onClick: () => setIsSectionManagerOpen(true),
            }}
          />
        </Card>
      )}

      {/* Section Tabs */}
      {sections.length > 0 && (
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList>
            <TabsTrigger value="all">
              {t('tables.allSections')}
            </TabsTrigger>
            {sections.map(section => (
              <TabsTrigger key={section.id} value={section.name} className="gap-2">
                <span>{section.icon}</span>
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeSection} className="mt-6">
            {/* Tables Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredTables.map((table) => {
              const status = statusConfig[table.status];
              const sectionColor = getSectionColor(table.section);
              const tableOrders = getTableOrders(table.id);
              const combinedTotal = tableOrders.reduce((sum, order) => sum + order.total, 0);
              const totalItems = tableOrders.reduce((sum, order) => sum + order.items.length, 0);

              return (
                <Card
                  key={table.id}
                  className={`relative overflow-hidden cursor-pointer hover:shadow-lg transition-all ${table.status === 'occupied' ? 'ring-2 ring-red-200' : 'hover:ring-2 hover:ring-primary/50'
                    }`}
                  onClick={() => handleTableClick(table)}
                >
                  {/* Status indicator */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: sectionColor }}
                  />

                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.bgColor} ${status.color}`} />
                        <span className="font-bold text-lg">{table.tableNumber}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => openEditDialog(table)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('tables.editTable')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(table.id, 'available')}
                            disabled={table.status === 'available' || hasUnpaidOrders(table.id)}
                          >
                            {t('tables.markAvailable')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(table.id, 'occupied')}
                            disabled={table.status === 'occupied'}
                          >
                            {t('tables.markOccupied')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(table.id, 'reserved')}
                            disabled={table.status === 'reserved' || hasUnpaidOrders(table.id)}
                          >
                            {t('tables.markReserved')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(table.id, 'cleaning')}
                            disabled={table.status === 'cleaning' || hasUnpaidOrders(table.id)}
                          >
                            {t('tables.markCleaning')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(table)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {table.name && (
                      <p className="text-sm text-muted-foreground mb-2">{table.name}</p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <span>{getSectionIcon(table.section)}</span>
                      <span>{table.section}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{table.capacity}</span>
                      </div>
                      {table.status === 'occupied' && table.occupiedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(table.occupiedAt), { addSuffix: false })}</span>
                        </div>
                      )}
                    </div>

                    <Badge className={`${status.bgColor} ${status.color} border-0`}>
                      {status.label}
                      {table.status === 'occupied' && table.guestCount && (
                        <span className="ml-1">({table.guestCount} {t('common.guests')})</span>
                      )}
                    </Badge>

                    {/* Active Order Info */}
                    {tableOrders.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {tableOrders.length} {tableOrders.length === 1 ? 'order' : 'orders'}
                          </span>
                          <span className="font-medium">{formatCurrency(combinedTotal)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalItems} {t('common.items')}
                        </p>
                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTables.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">{t('tables.noTablesInSection')}</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t('tables.addTable')}
              </Button>
            </Card>
          )}
          </TabsContent>
        </Tabs>
      )}

      {/* No Sections Prompt Dialog */}
      <NoSectionsPrompt
        open={showNoSectionsPrompt}
        onOpenChange={setShowNoSectionsPrompt}
        onCreateSection={() => {
          setShouldOpenTableDialogAfterSection(true);
          setIsSectionManagerOpen(true);
        }}
      />

      {/* Create/Edit Table Dialog */}
      <TableDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTable={editingTable}
      />

      {/* Section Manager Dialog */}
      <Dialog 
        open={isSectionManagerOpen} 
        onOpenChange={(open) => {
          setIsSectionManagerOpen(open);
          if (!open) {
            setShowNoSectionsPrompt(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tables.manageSections')}</DialogTitle>
          </DialogHeader>
          <SectionManager />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tables.deleteTable')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tables.deleteTableConfirm', { tableNumber: deletingTable?.tableNumber })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table Options Dialog */}
      <Dialog open={isTableOptionsOpen} onOpenChange={setIsTableOptionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table {selectedTable?.tableNumber}</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>Status: <span className="font-medium">{statusConfig[selectedTable.status].label}</span></p>
                {getTableOrders(selectedTable.id).length > 0 && (
                  <p className="mt-1">
                    {getTableOrders(selectedTable.id).length} active {getTableOrders(selectedTable.id).length === 1 ? 'order' : 'orders'}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full"
                  onClick={() => handleAddOrder(selectedTable)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewOrders(selectedTable)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

