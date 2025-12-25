import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTableStore, Section } from '@/store/tableStore';
import { SectionDialog } from './SectionDialog';

export function SectionManager() {
  const { sections, tables, deleteSection } = useTableStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  const openCreateDialog = () => {
    setEditingSection(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (section: Section) => {
    setDeletingSection(section);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingSection) {
      try {
        await deleteSection(deletingSection.id);
        setIsDeleteDialogOpen(false);
        setDeletingSection(null);
      } catch (error) {
        console.error('Failed to delete section:', error);
      }
    }
  };

  const getTableCount = (sectionName: string) => {
    return tables.filter(t => t.section === sectionName).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sections</h2>
          <p className="text-sm text-muted-foreground">Manage your floor sections</p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="grid gap-3">
        {sections.map((section) => {
          const tableCount = getTableCount(section.name);
          
          return (
            <Card key={section.id} className="overflow-hidden">
              <div 
                className="h-1"
                style={{ backgroundColor: section.color }}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: section.color }}
                    />
                    {section.icon && <span className="text-xl">{section.icon}</span>}
                    <div>
                      <p className="font-medium">{section.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tableCount} table{tableCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(section)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openDeleteDialog(section)}
                      className="text-destructive hover:text-destructive"
                      disabled={sections.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sections.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No sections yet</p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first section
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <SectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingSection={editingSection}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Section {deletingSection?.name || ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

