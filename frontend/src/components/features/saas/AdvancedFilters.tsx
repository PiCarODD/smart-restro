import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';

interface AdvancedFiltersProps {
    filters: {
        search?: string;
        status?: string;
        tier?: string;
        role?: string;
        tenantId?: string;
        isActive?: boolean | string;
        startDate?: string;
        endDate?: string;
    };
    onFiltersChange: (filters: Record<string, any>) => void;
    onReset: () => void;
    filterOptions?: {
        showStatus?: boolean;
        showTier?: boolean;
        showRole?: boolean;
        showTenant?: boolean;
        showActive?: boolean;
        showDateRange?: boolean;
    };
    className?: string;
}

export function AdvancedFilters({
    filters,
    onFiltersChange,
    onReset,
    filterOptions = {
        showStatus: true,
        showTier: true,
        showRole: false,
        showTenant: false,
        showActive: false,
        showDateRange: true
    },
    className
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState(filters);

    const activeFilterCount = Object.values(filters).filter(v => 
        v !== undefined && v !== '' && v !== null
    ).length;

    const handleApply = () => {
        onFiltersChange(localFilters);
        setIsOpen(false);
    };

    const handleReset = () => {
        setLocalFilters({});
        onReset();
        setIsOpen(false);
    };

    const updateFilter = (key: string, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className={className}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>
                        Apply filters to refine your search results
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label>Search</Label>
                        <Input
                            placeholder="Search by name, email..."
                            value={localFilters.search || ''}
                            onChange={(e) => updateFilter('search', e.target.value)}
                        />
                    </div>

                    {/* Date Range */}
                    {filterOptions.showDateRange && (
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.startDate || ''}
                                        onChange={(e) => updateFilter('startDate', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">End Date</Label>
                                    <Input
                                        type="date"
                                        value={localFilters.endDate || ''}
                                        onChange={(e) => updateFilter('endDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Filter */}
                    {filterOptions.showStatus && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={localFilters.status || ''}
                                onValueChange={(value) => updateFilter('status', value || undefined)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Tier Filter */}
                    {filterOptions.showTier && (
                        <div className="space-y-2">
                            <Label>Tier</Label>
                            <Select
                                value={localFilters.tier || ''}
                                onValueChange={(value) => updateFilter('tier', value || undefined)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All tiers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All tiers</SelectItem>
                                    <SelectItem value="starter">Starter</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Role Filter */}
                    {filterOptions.showRole && (
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={localFilters.role || ''}
                                onValueChange={(value) => updateFilter('role', value || undefined)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All roles</SelectItem>
                                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="waiter">Waiter</SelectItem>
                                    <SelectItem value="cashier">Cashier</SelectItem>
                                    <SelectItem value="kitchen">Kitchen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Active Status Filter */}
                    {filterOptions.showActive && (
                        <div className="space-y-2">
                            <Label>Active Status</Label>
                            <Select
                                value={
                                    localFilters.isActive === undefined || localFilters.isActive === ''
                                        ? ''
                                        : String(localFilters.isActive)
                                }
                                onValueChange={(value) => {
                                    if (value === '') {
                                        updateFilter('isActive', undefined);
                                    } else {
                                        updateFilter('isActive', value === 'true');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {activeFilterCount > 0 && (
                        <div className="space-y-2">
                            <Label>Active Filters</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(filters).map(([key, value]) => {
                                    if (value === undefined || value === '' || value === null) return null;
                                    return (
                                        <div
                                            key={key}
                                            className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                                        >
                                            <span className="font-medium">{key}:</span>
                                            <span>{String(value)}</span>
                                            <button
                                                onClick={() => {
                                                    updateFilter(key, undefined);
                                                    onFiltersChange({ ...filters, [key]: undefined });
                                                }}
                                                className="ml-1 hover:bg-primary/20 rounded p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex-1"
                    >
                        Reset
                    </Button>
                    <Button onClick={handleApply} className="flex-1">
                        Apply Filters
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
