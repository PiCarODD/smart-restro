import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTableStore } from '@/store/tableStore';
import { Table } from '@/types';

const tableSchema = z.object({
  tableNumber: z.string().min(1, 'Table number is required'),
  name: z.string().optional(),
  section: z.string().min(1, 'Section is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
});

type TableFormData = z.infer<typeof tableSchema>;

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTable: Table | null;
}

export function TableDialog({ open, onOpenChange, editingTable }: TableDialogProps) {
  const { sections, addTable, updateTable } = useTableStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableNumber: '',
      name: '',
      section: sections[0]?.name || 'Main Floor',
      capacity: 4,
    },
  });

  useEffect(() => {
    if (editingTable) {
      reset({
        tableNumber: editingTable.tableNumber,
        name: editingTable.name || '',
        section: editingTable.section,
        capacity: editingTable.capacity,
      });
    } else {
      reset({
        tableNumber: '',
        name: '',
        section: sections[0]?.name || 'Main Floor',
        capacity: 4,
      });
    }
  }, [editingTable, reset, sections]);

  const onSubmit = async (data: TableFormData) => {
    try {
      if (editingTable) {
        await updateTable(editingTable.id, data);
      } else {
        await addTable({
          ...data,
          status: 'available',
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save table:', error);
      // Error is handled by the store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTable ? 'Edit Table' : 'Add Table'}
          </DialogTitle>
          <DialogDescription>
            {editingTable
              ? 'Update the table details below.'
              : 'Add a new table to your floor plan.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Table Number *</Label>
              <Input
                id="tableNumber"
                placeholder="e.g., 1, 2, A1"
                {...register('tableNumber')}
                className={errors.tableNumber ? 'border-destructive' : ''}
              />
              {errors.tableNumber && (
                <p className="text-sm text-destructive">{errors.tableNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                {...register('capacity', { valueAsNumber: true })}
                className={errors.capacity ? 'border-destructive' : ''}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g., Window Booth, VIP Corner"
              {...register('name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Select
              value={watch('section')}
              onValueChange={(value) => setValue('section', value)}
            >
              <SelectTrigger className={errors.section ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: section.color }}
                      />
                      <span>{section.icon}</span>
                      <span>{section.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.section && (
              <p className="text-sm text-destructive">{errors.section.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTable ? 'Save Changes' : 'Add Table'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

