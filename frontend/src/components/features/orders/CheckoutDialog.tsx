import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, Receipt, Check, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Payment methods will use translation labels dynamically
const getPaymentMethods = (t: (key: string) => string): Array<{ id: PaymentMethod; label: string; icon: typeof Banknote }> => [
  { id: 'cash' as PaymentMethod, label: t('checkout.cash'), icon: Banknote },
  { id: 'card' as PaymentMethod, label: t('checkout.card'), icon: CreditCard },
  { id: 'mobile' as PaymentMethod, label: t('checkout.mobile'), icon: Smartphone },
];

export function CheckoutDialog({ open, onOpenChange, order, onComplete, individualOrders }: CheckoutDialogProps) {
  const { t } = useTranslation();
  const { deductStockForOrder, recipes } = useInventoryStore();
  const { restaurantInfo } = useSettingsStore();
  const currency = restaurantInfo?.currency || 'MMK';
  const currencySymbol = getCurrencySymbol(currency);

  // Check if auto-apply tax is enabled and tax amount is greater than 0
  const autoApplyTax = restaurantInfo?.autoApplyTax === true;
  const showTax = autoApplyTax && parseFloat(order.tax?.toString() || '0') > 0;

  const grandTotal = parseFloat(order.total?.toString() || '0');
  
  // Round up to nearest 100 for cash received default (ensure it's always greater than total)
  const getSuggestedCashAmount = (total: number) => {
    if (total <= 0) return 100;
    if (total < 100) return 100;
    // Round up to nearest 100, but ensure it's always greater than total
    const rounded = Math.ceil(total / 100) * 100;
    // If rounded equals total (exact multiple of 100), add 100 to make it greater
    return rounded > total ? rounded : rounded + 100;
  };

  // Generate dynamic quick amounts based on order total
  const getQuickAmounts = (total: number) => {
    if (total <= 0) return [1000, 5000, 10000];
    
    // For small amounts, use fixed increments
    if (total < 5000) {
      return [1000, 2000, 5000];
    }
    
    // For medium amounts (5000-20000), round to nearest 5000
    if (total < 20000) {
      const rounded5k = Math.ceil(total / 5000) * 5000;
      const next5k = rounded5k + 5000;
      return [rounded5k, next5k, next5k + 5000];
    }
    
    // For larger amounts, round to nearest 5000 and provide increments
    const rounded5k = Math.ceil(total / 5000) * 5000;
    const next5k = rounded5k + 5000;
    const next10k = rounded5k + 10000;
    
    // Ensure all amounts are greater than total
    return [
      rounded5k > total ? rounded5k : rounded5k + 5000,
      next5k > total ? next5k : next5k + 5000,
      next10k > total ? next10k : next10k + 5000
    ];
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>(getSuggestedCashAmount(grandTotal).toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);

  // Reset cash received to suggested amount when dialog opens or grandTotal changes
  useEffect(() => {
    if (open && !isComplete) {
      setCashReceived(getSuggestedCashAmount(grandTotal).toString());
    }
  }, [open, grandTotal, isComplete]);

  // Group and combine items by menuItemId, variant, and modifiers
  const getGroupedItems = () => {
    const grouped = new Map<string, {
      menuItemId: string;
      name: string;
      variant?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      modifiers: Array<{name: string; price: number}>;
    }>();

    order.items.forEach(item => {
      // Normalize and sort modifiers for consistent comparison
      // This ensures items with same modifiers but different order are grouped together
      const normalizedModifiers = (item.modifiers || [])
        .map(m => ({
          name: (typeof m === 'string' ? m : (m.name || '')).trim().toLowerCase(),
          price: typeof m === 'string' ? 0 : (m.price || 0)
        }))
        .sort((a, b) => {
          // Sort by name first, then by price
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return a.price - b.price;
        });
      
      // Create a unique key based on menuItemId, variant, and modifiers
      const modifiersKey = normalizedModifiers.length > 0
        ? JSON.stringify(normalizedModifiers)
        : 'no-modifiers';
      
      // Normalize variant for comparison (trim and lowercase)
      const normalizedVariant = item.variant ? item.variant.trim().toLowerCase() : 'no-variant';
      
      const key = `${item.menuItemId || item.name}-${normalizedVariant}-${modifiersKey}`;
      
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        // Combine quantities and prices - ensure proper number parsing
        const itemQuantity = parseFloat(item.quantity?.toString() || '1') || 1;
        const itemTotalPrice = parseFloat(item.totalPrice?.toString() || '0') || 0;
        existing.quantity += itemQuantity;
        existing.totalPrice = (parseFloat(existing.totalPrice?.toString() || '0') || 0) + itemTotalPrice;
      } else {
        // Create new grouped item
        // Preserve original modifier names (not normalized) for display
        const modifiers = (item.modifiers || []).map(m => ({
          name: typeof m === 'string' ? m : (m.name || ''),
          price: typeof m === 'string' ? 0 : (m.price || 0)
        }));
        const itemQuantity = parseFloat(item.quantity?.toString() || '1') || 1;
        const itemUnitPrice = parseFloat(item.unitPrice?.toString() || '0') || 0;
        const itemTotalPrice = parseFloat(item.totalPrice?.toString() || '0') || 0;
        grouped.set(key, {
          menuItemId: item.menuItemId || '',
          name: item.name,
          variant: item.variant, // Preserve original variant for display
          quantity: itemQuantity,
          unitPrice: itemUnitPrice,
          totalPrice: itemTotalPrice,
          modifiers: modifiers,
        });
      }
    });

    return Array.from(grouped.values());
  };

  const groupedItems = getGroupedItems();

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

  const handlePrintReceipt = () => {
    // Build receipt HTML - always use groupedItems like checkout dialog
    const receiptItemsHtml = groupedItems.map((item) => {
      // Combine name with variant for display (same as checkout dialog)
      const displayName = item.variant ? `${item.name} (${item.variant})` : item.name;
      const itemTotalPrice = isNaN(item.totalPrice) ? 0 : item.totalPrice;
      
      return `
        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc;">
          <div style="flex: 1; margin-right: 10px;">
            ${item.quantity}x ${displayName}
            ${item.modifiers && item.modifiers.length > 0 ? `
              <div style="font-size: 9px; margin-left: 10px;">
                ${item.modifiers.map((mod: any) => {
                  const modName = typeof mod === 'string' ? mod : mod.name;
                  const modPrice = typeof mod === 'string' ? 0 : (mod.price || 0);
                  return `+ ${modName}${modPrice > 0 ? ` (+${formatCurrency(modPrice, currency)})` : ''}`;
                }).join(', ')}
              </div>
            ` : ''}
          </div>
          <div style="font-weight: bold;">${formatCurrency(itemTotalPrice, currency)}</div>
        </div>
      `;
    }).join('');

    const receiptHtml = `
      <div style="width: 100%; max-width: 80mm; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px; letter-spacing: 1px;">${t('checkout.receipt')}</div>
          <div style="font-size: 10px; margin: 3px 0;">${restaurantInfo?.name || 'Restaurant'}</div>
          <div style="font-size: 10px; margin: 3px 0;">${t('checkout.table')}: ${order.tableName}</div>
          <div style="font-size: 10px; margin: 3px 0;">${format(new Date(), 'MMM d, yyyy')} • ${format(new Date(), 'h:mm a')}</div>
        </div>
        ${receiptItemsHtml}
        <div style="margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
            <span>${t('checkout.subtotal')}:</span>
            <span>${formatCurrency(order.subtotal, currency)}</span>
          </div>
          ${showTax && parseFloat(order.tax?.toString() || '0') > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span>${t('checkout.tax')}:</span>
              <span>${formatCurrency(parseFloat(order.tax?.toString() || '0'), currency)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 16px; font-weight: bold; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px;">
            <span>${t('checkout.total')}:</span>
            <span>${formatCurrency(order.total, currency)}</span>
          </div>
        </div>
        <div style="text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px;">
          <div>${t('checkout.paymentMethod')}: ${getPaymentMethods(t).find(m => m.id === paymentMethod)?.label || paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</div>
          <div style="margin-top: 5px;">${t('checkout.totalPaid')}: ${formatCurrency(grandTotal, currency)}</div>
          ${paymentMethod === 'cash' && changeAmount > 0 ? `<div style="margin-top: 5px;">${t('checkout.change')}: ${formatCurrency(changeAmount, currency)}</div>` : ''}
          <div style="margin-top: 10px;">Thank you for your visit!</div>
        </div>
      </div>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                width: 80mm;
              }
            }
            body {
              margin: 0;
              padding: 10px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              background: white;
            }
            .receipt-container {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              letter-spacing: 1px;
            }
            .receipt-info {
              font-size: 10px;
              margin: 3px 0;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px dotted #ccc;
            }
            .receipt-item-name {
              flex: 1;
              margin-right: 10px;
            }
            .receipt-item-price {
              font-weight: bold;
            }
            .receipt-totals {
              margin-top: 10px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
            .receipt-total-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }
            .receipt-grand-total {
              font-size: 16px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleClose = () => {
    if (isComplete) {
      onComplete();
    }
    setIsComplete(false);
    setCashReceived('');
    onOpenChange(false);
  };

  const handleCloseAndPrint = () => {
    // Small delay to ensure receipt content is rendered
    setTimeout(() => {
      handlePrintReceipt();
      setTimeout(() => {
        handleClose();
      }, 500);
    }, 100);
  };

  if (isComplete) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent>
            <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('checkout.paymentComplete')}</h2>
            <p className="text-muted-foreground mb-6">
              {individualOrders && individualOrders.length > 1 ? (
                <>
                  {t('checkout.ordersPaid', { count: individualOrders.length })}:
                  <br />
                  <span className="text-sm font-medium">
                    {individualOrders.map(o => o.orderNumber).join(', ')}
                  </span>
                </>
              ) : (
                <>{t('checkout.orderPaid', { orderNumber: order.orderNumber })}</>
              )}
            </p>
            <div className="bg-muted rounded-lg p-4 max-w-xs mx-auto space-y-2">
              <div className="flex justify-between">
                <span>{t('checkout.totalPaid')}</span>
                <span className="font-bold">{formatCurrency(grandTotal, currency)}</span>
              </div>
              {paymentMethod === 'cash' && changeAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('checkout.change')}</span>
                  <span className="font-bold">{formatCurrency(changeAmount, currency)}</span>
                </div>
              )}
            </div>

            {/* Stock Deduction Notice */}
            {stockDeducted && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 max-w-xs mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{t('checkout.inventoryUpdated', { count: itemsWithRecipes.length })}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={handleClose}>
                {t('checkout.close')}
              </Button>
              <Button onClick={handleCloseAndPrint}>
                <Receipt className="mr-2 h-4 w-4" />
                {t('checkout.printReceipt')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {individualOrders && individualOrders.length > 1 
              ? `${t('checkout.title')} - ${t('checkout.combinedOrder')} (${individualOrders.length} ${t('checkout.ordersCombined')})`
              : `${t('checkout.title')} - ${order.orderNumber}`
            }
          </DialogTitle>
          <DialogDescription>
            {t('checkout.table')}: {order.tableName} • {order.items.length} {t('checkout.items')}
            {individualOrders && individualOrders.length > 1 && (
              <span> • {individualOrders.length} {t('checkout.ordersCombined')}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Order Summary - Combined View */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                <h3 className="font-bold text-xl mb-2 tracking-wide">{t('checkout.receipt')}</h3>
                <p className="font-semibold text-sm mb-1">{restaurantInfo?.name || 'Restaurant'}</p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="font-medium">{t('checkout.table')}: {order.tableName}</span>
                  <span>•</span>
                  <span>{format(new Date(), 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{format(new Date(), 'h:mm a')}</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {groupedItems.map((item, index) => {
                  // Combine name with variant for display
                  const displayName = item.variant 
                    ? `${item.name} (${item.variant})` 
                    : item.name;
                  
                  return (
                    <div key={index} className="flex justify-between text-sm pb-2 border-b border-gray-100">
                      <div className="flex-1 min-w-0 mr-3">
                        <span className="font-medium">
                          {item.quantity}x {displayName}
                        </span>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-muted-foreground ml-4 mt-0.5">
                            {item.modifiers.map((mod, idx) => {
                              const modName = typeof mod === 'string' ? mod : mod.name;
                              const modPrice = typeof mod === 'string' ? 0 : (mod.price || 0);
                              return (
                                <span key={idx}>
                                  + {modName}{modPrice > 0 && ` (${formatCurrency(modPrice, currency)})`}
                                  {idx < item.modifiers.length - 1 && ', '}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span className="flex-shrink-0 font-medium">
                        {formatCurrency(isNaN(item.totalPrice) ? 0 : item.totalPrice, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t-2 border-gray-300">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('checkout.subtotal')}:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal, currency)}</span>
                </div>
                {showTax && parseFloat(order.tax?.toString() || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('checkout.tax')}:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(order.tax?.toString() || '0'), currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-300">
                  <span>{t('checkout.total')}:</span>
                  <span className="text-primary">{formatCurrency(order.total, currency)}</span>
                </div>
              </div>
            </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('checkout.paymentMethod')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {getPaymentMethods(t).map(method => (
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
              <Label>{t('checkout.cashReceived')}</Label>
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
                  <span className="font-medium">{t('checkout.changeDue')}</span>
                  <span className="font-bold">{formatCurrency(parseFloat(cashReceived) - grandTotal, currency)}</span>
                </div>
              )}
              {cashReceived && parseFloat(cashReceived) < grandTotal && (
                <p className="text-sm text-destructive">
                  {t('checkout.amountLessThanTotal')}
                </p>
              )}
              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {getQuickAmounts(grandTotal).map(amount => (
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
                  {t('checkout.exact')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('checkout.cancel')}
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
                {t('checkout.processing')}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t('checkout.completePayment')} - {formatCurrency(grandTotal, currency)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

