import { useCallback, useMemo } from 'react';

interface UseBulkSelectionOptions<T extends { id: string }> {
    items: T[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
    onClear: () => void;
}

export function useBulkSelection<T extends { id: string }>({
    items,
    selectedIds,
    onToggle,
    onSelectAll,
    onClear
}: UseBulkSelectionOptions<T>) {
    const allItemIds = useMemo(() => items.map(item => item.id), [items]);

    const isAllSelected = useMemo(() => {
        return items.length > 0 && selectedIds.length === items.length && 
               items.every(item => selectedIds.includes(item.id));
    }, [items, selectedIds]);

    const isPartiallySelected = useMemo(() => {
        return selectedIds.length > 0 && !isAllSelected;
    }, [selectedIds.length, isAllSelected]);

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.includes(item.id));
    }, [items, selectedIds]);

    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            onClear();
        } else {
            onSelectAll(allItemIds);
        }
    }, [isAllSelected, allItemIds, onSelectAll, onClear]);

    const handleToggle = useCallback((id: string) => {
        onToggle(id);
    }, [onToggle]);

    const handleClear = useCallback(() => {
        onClear();
    }, [onClear]);

    const isSelected = useCallback((id: string) => {
        return selectedIds.includes(id);
    }, [selectedIds]);

    return {
        selectedIds,
        selectedItems,
        isAllSelected,
        isPartiallySelected,
        selectedCount: selectedIds.length,
        totalCount: items.length,
        handleSelectAll,
        handleToggle,
        handleClear,
        isSelected
    };
}
