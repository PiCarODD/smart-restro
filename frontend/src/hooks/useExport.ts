import { useState, useCallback } from 'react';
import { saasApi } from '@/lib/api';
import { ExportQueryParams } from '@/lib/api/saasApi';

interface UseExportOptions {
    entityType: 'tenants' | 'users';
    defaultParams?: ExportQueryParams;
}

export function useExport({ entityType, defaultParams = {} }: UseExportOptions) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportData = useCallback(async (params?: ExportQueryParams) => {
        setIsExporting(true);
        setError(null);

        try {
            const exportParams: ExportQueryParams = { ...defaultParams, ...params, format: 'csv' as 'csv' };
            const blob = entityType === 'tenants'
                ? await saasApi.exportTenants(exportParams)
                : await saasApi.exportUsers(exportParams);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${entityType}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Export failed';
            setError(errorMessage);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, [entityType, defaultParams]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        exportData,
        isExporting,
        error,
        clearError
    };
}
