import { useState } from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInventoryStore } from '@/store/inventoryStore';
import { Ingredient } from '@/types';
import { cn } from '@/lib/utils';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
}

type AdjustmentType = 'add' | 'remove' | 'adjustment';

export function StockAdjustmentDialog({ 
  open, 
  onOpenChange, 
  ingredient 
}: StockAdjustmentDialogProps) {
  const { adjustStock } = useInventoryStore();
  
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredient || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return;

    adjustStock(ingredient.id, qty, adjustmentType, reason || undefined);
    
    // Reset and close
    setQuantity('');
    setReason('');
    setAdjustmentType('add');
    onOpenChange(false);
  };

  const getNewStock = (): number => {
    if (!ingredient || !quantity) return ingredient?.currentStock || 0;
    const qty = parseFloat(quantity) || 0;
    
    if (adjustmentType === 'add') return ingredient.currentStock + qty;
    if (adjustmentType === 'remove') return Math.max(0, ingredient.currentStock - qty);
    return qty; // adjustment sets directly
  };

  if (!ingredient) return null;

  const newStock = getNewStock();
  const willBeLow = newStock <= ingredient.minimumStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {ingredient.name} - Current: {ingredient.currentStock} {ingredient.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Adjustment Type */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={adjustmentType === 'add' ? 'default' : 'outline'}
              className={cn(
                "flex flex-col h-auto py-3",
                adjustmentType === 'add' && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setAdjustmentType('add')}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs">Add Stock</span>
            </Button>
            <Button
              type="button"
              variant={adjustmentType === 'remove' ? 'default' : 'outline'}
              className={cn(
                "flex flex-col h-auto py-3",
                adjustmentType === 'remove' && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setAdjustmentType('remove')}
            >
              <Minus className="h-5 w-5 mb-1" />
              <span className="text-xs">Remove</span>
            </Button>
            <Button
              type="button"
              variant={adjustmentType === 'adjustment' ? 'default' : 'outline'}
              className={cn(
                "flex flex-col h-auto py-3",
                adjustmentType === 'adjustment' && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={() => setAdjustmentType('adjustment')}
            >
              <RotateCcw className="h-5 w-5 mb-1" />
              <span className="text-xs">Set Count</span>
            </Button>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === 'adjustment' ? 'New Stock Count' : 'Quantity'} ({ingredient.unit})
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter ${ingredient.unit}`}
              autoFocus
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className={cn(
              "p-3 rounded-lg",
              willBeLow ? "bg-orange-50 border border-orange-200" : "bg-muted"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Stock:</span>
                <span className={cn(
                  "font-bold",
                  willBeLow && "text-orange-600"
                )}>
                  {newStock.toFixed(2)} {ingredient.unit}
                </span>
              </div>
              {willBeLow && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ This will be below minimum stock ({ingredient.minimumStock} {ingredient.unit})
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Weekly delivery, Spoilage, Inventory count..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!quantity || parseFloat(quantity) <= 0}
              className={cn(
                adjustmentType === 'add' && "bg-green-600 hover:bg-green-700",
                adjustmentType === 'remove' && "bg-red-600 hover:bg-red-700",
                adjustmentType === 'adjustment' && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {adjustmentType === 'add' && 'Add Stock'}
              {adjustmentType === 'remove' && 'Remove Stock'}
              {adjustmentType === 'adjustment' && 'Update Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

