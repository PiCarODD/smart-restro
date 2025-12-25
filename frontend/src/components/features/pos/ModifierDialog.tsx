import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MenuItem, MenuVariant, MenuModifier } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ModifierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem;
  onAdd: (
    item: MenuItem,
    quantity: number,
    variant: MenuVariant | null,
    modifiers: MenuModifier[],
    notes: string
  ) => void;
}

export function ModifierDialog({ open, onOpenChange, item, onAdd }: ModifierDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    item.variants.length > 0 ? item.variants[0] : null
  );
  const [selectedModifiers, setSelectedModifiers] = useState<MenuModifier[]>([]);
  const [notes, setNotes] = useState('');

  const basePrice = selectedVariant?.price || item.basePrice;
  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitPrice = basePrice + modifiersTotal;
  const totalPrice = unitPrice * quantity;

  const toggleModifier = (modifier: MenuModifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.name === modifier.name);
      if (exists) {
        return prev.filter(m => m.name !== modifier.name);
      }
      return [...prev, modifier];
    });
  };

  const handleAdd = () => {
    onAdd(item, quantity, selectedVariant, selectedModifiers, notes);
    // Reset state
    setQuantity(1);
    setSelectedVariant(item.variants.length > 0 ? item.variants[0] : null);
    setSelectedModifiers([]);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quantity */}
          <div className="flex items-center justify-between">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Variants/Sizes */}
          {item.variants.length > 0 && (
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {item.variants.map(variant => (
                  <Button
                    key={variant.name}
                    variant={selectedVariant?.name === variant.name ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3"
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="text-xs opacity-80">{formatCurrency(variant.price)}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {item.modifiers.length > 0 && (
            <div className="space-y-2">
              <Label>Add-ons</Label>
              <div className="space-y-2">
                {item.modifiers.map(modifier => {
                  const isSelected = selectedModifiers.some(m => m.name === modifier.name);
                  return (
                    <div
                      key={modifier.name}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                      )}
                      onClick={() => toggleModifier(modifier)}
                    >
                      <span className="font-medium">{modifier.name}</span>
                      <span className="text-muted-foreground">
                        {modifier.price > 0 ? `+${formatCurrency(modifier.price)}` : 'Free'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Price Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Base price</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            {modifiersTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Add-ons</span>
                <span>+{formatCurrency(modifiersTotal)}</span>
              </div>
            )}
            {quantity > 1 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>× {quantity}</span>
                <span></span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>
            Add to Order - {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

