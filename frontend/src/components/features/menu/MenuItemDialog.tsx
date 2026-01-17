import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, ImagePlus, Trash2 } from 'lucide-react';
import { FormErrorSummary } from '@/components/ui/form-error-summary';
import { useFormErrorHandler } from '@/hooks/useFormErrorHandler';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMenuStore } from '@/store/menuStore';
import { useSettingsStore } from '@/store/settingsStore';
import { MenuItem, MenuCategory, MenuVariant, MenuModifier } from '@/types';
import { getCurrencySymbol } from '@/lib/utils';
import { menuApi } from '@/lib/api';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  basePrice: z.number().min(0, 'Price must be positive'),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  categories: MenuCategory[];
}

export function MenuItemDialog({ open, onOpenChange, editingItem, categories }: MenuItemDialogProps) {
  const { addMenuItem, updateMenuItem } = useMenuStore();
  const { restaurantInfo } = useSettingsStore();
  const currencySymbol = getCurrencySymbol(restaurantInfo?.currency || 'MMK');
  
  const [variants, setVariants] = useState<MenuVariant[]>([]);
  const [modifiers, setModifiers] = useState<MenuModifier[]>([]);
  const [newVariant, setNewVariant] = useState({ name: '', price: '' });
  const [newModifier, setNewModifier] = useState({ name: '', price: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // Store the uploaded image URL
  const [apiError, setApiError] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      basePrice: 0,
      isActive: true,
      isAvailable: true,
    },
  });

  const { handleApiError, clearError } = useFormErrorHandler(setError);

  useEffect(() => {
    if (open) {
      clearError();
      setApiError(null);
      
      if (editingItem) {
        reset({
          name: editingItem.name,
          description: editingItem.description || '',
          categoryId: editingItem.categoryId,
          basePrice: editingItem.basePrice,
          isActive: editingItem.isActive,
          isAvailable: editingItem.isAvailable,
        });
        setVariants(editingItem.variants || []);
        setModifiers(editingItem.modifiers || []);
        const existingImage = editingItem.image || null;
        setImagePreview(existingImage);
        setImageUrl(existingImage); // Set imageUrl for editing existing items
      } else {
        reset({
          name: '',
          description: '',
          categoryId: categories[0]?.id || '',
          basePrice: 0,
          isActive: true,
          isAvailable: true,
        });
        setVariants([]);
        setModifiers([]);
        setImagePreview(null);
        setImageUrl(null);
      }
    }
  }, [editingItem, reset, categories, open, clearError]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload image and get URL
      try {
        const response = await menuApi.uploadImage(file);
        setImageUrl(response.imageUrl);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    try {
      clearError();
      setApiError(null);
      
      const itemData = {
        ...data,
        variants,
        modifiers,
        allergens: [],
        dietaryTags: [],
        image: imageUrl || undefined, // Use the uploaded URL, not the preview data URL
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
      } else {
        await addMenuItem(itemData);
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      const errorData = handleApiError(error);
      setApiError(errorData);
    }
  };

  const addVariant = () => {
    if (newVariant.name && newVariant.price) {
      setVariants([...variants, { name: newVariant.name, price: parseFloat(newVariant.price) }]);
      setNewVariant({ name: '', price: '' });
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addModifier = () => {
    if (newModifier.name) {
      setModifiers([...modifiers, { name: newModifier.name, price: parseFloat(newModifier.price) || 0 }]);
      setNewModifier({ name: '', price: '' });
    }
  };

  const removeModifier = (index: number) => {
    setModifiers(modifiers.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? 'Update the menu item details below.'
              : 'Create a new menu item for your restaurant.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormErrorSummary error={apiError} onDismiss={() => { clearError(); setApiError(null); }} className="mb-4" />
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="variants">Sizes/Variants</TabsTrigger>
              <TabsTrigger value="modifiers">Add-ons</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Item Image</Label>
                <div className="flex items-start gap-4">
                  <div 
                    className="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <ImagePlus className="h-8 w-8 mb-1" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>Upload an image of your menu item.</p>
                    <p>Recommended: 400x400px, max 5MB</p>
                    <p>Formats: JPG, PNG, WebP</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Fried Rice"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={watch('categoryId')}
                    onValueChange={(value) => setValue('categoryId', value)}
                  >
                    <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your dish..."
                  {...register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`pl-8 ${errors.basePrice ? 'border-destructive' : ''}`}
                    {...register('basePrice', { valueAsNumber: true })}
                  />
                </div>
                {errors.basePrice && (
                  <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Show this item in the menu</p>
                </div>
                <Switch
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <Label>Available</Label>
                  <p className="text-sm text-muted-foreground">Item is in stock and can be ordered</p>
                </div>
                <Switch
                  checked={watch('isAvailable')}
                  onCheckedChange={(checked) => setValue('isAvailable', checked)}
                />
              </div>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add different sizes or variations of this item (e.g., Small, Medium, Large)
              </p>

              {/* Existing Variants */}
              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="flex-1 font-medium">{variant.name}</span>
                    <span className="text-muted-foreground">{currencySymbol}{variant.price.toFixed(2)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add New Variant */}
              <div className="flex gap-2">
                <Input
                  placeholder="Size name (e.g., Large)"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="pl-8"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                  />
                </div>
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Modifiers Tab */}
            <TabsContent value="modifiers" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Add optional add-ons or modifications (e.g., Extra Cheese, No Onion)
              </p>

              {/* Existing Modifiers */}
              <div className="space-y-2">
                {modifiers.map((modifier, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <span className="flex-1 font-medium">{modifier.name}</span>
                    <span className="text-muted-foreground">
                      {modifier.price > 0 ? `+${currencySymbol}${modifier.price.toFixed(2)}` : 'Free'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeModifier(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add New Modifier */}
              <div className="flex gap-2">
                <Input
                  placeholder="Modifier name (e.g., Extra Spicy)"
                  value={newModifier.name}
                  onChange={(e) => setNewModifier({ ...newModifier, name: e.target.value })}
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={newModifier.price}
                    onChange={(e) => setNewModifier({ ...newModifier, price: e.target.value })}
                  />
                </div>
                <Button type="button" variant="outline" onClick={addModifier}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

