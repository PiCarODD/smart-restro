import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common POS shortcuts
export const getPOSShortcuts = (actions: {
  onPay?: () => void;
  onCancel?: () => void;
  onHold?: () => void;
  onDiscount?: () => void;
  onSearch?: () => void;
  onClearItem?: () => void;
}) => {
  const shortcuts: ShortcutConfig[] = [];

  if (actions.onPay) {
    shortcuts.push({
      key: 'p',
      ctrl: true,
      action: actions.onPay,
      description: 'Pay / Checkout',
    });
  }

  if (actions.onCancel) {
    shortcuts.push({
      key: 'Escape',
      action: actions.onCancel,
      description: 'Cancel / Close',
    });
  }

  if (actions.onHold) {
    shortcuts.push({
      key: 'h',
      ctrl: true,
      action: actions.onHold,
      description: 'Hold Order',
    });
  }

  if (actions.onDiscount) {
    shortcuts.push({
      key: 'd',
      ctrl: true,
      action: actions.onDiscount,
      description: 'Apply Discount',
    });
  }

  if (actions.onSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: actions.onSearch,
      description: 'Search Menu',
    });
  }

  if (actions.onClearItem) {
    shortcuts.push({
      key: 'Delete',
      action: actions.onClearItem,
      description: 'Remove Selected Item',
    });
  }

  return shortcuts;
};

// Keyboard shortcuts help dialog content
export const posShortcutsHelp = [
  { keys: ['Ctrl', 'P'], description: 'Pay / Checkout' },
  { keys: ['Ctrl', 'K'], description: 'Search Menu' },
  { keys: ['Ctrl', 'H'], description: 'Hold Order' },
  { keys: ['Ctrl', 'D'], description: 'Apply Discount' },
  { keys: ['Delete'], description: 'Remove Selected Item' },
  { keys: ['Esc'], description: 'Cancel / Close Dialog' },
  { keys: ['1-9'], description: 'Select Category' },
];

