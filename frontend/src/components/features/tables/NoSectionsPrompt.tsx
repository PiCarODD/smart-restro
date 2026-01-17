import { AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NoSectionsPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSection: () => void;
}

export function NoSectionsPrompt({
  open,
  onOpenChange,
  onCreateSection,
}: NoSectionsPromptProps) {
  const handleCreateSection = () => {
    onOpenChange(false);
    onCreateSection();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Create a Section First</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You need to create at least one section before adding tables. Sections help you organize your restaurant floor plan (e.g., Main Floor, Patio, VIP Area).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            After creating a section, you'll be able to add tables and assign them to that section.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateSection}>
            <Plus className="mr-2 h-4 w-4" />
            Create Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
