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
  individualOrders?: Order[]; // For combined payments, show individual orders
}

type PaymentMethod = 'cash' | 'card' | 'mobile';

const paymentMethods = [
  { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
  { id: 'mobile' as PaymentMethod, label: 'Mobile', icon: Smartphone },
];

export function CheckoutDialog({ open, onOpenChange, order, onComplete, individualOrders }: CheckoutDialogProps) {
  const { deductStockForOrder, recipes } = useInventoryStore();
  const { restaurantInfo, taxes } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';
  const currencySymbol = getCurrencySymbol(currency);
  
  // Check if any taxes are enabled
  const hasEnabledTaxes = taxes.some(tax => tax.enabled);
  const showTax = hasEnabledTaxes && parseFloat(order.tax?.toString() || '0') > 0;
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);

  const grandTotal = parseFloat(order.total?.toString() || '0');
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
              {individualOrders && individualOrders.length > 1 ? (
                <>
                  {individualOrders.length} orders have been successfully paid:
                  <br />
                  <span className="text-sm font-medium">
                    {individualOrders.map(o => o.orderNumber).join(', ')}
                  </span>
                </>
              ) : (
                <>Order {order.orderNumber} has been successfully paid.</>
              )}
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
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Checkout - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            {order.tableName} • {order.items.length} items
            {individualOrders && individualOrders.length > 1 && (
              <span> • {individualOrders.length} orders combined</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Receipt/Slip - Show Individual Orders if Combined */}
          {individualOrders && individualOrders.length > 1 && (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-3 space-y-3 text-xs">
              <div className="text-center border-b pb-2">
                <h3 className="font-bold text-base">RECEIPT</h3>
                <p className="text-[10px] text-muted-foreground">{restaurantInfo?.name || 'Restaurant'}</p>
                <p className="text-[10px] text-muted-foreground">Table: {order.tableName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Individual Orders Breakdown */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {individualOrders.map((individualOrder, index) => (
                  <div key={individualOrder.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate">Order #{individualOrder.orderNumber}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(individualOrder.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="font-bold text-xs ml-2 flex-shrink-0">{formatCurrency(individualOrder.total, currency)}</p>
                    </div>
                    
                    {/* Items in this order */}
                    <div className="space-y-0.5 pl-1">
                      {individualOrder.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between text-[10px]">
                          <span className="truncate flex-1 min-w-0 mr-2">
                            {item.quantity}x {item.name}
                            {item.variant && <span className="text-muted-foreground"> ({item.variant})</span>}
                          </span>
                          <span className="flex-shrink-0">{formatCurrency(item.totalPrice, currency)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order totals */}
                    <div className="mt-1.5 pt-1.5 border-t space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(individualOrder.subtotal, currency)}</span>
                      </div>
                      {showTax && parseFloat(individualOrder.tax?.toString() || '0') > 0 && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(individualOrder.tax, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{formatCurrency(individualOrder.total, currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Combined Total */}
              <Separator className="my-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold">Combined Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.subtotal, currency)}</span>
                </div>
                {showTax && (
                  <div className="flex justify-between">
                    <span>Combined Tax:</span>
                    <span>{formatCurrency(order.tax, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(order.total, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary - Only show if not combined orders */}
          {(!individualOrders || individualOrders.length <= 1) && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, currency)}</span>
              </div>
              {showTax && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax, currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
          )}

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
                  <span className="font-bold">{formatCurrency(parseFloat(cashReceived) - grandTotal, currency)}</span>
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

        <DialogFooter className="flex-shrink-0">
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

