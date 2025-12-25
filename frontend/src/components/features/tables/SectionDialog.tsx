import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTableStore, Section } from '@/store/tableStore';

const sectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  color: z.string().min(1, 'Color is required'),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSection: Section | null;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function SectionDialog({ open, onOpenChange, editingSection }: SectionDialogProps) {
  const { addSection, updateSection } = useTableStore();
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
    },
  });

  const watchName = watch('name');

  useEffect(() => {
    if (editingSection) {
      reset({
        name: editingSection.name,
        color: editingSection.color,
      });
      setSelectedColor(editingSection.color || '#3b82f6');
    } else {
      reset({
        name: '',
        color: '#3b82f6',
      });
      setSelectedColor('#3b82f6');
    }
  }, [editingSection, reset]);

  const onSubmit = async (data: SectionFormData) => {
    const sectionData: any = {
      name: data.name,
      color: selectedColor,
    };
    
    // Don't send icon field if not provided
    // (icon is optional and we're not using it in the UI currently)

    try {
      if (editingSection) {
        await updateSection(editingSection.id, sectionData);
      } else {
        await addSection(sectionData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save section:', error);
      // Error is handled by the store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSection ? 'Edit Section' : 'Create Section'}
          </DialogTitle>
          <DialogDescription>
            {editingSection
              ? 'Update the section details below.'
              : 'Create a new section for your floor plan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Section Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Main Floor, Patio, Private Room"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setSelectedColor(color);
                    setValue('color', color);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-medium">
                {watchName || 'Section Name'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSection ? 'Save Changes' : 'Create Section'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

