import { FlaskConical, UtensilsCrossed, FolderTree } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesPage } from './CategoriesPage';
import { MenuItemsPage } from './MenuItemsPage';
import { RecipesPage } from './RecipesPage';

export function MenuPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            {t('menu.menuItems')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <FolderTree className="h-4 w-4" />
            {t('menu.categories')}
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            {t('menu.recipesAndCosts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <MenuItemsPage />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesPage />
        </TabsContent>

        <TabsContent value="recipes" className="mt-6">
          <RecipesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

