import { formatDistanceToNow, format } from 'date-fns';
import { TrendingUp, TrendingDown, RotateCcw, ShoppingCart, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig = {
  add: { 
    label: 'Added', 
    icon: TrendingUp, 
    color: 'text-green-600', 
    bg: 'bg-green-100' 
  },
  remove: { 
    label: 'Removed', 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bg: 'bg-red-100' 
  },
  adjustment: { 
    label: 'Adjusted', 
    icon: RotateCcw, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100' 
  },
  order_deduction: { 
    label: 'Order', 
    icon: ShoppingCart, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100' 
  },
};

export function StockHistoryDialog({ open, onOpenChange }: StockHistoryDialogProps) {
  const { stockHistory } = useInventoryStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Stock History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {stockHistory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No stock adjustments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockHistory.map(adjustment => {
                const config = typeConfig[adjustment.type];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={adjustment.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className={cn("p-2 rounded-full", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {adjustment.ingredientName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {adjustment.type === 'adjustment' ? (
                          <span>
                            Set to <span className="font-medium">{adjustment.newStock}</span>
                            {' '}(was {adjustment.previousStock})
                          </span>
                        ) : (
                          <span>
                            {adjustment.type === 'add' ? '+' : '-'}
                            {adjustment.quantity}
                            {' → '}
                            <span className="font-medium">{adjustment.newStock}</span>
                          </span>
                        )}
                      </div>
                      {adjustment.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {adjustment.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <p>{formatDistanceToNow(new Date(adjustment.createdAt), { addSuffix: true })}</p>
                      <p>{format(new Date(adjustment.createdAt), 'h:mm a')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

