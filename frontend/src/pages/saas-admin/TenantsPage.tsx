import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Building2,
  Eye,
  Pencil,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
  Users,
  Store,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSaasStore } from '@/store/saasStore';
import { useAuthStore } from '@/store/authStore';
import { saasApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BulkActionToolbar } from '@/components/features/saas/BulkActionToolbar';
import { ExportButton } from '@/components/features/saas/ExportButton';
import { AdvancedFilters } from '@/components/features/saas/AdvancedFilters';
import { useBulkSelection } from '@/hooks/useBulkSelection';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  past_due: { label: 'Past Due', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const tierConfig: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-secondary text-secondary-foreground' },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

const tenantColumns = [
  'Tenant ID', 'Name', 'Slug', 'Tier', 'Status', 'Owner Email', 'Billing Email',
  'Phone', 'Restaurant Count', 'User Count', 'Max Restaurants', 'Max Users',
  'Max Menu Items', 'Start Date', 'End Date', 'Created', 'Updated'
];

export function TenantsPage() {
  const {
    tenants,
    tenantsPagination,
    loading,
    error,
    fetchTenants,
    updateSubscription,
    createTenant,
    bulkUpdateTenantStatus,
    bulkUpdateTenantTier,
    bulkDeleteTenants,
    clearSelection,
    toggleSelection,
    selectAll,
    bulkOperation
  } = useSaasStore();

  const { impersonate } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    ownerFirstName: '',
    ownerLastName: '',
    password: '',
    subscriptionTier: 'starter' as const,
    phone: '',
    billingEmail: ''
  });
  const [addError, setAddError] = useState<string | null>(null);

  const [viewingTenant, setViewingTenant] = useState<any | null>(null);
  const [tenantDetails, setTenantDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [newTier, setNewTier] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [isImpersonating, setIsImpersonating] = useState(false);

  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: string;
    value?: string;
  }>({ open: false, action: '' });

  // Bulk selection
  const bulkSelection = useBulkSelection({
    items: tenants,
    selectedIds: bulkOperation.selectedIds,
    onToggle: toggleSelection,
    onSelectAll: selectAll,
    onClear: clearSelection
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tenants when filters/params change
  useEffect(() => {
    fetchTenants({
      page: currentPage,
      limit: 10,
      search: debouncedSearch,
      status: filters.status,
      tier: filters.tier,
      sortBy,
      sortOrder
    });
  }, [currentPage, debouncedSearch, filters, sortBy, sortOrder, fetchTenants]);

  const handleAddFormChange = (field: string, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setAddForm(prev => ({ ...prev, slug }));
    }
  };

  const handleCreateTenant = async () => {
    setAddError(null);
    if (!addForm.name || !addForm.slug || !addForm.ownerEmail || !addForm.ownerFirstName || !addForm.ownerLastName || !addForm.password) {
      setAddError('All required fields must be filled');
      return;
    }

    setIsCreating(true);
    try {
      await createTenant(addForm);
      setIsAddDialogOpen(false);
      setAddForm({ name: '', slug: '', ownerEmail: '', ownerFirstName: '', ownerLastName: '', password: '', subscriptionTier: 'starter', phone: '', billingEmail: '' });
    } catch (error: any) {
      setAddError(error?.response?.data?.message || error?.message || 'Failed to create tenant');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewDetails = async (tenant: any) => {
    setViewingTenant(tenant);
    setIsLoadingDetails(true);
    try {
      const details = await saasApi.getTenant(tenant.id, true);
      setTenantDetails(details);
    } catch (error) {
      console.error('Failed to load tenant details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleLoginAsTenant = async (tenant: any) => {
    setIsImpersonating(true);
    try {
      const adminInfo = await saasApi.getTenantAdmin(tenant.id);
      await impersonate(adminInfo.userId);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to login as tenant');
    } finally {
      setIsImpersonating(false);
    }
  };

  const handleBulkAction = async () => {
    if (bulkOperation.selectedIds.length === 0) return;

    try {
      switch (bulkActionDialog.action) {
        case 'updateStatus':
          await bulkUpdateTenantStatus(bulkOperation.selectedIds, bulkActionDialog.value!);
          break;
        case 'updateTier':
          await bulkUpdateTenantTier(bulkOperation.selectedIds, bulkActionDialog.value!);
          break;
        case 'delete':
          await bulkDeleteTenants(bulkOperation.selectedIds, true);
          break;
      }
      setBulkActionDialog({ open: false, action: '' });
      clearSelection();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'ASC' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">Manage all registered tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            entityType="tenants"
            availableColumns={tenantColumns}
            defaultColumns={tenantColumns.slice(0, 8)}
          />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <AdvancedFilters
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentPage(1);
              }}
              onReset={() => {
                setFilters({});
                setCurrentPage(1);
              }}
              filterOptions={{
                showStatus: true,
                showTier: true,
                showDateRange: true
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Toolbar */}
      {bulkSelection.selectedCount > 0 && (
        <BulkActionToolbar
          selectedCount={bulkSelection.selectedCount}
          totalCount={bulkSelection.totalCount}
          isAllSelected={bulkSelection.isAllSelected}
          isPartiallySelected={bulkSelection.isPartiallySelected}
          onSelectAll={bulkSelection.handleSelectAll}
          onClear={bulkSelection.handleClear}
          actions={[
            {
              label: 'Activate',
              onClick: () => setBulkActionDialog({ open: true, action: 'updateStatus', value: 'active' })
            },
            {
              label: 'Set to Trial',
              onClick: () => setBulkActionDialog({ open: true, action: 'updateStatus', value: 'trial' })
            },
            {
              label: 'Cancel',
              onClick: () => setBulkActionDialog({ open: true, action: 'updateStatus', value: 'cancelled' })
            },
            {
              label: 'Upgrade to Professional',
              onClick: () => setBulkActionDialog({ open: true, action: 'updateTier', value: 'professional' })
            },
            {
              label: 'Upgrade to Enterprise',
              onClick: () => setBulkActionDialog({ open: true, action: 'updateTier', value: 'enterprise' })
            },
            {
              label: 'Delete',
              variant: 'destructive',
              onClick: () => setBulkActionDialog({ open: true, action: 'delete' })
            }
          ]}
        />
      )}

      {/* Error Display */}
      {error.message && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="text-sm text-destructive">{error.message}</div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={bulkSelection.isAllSelected}
                  onCheckedChange={bulkSelection.handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('subscriptionTier')}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Tier
                  {getSortIcon('subscriptionTier')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('subscriptionStatus')}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Status
                  {getSortIcon('subscriptionStatus')}
                </button>
              </TableHead>
              <TableHead>Owner Email</TableHead>
              <TableHead>Restaurants</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  Created
                  {getSortIcon('created_at')}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading.tenants ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No tenants found
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => {
                const StatusIcon = statusConfig[tenant.subscriptionStatus]?.icon || CheckCircle;
                return (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Checkbox
                        checked={bulkSelection.isSelected(tenant.id)}
                        onCheckedChange={() => bulkSelection.handleToggle(tenant.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tierConfig[tenant.subscriptionTier]?.color || ''}>
                        {tierConfig[tenant.subscriptionTier]?.label || tenant.subscriptionTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[tenant.subscriptionStatus]?.color || ''}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[tenant.subscriptionStatus]?.label || tenant.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{tenant.ownerEmail}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        {tenant.restaurantCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {tenant.userCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(tenant)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingTenant(tenant);
                            setNewTier(tenant.subscriptionTier);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Change Tier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleLoginAsTenant(tenant)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Login as Tenant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {tenantsPagination && tenantsPagination.totalPages > 1 && (
          <CardContent className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * (tenantsPagination.limit || 10)) + 1} to {Math.min(currentPage * (tenantsPagination.limit || 10), tenantsPagination.total)} of {tenantsPagination.total} tenants
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading.tenants}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {tenantsPagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(tenantsPagination.totalPages, p + 1))}
                disabled={currentPage === tenantsPagination.totalPages || loading.tenants}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add Tenant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>Create a new tenant with an admin user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {addError && (
              <div className="bg-destructive/15 border border-destructive text-destructive px-3 py-2 rounded text-sm">
                {addError}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="tenant-name">Tenant Name *</Label>
              <Input
                id="tenant-name"
                value={addForm.name}
                onChange={(e) => handleAddFormChange('name', e.target.value)}
                placeholder="Acme Restaurant Group"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-slug">Tenant ID (Slug) *</Label>
              <Input
                id="tenant-slug"
                value={addForm.slug}
                onChange={(e) => handleAddFormChange('slug', e.target.value)}
                placeholder="acme-restaurant-group"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner-first">First Name *</Label>
                <Input
                  id="owner-first"
                  value={addForm.ownerFirstName}
                  onChange={(e) => handleAddFormChange('ownerFirstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner-last">Last Name *</Label>
                <Input
                  id="owner-last"
                  value={addForm.ownerLastName}
                  onChange={(e) => handleAddFormChange('ownerLastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner-email">Owner Email *</Label>
              <Input
                id="owner-email"
                type="email"
                value={addForm.ownerEmail}
                onChange={(e) => handleAddFormChange('ownerEmail', e.target.value)}
                placeholder="owner@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner-password">Password *</Label>
              <Input
                id="owner-password"
                type="password"
                value={addForm.password}
                onChange={(e) => handleAddFormChange('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-tier">Subscription Tier</Label>
              <Select value={addForm.subscriptionTier} onValueChange={(val: any) => handleAddFormChange('subscriptionTier', val)}>
                <SelectTrigger id="add-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter ($49/mo)</SelectItem>
                  <SelectItem value="professional">Professional ($129/mo)</SelectItem>
                  <SelectItem value="enterprise">Enterprise ($299/mo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={addForm.phone}
                onChange={(e) => handleAddFormChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing-email">Billing Email (Optional)</Label>
              <Input
                id="billing-email"
                type="email"
                value={addForm.billingEmail}
                onChange={(e) => handleAddFormChange('billingEmail', e.target.value)}
                placeholder="billing@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTenant} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Update subscription tier for {editingTenant?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>New Tier</Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTenant(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editingTenant || !newTier) return;
              setIsUpdating(true);
              try {
                await updateSubscription(editingTenant.id, newTier);
                setEditingTenant(null);
              } catch (error) {
                console.error('Failed to update subscription:', error);
              } finally {
                setIsUpdating(false);
              }
            }} disabled={isUpdating || !newTier}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingTenant} onOpenChange={(open) => !open && setViewingTenant(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {viewingTenant?.name}
            </DialogTitle>
            <DialogDescription>Tenant ID: {viewingTenant?.slug}</DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tenantDetails ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Subscription</p>
                  <Badge className={tierConfig[tenantDetails.subscriptionTier]?.color || ''}>
                    {tierConfig[tenantDetails.subscriptionTier]?.label || tenantDetails.subscriptionTier}
                  </Badge>
                </div>
                <div className="bg-accent/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Status</p>
                  <Badge className={statusConfig[tenantDetails.subscriptionStatus]?.color || ''}>
                    {statusConfig[tenantDetails.subscriptionStatus]?.label || tenantDetails.subscriptionStatus}
                  </Badge>
                </div>
                <div className="bg-accent/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Owner Email</p>
                  <p className="text-sm font-medium">{tenantDetails.ownerEmail}</p>
                </div>
                <div className="bg-accent/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Created At</p>
                  <p className="text-sm font-medium">{formatDate(tenantDetails.createdAt)}</p>
                </div>
              </div>
              {tenantDetails.restaurants && tenantDetails.restaurants.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Restaurants ({tenantDetails.restaurants.length})
                  </h4>
                  <div className="bg-accent/30 rounded-lg divide-y divide-border">
                    {tenantDetails.restaurants.map((r: any) => (
                      <div key={r.id} className="p-3">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.slug}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tenantDetails.users && tenantDetails.users.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Users ({tenantDetails.users.length})
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-accent/30">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenantDetails.users.map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{u.role.replace('_', ' ')}</Badge></TableCell>
                            <TableCell>
                              {u.isActive ? (
                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground py-4">Failed to load tenant details.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTenant(null)}>Close</Button>
            <Button onClick={() => { setViewingTenant(null); handleLoginAsTenant(viewingTenant); }} disabled={isImpersonating}>
              {isImpersonating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Login as Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ open, action: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              This will {bulkActionDialog.action === 'delete' ? 'delete' : 'update'} {bulkOperation.selectedIds.length} tenant(s).
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction} className={bulkActionDialog.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
