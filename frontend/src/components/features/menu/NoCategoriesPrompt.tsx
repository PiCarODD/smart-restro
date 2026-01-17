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

interface NoCategoriesPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: () => void;
}

export function NoCategoriesPrompt({
  open,
  onOpenChange,
  onCreateCategory,
}: NoCategoriesPromptProps) {
  const handleCreateCategory = () => {
    onOpenChange(false);
    onCreateCategory();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Create a Category First</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You need to create at least one menu category before adding menu items. Categories help organize your menu (e.g., Appetizers, Main Courses, Desserts, Beverages).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            After creating a category, you'll be able to add menu items and assign them to that category.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
