import { useEffect, useState } from 'react';
import {
    Search,
    Building2,
    Store,
    ExternalLink,
    Shield,
    Loader2,
    Ban,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    UserCog
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { useSaasStore } from '@/store/saasStore';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { User } from '@/types';
import { BulkActionToolbar } from '@/components/features/saas/BulkActionToolbar';
import { ExportButton } from '@/components/features/saas/ExportButton';
import { AdvancedFilters } from '@/components/features/saas/AdvancedFilters';
import { useBulkSelection } from '@/hooks/useBulkSelection';

const userColumns = [
    'User ID', 'Email', 'First Name', 'Last Name', 'Full Name', 'Role',
    'Status', 'Tenant ID', 'Tenant Name', 'Restaurant ID', 'Restaurant Name',
    'Phone', 'Created', 'Updated'
];

const roleOptions = [
    { value: 'tenant_admin', label: 'Tenant Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'waiter', label: 'Waiter' },
    { value: 'server', label: 'Server' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'cook', label: 'Cook' },
    { value: 'inventory', label: 'Inventory' }
];

const roleColors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-700 hover:bg-red-100',
    tenant_admin: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    admin: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    manager: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
    waiter: 'bg-green-100 text-green-700 hover:bg-green-100',
    server: 'bg-green-100 text-green-700 hover:bg-green-100',
    kitchen: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    cook: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
    cashier: 'bg-teal-100 text-teal-700 hover:bg-teal-100',
    inventory: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-100',
};

export function SaasUsersPage() {
    const {
        users,
        usersPagination,
        loading,
        error,
        fetchUsers,
        updateUserStatus,
        bulkUpdateUserStatus,
        bulkAssignUserRole,
        bulkDeleteUsers,
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

    const [impersonatingUser, setImpersonatingUser] = useState<User | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [bulkActionDialog, setBulkActionDialog] = useState<{
        open: boolean;
        action: string;
        value?: string | boolean;
    }>({ open: false, action: '' });

    // Bulk selection
    const bulkSelection = useBulkSelection({
        items: users,
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

    // Fetch users when filters/params change
    useEffect(() => {
        fetchUsers({
            page: currentPage,
            limit: 20,
            search: debouncedSearch,
            role: filters.role,
            tenantId: filters.tenantId,
            isActive: filters.isActive,
            sortBy,
            sortOrder
        });
    }, [currentPage, debouncedSearch, filters, sortBy, sortOrder, fetchUsers]);

    const handleImpersonate = async () => {
        if (!impersonatingUser) return;
        setIsProcessing(true);
        try {
            await impersonate(impersonatingUser.id);
        } catch (error) {
            console.error('Impersonation failed:', error);
        } finally {
            setIsProcessing(false);
            setImpersonatingUser(null);
        }
    };

    const handleBulkAction = async () => {
        if (bulkOperation.selectedIds.length === 0) return;

        try {
            switch (bulkActionDialog.action) {
                case 'activate':
                    await bulkUpdateUserStatus(bulkOperation.selectedIds, true);
                    break;
                case 'deactivate':
                    await bulkUpdateUserStatus(bulkOperation.selectedIds, false);
                    break;
                case 'assignRole':
                    await bulkAssignUserRole(bulkOperation.selectedIds, bulkActionDialog.value as string);
                    break;
                case 'delete':
                    await bulkDeleteUsers(bulkOperation.selectedIds, true);
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
                    <h1 className="text-2xl font-bold">Platform Users</h1>
                    <p className="text-muted-foreground">Manage and impersonate users across all tenants</p>
                </div>
                <ExportButton
                    entityType="users"
                    availableColumns={userColumns}
                    defaultColumns={userColumns.slice(0, 7)}
                />
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
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
                                showRole: true,
                                showTenant: false,
                                showActive: true,
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
                            icon: <CheckCircle className="h-4 w-4" />,
                            onClick: () => setBulkActionDialog({ open: true, action: 'activate' })
                        },
                        {
                            label: 'Deactivate',
                            icon: <Ban className="h-4 w-4" />,
                            onClick: () => setBulkActionDialog({ open: true, action: 'deactivate' })
                        },
                        {
                            label: 'Assign Role',
                            icon: <UserCog className="h-4 w-4" />,
                            onClick: () => setBulkActionDialog({ open: true, action: 'assignRole', value: '' })
                        },
                        {
                            label: 'Delete',
                            variant: 'destructive',
                            icon: <Ban className="h-4 w-4" />,
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
                                    onClick={() => handleSort('firstName')}
                                    className="flex items-center gap-2 hover:text-primary"
                                >
                                    User
                                    {getSortIcon('firstName')}
                                </button>
                            </TableHead>
                            <TableHead>
                                <button
                                    onClick={() => handleSort('role')}
                                    className="flex items-center gap-2 hover:text-primary"
                                >
                                    Role
                                    {getSortIcon('role')}
                                </button>
                            </TableHead>
                            <TableHead>Tenant / Restaurant</TableHead>
                            <TableHead>
                                <button
                                    onClick={() => handleSort('isActive')}
                                    className="flex items-center gap-2 hover:text-primary"
                                >
                                    Status
                                    {getSortIcon('isActive')}
                                </button>
                            </TableHead>
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
                        {loading.users ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No users found matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={bulkSelection.isSelected(user.id)}
                                            onCheckedChange={() => bulkSelection.handleToggle(user.id)}
                                            disabled={user.role === 'super_admin'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={roleColors[user.role] || 'bg-gray-100 text-gray-700'}>
                                            {user.role.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-1 text-foreground font-medium">
                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                {user.tenant?.name || 'Platform'}
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Store className="h-3 w-3" />
                                                {user.restaurant?.name || 'N/A'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isActive ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                                        ) : (
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.createdAt ? formatDate(user.createdAt) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {user.role !== 'super_admin' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => updateUserStatus(user.id, !user.isActive)}
                                                        className={user.isActive ? "text-destructive hover:bg-destructive/10" : "text-green-600 hover:bg-green-50"}
                                                        title={user.isActive ? "Deactivate User" : "Activate User"}
                                                    >
                                                        {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setImpersonatingUser(user)}
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        Impersonate
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {usersPagination && usersPagination.totalPages > 1 && (
                    <CardContent className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * (usersPagination.limit || 20)) + 1} to {Math.min(currentPage * (usersPagination.limit || 20), usersPagination.total)} of {usersPagination.total} users
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading.users}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {currentPage} of {usersPagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(usersPagination.totalPages, p + 1))}
                                disabled={currentPage === usersPagination.totalPages || loading.users}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Impersonation Alert Dialog */}
            <AlertDialog open={!!impersonatingUser} onOpenChange={() => setImpersonatingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Confirm Impersonation
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to log in as <strong>{impersonatingUser?.firstName} {impersonatingUser?.lastName}</strong>.
                            <br /><br />
                            This will switch your current session to this user's account. Any actions you take will be attributed to this user.
                            To return to your admin account, use the "Return to Admin" button in the navigation bar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleImpersonate}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Switching...' : 'Yes, Impersonate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Action Confirmation Dialog */}
            <AlertDialog open={bulkActionDialog.open} onOpenChange={(open) => {
                if (!open) setBulkActionDialog({ open: false, action: '' });
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            {bulkActionDialog.action === 'assignRole' ? (
                                <div className="space-y-2 mt-2">
                                    <p>This will assign a role to {bulkOperation.selectedIds.length} user(s).</p>
                                    <Select
                                        value={bulkActionDialog.value as string || ''}
                                        onValueChange={(value) => setBulkActionDialog(prev => ({ ...prev, value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map(role => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                `This will ${bulkActionDialog.action} ${bulkOperation.selectedIds.length} user(s). Are you sure you want to continue?`
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkAction}
                            disabled={bulkActionDialog.action === 'assignRole' && !bulkActionDialog.value}
                            className={bulkActionDialog.action === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
