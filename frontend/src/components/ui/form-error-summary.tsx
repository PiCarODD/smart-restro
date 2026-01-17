import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: FieldError[];
  details?: FieldError[];
  status?: number;
}

interface FormErrorSummaryProps {
  error: ApiError | null;
  onDismiss?: () => void;
  className?: string;
}

export function FormErrorSummary({ error, onDismiss, className }: FormErrorSummaryProps) {
  if (!error) return null;

  const fieldErrors = error.errors || error.details || [];

  return (
    <div className={`rounded-lg border border-destructive/50 bg-destructive/10 p-4 ${className || ''}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-destructive">
              {error.message || 'Please fix the errors below'}
            </h4>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/20"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {fieldErrors.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive max-h-32 overflow-y-auto">
              {fieldErrors.map((fieldError, index) => (
                <li key={index}>
                  <span className="font-medium">{fieldError.field}:</span>{' '}
                  {fieldError.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
