import { useEffect, useState } from 'react';
import {
    DollarSign,
    Users,
    Building2,
    ArrowUpRight,
    Search,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    History,
    ArrowUpDown
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { useSaasStore } from '@/store/saasStore';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { BulkActionToolbar } from '@/components/features/saas/BulkActionToolbar';
import { AdvancedFilters } from '@/components/features/saas/AdvancedFilters';
import { SubscriptionHistory } from '@/components/features/saas/SubscriptionHistory';
import { UserLimitConfigDialog } from '@/components/features/saas/UserLimitConfigDialog';
import { UserBillingHistory } from '@/components/features/saas/UserBillingHistory';
import { useBulkSelection } from '@/hooks/useBulkSelection';

export function SaasSubscriptionsPage() {
    const {
        stats,
        fetchStats,
        tenants,
        tenantsPagination,
        loading,
        fetchTenants,
        updateSubscription,
        bulkUpdateTenantTier,
        bulkUpdateTenantStatus,
        clearSelection,
        toggleSelection,
        selectAll,
        bulkOperation
    } = useSaasStore();

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
    
    const [viewingTenantId, setViewingTenantId] = useState<string | null>(null);
    const [editingTenant, setEditingTenant] = useState<any | null>(null);
    const [newTier, setNewTier] = useState<string>('');
    const [userLimitTenantId, setUserLimitTenantId] = useState<string | null>(null);
    const [billingTenantId, setBillingTenantId] = useState<string | null>(null);
    
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

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

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

    const handleBulkAction = async () => {
        if (bulkOperation.selectedIds.length === 0) return;

        try {
            switch (bulkActionDialog.action) {
                case 'updateTier':
                    await bulkUpdateTenantTier(bulkOperation.selectedIds, bulkActionDialog.value!);
                    break;
                case 'updateStatus':
                    await bulkUpdateTenantStatus(bulkOperation.selectedIds, bulkActionDialog.value!);
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

    if (!stats && loading.stats) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    const tierColors = {
        starter: '#94a3b8',
        professional: '#8b5cf6',
        enterprise: '#f59e0b',
    };

    const statusColors = {
        active: '#22c55e',
        trial: '#3b82f6',
        past_due: '#ef4444',
        cancelled: '#64748b',
    };

    const tierData = [
        { name: 'Starter', value: stats.byTier.starter, color: tierColors.starter },
        { name: 'Professional', value: stats.byTier.professional, color: tierColors.professional },
        { name: 'Enterprise', value: stats.byTier.enterprise, color: tierColors.enterprise },
    ].filter(d => d.value > 0);

    const statusData = [
        { name: 'Active', count: stats.byStatus.active, color: statusColors.active },
        { name: 'Trial', count: stats.byStatus.trial, color: statusColors.trial },
        { name: 'Past Due', count: stats.byStatus.past_due, color: statusColors.past_due },
        { name: 'Cancelled', count: stats.byStatus.cancelled, color: statusColors.cancelled },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'trial': return <Clock className="h-4 w-4 text-blue-500" />;
            case 'past_due': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-slate-500" />;
            default: return null;
        }
    };

    const avgRevenuePerTenant = stats.activeTenants > 0 
        ? stats.monthlyRevenue / stats.activeTenants 
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                    <p className="text-muted-foreground">Manage plans, revenue, and customer subscriptions.</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-blue-500/10 via-background to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated MRR</CardTitle>
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue, 'USD')}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Monthly recurring revenue
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-green-500/10 via-background to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Tenants</CardTitle>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.activeTenants}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            {Math.round((stats.activeTenants / stats.totalTenants) * 100)}% of total platform
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-purple-500/10 via-background to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Avg. Rev Per Tenant</CardTitle>
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {formatCurrency(avgRevenuePerTenant, 'USD')}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Based on current active subscriptions
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-amber-500/10 via-background to-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trial Tenants</CardTitle>
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <ArrowUpRight className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.trialTenants}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Currently in trial period
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Subscription Tiers Overview</CardTitle>
                        <CardDescription>Distribution of tenants across different plans</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <div className="flex flex-col md:flex-row h-full items-center">
                            <div className="w-full md:w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={tierData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {tierData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full md:w-1/2 space-y-4 px-4">
                                {tierData.map((tier) => (
                                    <div key={tier.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                                            <span className="text-sm font-medium">{tier.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold">{tier.value}</span>
                                            <span className="text-xs text-muted-foreground w-12 text-right">
                                                {Math.round((tier.value / stats.totalTenants) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-md">
                    <CardHeader>
                        <CardTitle>Subscription Status</CardTitle>
                        <CardDescription>Current health of platform subscriptions</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} layout="vertical" margin={{ left: -10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Subscribers Table */}
            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Subscribers</CardTitle>
                            <CardDescription>Manage individual tenant subscriptions.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tenants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-64 h-9 bg-background"
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
                                    showDateRange: false
                                }}
                            />
                        </div>
                    </div>
                </CardHeader>

                {/* Bulk Action Toolbar */}
                {bulkSelection.selectedCount > 0 && (
                    <CardContent className="p-4 border-b bg-primary/5">
                        <BulkActionToolbar
                            selectedCount={bulkSelection.selectedCount}
                            totalCount={bulkSelection.totalCount}
                            isAllSelected={bulkSelection.isAllSelected}
                            isPartiallySelected={bulkSelection.isPartiallySelected}
                            onSelectAll={bulkSelection.handleSelectAll}
                            onClear={bulkSelection.handleClear}
                            actions={[
                                {
                                    label: 'Upgrade to Professional',
                                    onClick: () => setBulkActionDialog({ open: true, action: 'updateTier', value: 'professional' })
                                },
                                {
                                    label: 'Upgrade to Enterprise',
                                    onClick: () => setBulkActionDialog({ open: true, action: 'updateTier', value: 'enterprise' })
                                },
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
                                }
                            ]}
                        />
                    </CardContent>
                )}

                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-6 w-12">
                                    <Checkbox
                                        checked={bulkSelection.isAllSelected}
                                        onCheckedChange={bulkSelection.handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="pl-6">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-2 hover:text-primary"
                                    >
                                        Tenant
                                        {getSortIcon('name')}
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
                                <TableHead>
                                    <button
                                        onClick={() => handleSort('subscriptionTier')}
                                        className="flex items-center gap-2 hover:text-primary"
                                    >
                                        Plan
                                        {getSortIcon('subscriptionTier')}
                                    </button>
                                </TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>
                                    <button
                                        onClick={() => handleSort('created_at')}
                                        className="flex items-center gap-2 hover:text-primary"
                                    >
                                        Joined Date
                                        {getSortIcon('created_at')}
                                    </button>
                                </TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading.tenants ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : tenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tenants found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="group hover:bg-muted/40 transition-colors">
                                        <TableCell className="pl-6">
                                            <Checkbox
                                                checked={bulkSelection.isSelected(tenant.id)}
                                                onCheckedChange={() => bulkSelection.handleToggle(tenant.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="pl-6 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {tenant.name.charAt(0)}
                                                </div>
                                                <span>{tenant.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(tenant.subscriptionStatus)}
                                                <span className="text-sm capitalize">{tenant.subscriptionStatus.replace('_', ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "capitalize",
                                                tenant.subscriptionTier === 'enterprise' ? "border-amber-500 text-amber-600 bg-amber-50" :
                                                    tenant.subscriptionTier === 'professional' ? "border-purple-500 text-purple-600 bg-purple-50" :
                                                        "border-slate-400 text-slate-600 bg-slate-50"
                                            )}>
                                                {tenant.subscriptionTier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {tenant.ownerEmail}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(tenant.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem onClick={() => setViewingTenantId(tenant.id)}>
                                                        <History className="h-4 w-4 mr-2" />
                                                        View History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">User Management</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setUserLimitTenantId(tenant.id)}>
                                                        <Users className="h-4 w-4 mr-2" />
                                                        Configure User Limits
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setBillingTenantId(tenant.id)}>
                                                        <DollarSign className="h-4 w-4 mr-2" />
                                                        View Billing History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Change Plan</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingTenant(tenant);
                                                        setNewTier(tenant.subscriptionTier);
                                                    }}>
                                                        <Building2 className="h-4 w-4 mr-2" />
                                                        Update Tier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateSubscription(tenant.id, 'starter')}>
                                                        Downgrade to Starter
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateSubscription(tenant.id, 'professional')}>
                                                        Move to Professional
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateSubscription(tenant.id, 'enterprise')} className="text-amber-600">
                                                        Upgrade to Enterprise
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-6 bg-muted/10 border-t">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * (tenantsPagination?.limit || 10)) + 1} to {Math.min(currentPage * (tenantsPagination?.limit || 10), tenantsPagination?.total || 0)} of {tenantsPagination?.total || 0} tenants
                    </p>
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
                            Page {currentPage} of {tenantsPagination?.totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(tenantsPagination?.totalPages || 1, p + 1))}
                            disabled={currentPage === (tenantsPagination?.totalPages || 1) || loading.tenants}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>

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
                            <label className="text-sm font-medium">New Tier</label>
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
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingTenant(null)}>Cancel</Button>
                        <Button onClick={async () => {
                            if (!editingTenant || !newTier) return;
                            try {
                                await updateSubscription(editingTenant.id, newTier);
                                setEditingTenant(null);
                            } catch (error) {
                                console.error('Failed to update subscription:', error);
                            }
                        }} disabled={!newTier || newTier === editingTenant?.subscriptionTier}>
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Subscription History Dialog */}
            <Dialog open={!!viewingTenantId} onOpenChange={(open) => !open && setViewingTenantId(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Subscription History</DialogTitle>
                        <DialogDescription>
                            Track changes to subscription plan
                        </DialogDescription>
                    </DialogHeader>
                    {viewingTenantId && <SubscriptionHistory tenantId={viewingTenantId} />}
                </DialogContent>
            </Dialog>

            {/* User Limit Configuration Dialog */}
            <UserLimitConfigDialog
                open={!!userLimitTenantId}
                onOpenChange={(open) => !open && setUserLimitTenantId(null)}
                tenantId={userLimitTenantId || ''}
                tenantName={tenants.find(t => t.id === userLimitTenantId)?.name}
            />

            {/* Billing History Dialog */}
            <Dialog open={!!billingTenantId} onOpenChange={(open) => !open && setBillingTenantId(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Billing History</DialogTitle>
                        <DialogDescription>
                            Monthly billing records for {tenants.find(t => t.id === billingTenantId)?.name}
                        </DialogDescription>
                    </DialogHeader>
                    {billingTenantId && <UserBillingHistory tenantId={billingTenantId} />}
                </DialogContent>
            </Dialog>

            {/* Bulk Action Confirmation Dialog */}
            <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ open, action: '' })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will {bulkActionDialog.action === 'updateTier' ? 'change the tier' : 'update the status'} for {bulkOperation.selectedIds.length} tenant(s).
                            Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkAction}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
