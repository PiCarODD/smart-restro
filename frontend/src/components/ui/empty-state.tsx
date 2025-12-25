import { 
  Package, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  FileText,
  Search,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Package, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states
export function NoOrdersEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No orders yet"
      description="When customers place orders, they'll appear here."
      action={onAction ? { label: "Create Order", onClick: onAction } : undefined}
    />
  );
}

export function NoMenuItemsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={UtensilsCrossed}
      title="No menu items"
      description="Add your first menu item to get started."
      action={onAction ? { label: "Add Menu Item", onClick: onAction } : undefined}
    />
  );
}

export function NoInventoryEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No inventory items"
      description="Start tracking your ingredients by adding them here."
      action={onAction ? { label: "Add Ingredient", onClick: onAction } : undefined}
    />
  );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

export function NoTablesEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No tables configured"
      description="Add tables to start managing your restaurant floor."
      action={onAction ? { label: "Add Table", onClick: onAction } : undefined}
    />
  );
}

export function NoReportsEmpty() {
  return (
    <EmptyState
      icon={FileText}
      title="No data available"
      description="Reports will appear here once you have order history."
    />
  );
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "An error occurred. Please try again.",
  onRetry 
}: { 
  title?: string; 
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}

