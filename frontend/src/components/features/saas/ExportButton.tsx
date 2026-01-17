import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import { ExportQueryParams } from '@/lib/api/saasApi';

interface ExportButtonProps {
    entityType: 'tenants' | 'users';
    availableColumns?: string[];
    defaultColumns?: string[];
    onExportComplete?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
    entityType,
    availableColumns = [],
    defaultColumns = [],
    onExportComplete,
    variant = 'outline',
    size = 'sm'
}: ExportButtonProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [format, setFormat] = useState<'csv'>('csv'); // PDF not implemented yet
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('');
    const [tier, setTier] = useState('');
    const [role, setRole] = useState('');
    const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns.length > 0 ? defaultColumns : availableColumns);
    
    const { exportData, isExporting, error, clearError } = useExport({
        entityType,
        defaultParams: {}
    });

    const handleExport = async () => {
        clearError();
        
        const params: ExportQueryParams = {
            format,
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
            ...(status && { status }),
            ...(tier && { tier }),
            ...(role && { role }),
            ...(selectedColumns.length < availableColumns.length && { columns: selectedColumns })
        };

        const success = await exportData(params);
        if (success) {
            setIsDialogOpen(false);
            onExportComplete?.();
        }
    };

    const toggleColumn = (column: string) => {
        setSelectedColumns(prev =>
            prev.includes(column)
                ? prev.filter(c => c !== column)
                : [...prev, column]
        );
    };

    const selectAllColumns = () => {
        setSelectedColumns([...availableColumns]);
    };

    const deselectAllColumns = () => {
        setSelectedColumns([]);
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setIsDialogOpen(true)}
                disabled={isExporting}
            >
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Export {entityType === 'tenants' ? 'Tenants' : 'Users'}</DialogTitle>
                        <DialogDescription>
                            Configure export options and filters
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Format Selection */}
                        <div className="space-y-2">
                            <Label>Format</Label>
                            <Select value={format} onValueChange={(v: 'csv') => setFormat(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="pdf" disabled>PDF (Coming Soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        {entityType === 'tenants' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={status} onValueChange={setStatus}>
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

                                <div className="space-y-2">
                                    <Label>Tier</Label>
                                    <Select value={tier} onValueChange={setTier}>
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
                            </>
                        )}

                        {entityType === 'users' && (
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={setRole}>
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

                        {/* Column Selection */}
                        {availableColumns.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Columns</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={selectAllColumns}
                                            className="h-7 text-xs"
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={deselectAllColumns}
                                            className="h-7 text-xs"
                                        >
                                            Deselect All
                                        </Button>
                                    </div>
                                </div>
                                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                                    {availableColumns.map((column) => (
                                        <div key={column} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`column-${column}`}
                                                checked={selectedColumns.includes(column)}
                                                onCheckedChange={() => toggleColumn(column)}
                                            />
                                            <label
                                                htmlFor={`column-${column}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                {column}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || selectedColumns.length === 0}
                        >
                            {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
