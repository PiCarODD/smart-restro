import { useState, useCallback } from 'react';
import { UseFormSetError } from 'react-hook-form';
import { getApiError, ApiError } from '@/lib/api/client';

export interface FieldError {
  field: string;
  message: string;
}

export interface FormErrorData {
  message: string;
  errors: FieldError[];
  status?: number;
}

/**
 * Hook for handling API errors in forms
 * Extracts field-level errors and sets them in react-hook-form
 */
export function useFormErrorHandler<T extends Record<string, any>>(
  setError: UseFormSetError<T>
) {
  const [apiError, setApiError] = useState<ApiError | null>(null);

  const handleApiError = useCallback(
    (error: unknown): FormErrorData => {
      const errorData = getApiError(error);
      setApiError(errorData);

      // Map backend field names to frontend form field names
      const fieldMapping: Record<string, keyof T> = {
        // Common mappings
        sectionId: 'section' as keyof T,
        categoryId: 'categoryId' as keyof T,
        tableNumber: 'tableNumber' as keyof T,
        // Add more mappings as needed
      };

      const fieldErrors = errorData.errors || errorData.details || [];

      // Set errors in react-hook-form
      if (fieldErrors.length > 0) {
        fieldErrors.forEach((fieldError: { field: string; message: string }) => {
          // Try to map field name, fallback to original
          const formField = fieldMapping[fieldError.field] || fieldError.field;
          setError(formField as any, {
            type: 'server',
            message: fieldError.message,
          });
        });
      }

      return {
        message: errorData.message,
        errors: fieldErrors,
        status: errorData.status,
      };
    },
    [setError]
  );

  const clearError = useCallback(() => {
    setApiError(null);
  }, []);

  return {
    apiError,
    handleApiError,
    clearError,
  };
}
