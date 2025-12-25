import { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt, Check, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInventoryStore } from '@/store/inventoryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Order } from '@/types';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onComplete: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'mobile';

const paymentMethods = [
  { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
  { id: 'mobile' as PaymentMethod, label: 'Mobile', icon: Smartphone },
];

const tipOptions = [0, 15, 18, 20, 25];

export function CheckoutDialog({ open, onOpenChange, order, onComplete }: CheckoutDialogProps) {
  const { deductStockForOrder, recipes } = useInventoryStore();
  const { restaurantInfo } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';
  const currencySymbol = getCurrencySymbol(currency);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);

  const tipAmount = customTip 
    ? parseFloat(customTip) || 0 
    : (order.subtotal * tipPercent) / 100;
  const grandTotal = order.total + tipAmount;
  const changeAmount = paymentMethod === 'cash' && cashReceived 
    ? parseFloat(cashReceived) - grandTotal 
    : 0;

  // Count items with recipes for stock deduction
  const itemsWithRecipes = order.items.filter(item => 
    recipes.some(r => r.menuItemId === item.menuItemId)
  );

  const handleProcess = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Auto Stock Deduction - deduct ingredients for all order items
    if (itemsWithRecipes.length > 0) {
      const itemsToDeduct = order.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));
      deductStockForOrder(itemsToDeduct);
      setStockDeducted(true);
    }
    
    setIsProcessing(false);
    setIsComplete(true);
  };

  const handleClose = () => {
    if (isComplete) {
      onComplete();
    }
    setIsComplete(false);
    setTipPercent(0);
    setCustomTip('');
    setCashReceived('');
    onOpenChange(false);
  };

  if (isComplete) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Order {order.orderNumber} has been successfully paid.
            </p>
            <div className="bg-muted rounded-lg p-4 max-w-xs mx-auto space-y-2">
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span className="font-bold">{formatCurrency(grandTotal, currency)}</span>
              </div>
              {paymentMethod === 'cash' && changeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Change</span>
                  <span className="font-bold">{formatCurrency(changeAmount, currency)}</span>
                </div>
              )}
            </div>
            
            {/* Stock Deduction Notice */}
            {stockDeducted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 max-w-xs mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Inventory updated for {itemsWithRecipes.length} item(s)</span>
                </div>
              </div>
            )}
            
            <Button className="mt-6" onClick={handleClose}>
              <Receipt className="mr-2 h-4 w-4" />
              Close & Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            {order.tableName} • {order.items.length} items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatCurrency(order.tax, currency)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Tip</span>
                <span>+{formatCurrency(tipAmount, currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(grandTotal, currency)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(method => (
                <Button
                  key={method.id}
                  variant={paymentMethod === method.id ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <method.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tip Selection */}
          <div className="space-y-2">
            <Label>Add Tip</Label>
            <div className="grid grid-cols-5 gap-2">
              {tipOptions.map(percent => (
                <Button
                  key={percent}
                  variant={tipPercent === percent && !customTip ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setTipPercent(percent);
                    setCustomTip('');
                  }}
                >
                  {percent}%
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm text-muted-foreground">Custom:</Label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                    setTipPercent(0);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cash Received (for cash payments) */}
          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <Label>Cash Received</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={grandTotal.toFixed(2)}
                  className="pl-8 text-lg"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                <div className="flex justify-between p-3 bg-green-50 rounded-lg text-green-700">
                  <span className="font-medium">Change Due</span>
                  <span className="font-bold">{formatCurrency(changeAmount, currency)}</span>
                </div>
              )}
              {cashReceived && parseFloat(cashReceived) < grandTotal && (
                <p className="text-sm text-destructive">
                  Amount received is less than total
                </p>
              )}
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {[1000, 5000, 10000].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashReceived(amount.toString())}
                  >
                    {currencySymbol}{amount.toLocaleString()}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCashReceived(Math.ceil(grandTotal).toString())}
                >
                  Exact
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcess}
            disabled={
              isProcessing || 
              (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < grandTotal))
            }
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Complete Payment - {formatCurrency(grandTotal, currency)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

