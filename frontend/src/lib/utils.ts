import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency symbols for manual formatting (some currencies not well supported by Intl)
const currencySymbols: Record<string, { symbol: string; position: 'before' | 'after' }> = {
  MMK: { symbol: 'Ks', position: 'after' },
  USD: { symbol: '$', position: 'before' },
  EUR: { symbol: '€', position: 'before' },
  SGD: { symbol: 'S$', position: 'before' },
  THB: { symbol: '฿', position: 'before' },
  PHP: { symbol: '₱', position: 'before' },
  MYR: { symbol: 'RM', position: 'before' },
  IDR: { symbol: 'Rp', position: 'before' },
  VND: { symbol: '₫', position: 'after' },
};

export function formatCurrency(amount: number, currency: string = 'MMK'): string {
  const config = currencySymbols[currency] || currencySymbols.MMK;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'MMK' || currency === 'VND' || currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'MMK' || currency === 'VND' || currency === 'IDR' ? 0 : 2,
  }).format(amount);
  
  return config.position === 'before' 
    ? `${config.symbol}${formatted}` 
    : `${formatted} ${config.symbol}`;
}

// Get just the currency symbol for input fields
export function getCurrencySymbol(currency: string = 'MMK'): string {
  const config = currencySymbols[currency] || currencySymbols.MMK;
  return config.symbol;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

