import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { posShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts?: Array<{ keys: string[]; description: string }>;
}

export function KeyboardShortcutsHelp({ 
  shortcuts = posShortcutsHelp 
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">?</kbd> to toggle this help
        </p>
      </DialogContent>
    </Dialog>
  );
}

