import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    isPartiallySelected: boolean;
    onSelectAll: () => void;
    onClear: () => void;
    actions?: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'destructive';
        disabled?: boolean;
    }>;
    className?: string;
}

export function BulkActionToolbar({
    selectedCount,
    totalCount,
    isAllSelected,
    onSelectAll,
    onClear,
    actions = [],
    className
}: BulkActionToolbarProps) {
    if (selectedCount === 0) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSelectAll}
                    className="h-8"
                >
                    {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 mr-2" />
                    ) : (
                        <Square className="h-4 w-4 mr-2" />
                    )}
                    Select All
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md p-2", className)}>
            <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium text-primary">
                    {selectedCount} of {totalCount} selected
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 text-xs"
                >
                    Clear
                </Button>
            </div>

            {actions.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <MoreHorizontal className="h-4 w-4 mr-2" />
                            Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {actions.map((action, index) => (
                            <DropdownMenuItem
                                key={index}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className={cn(
                                    action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                )}
                            >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
