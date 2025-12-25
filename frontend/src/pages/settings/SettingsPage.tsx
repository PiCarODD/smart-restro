import { useState, useRef, useEffect } from 'react';
import { 
  Settings,
  Building2, 
  ToggleLeft, 
  Receipt, 
  Moon,
  Sun,
  Monitor,
  Lock,
  Crown,
  Save,
  ChefHat,
  ShoppingCart,
  Package,
  CreditCard,
  Cog,
  ImagePlus,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, FeatureToggle, TaxConfig } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import { StaffManagement } from '@/components/features/settings/StaffManagement';

const categoryIcons: Record<string, any> = {
  kitchen: ChefHat,
  ordering: ShoppingCart,
  inventory: Package,
  payments: CreditCard,
  general: Cog,
};

const planBadgeColors: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  professional: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-purple-100 text-purple-700',
};

export function SettingsPage() {
  const { t } = useTranslation();
  const {
    restaurantInfo,
    isLoadingRestaurant,
    loadRestaurant,
    updateRestaurantInfo,
    uploadLogo,
    features,
    isLoadingFeatures,
    loadFeatures,
    toggleFeature,
    taxes,
    isLoadingTaxes,
    loadTaxes,
    addTax,
    updateTax,
    deleteTax,
    theme,
    setTheme,
    kdsTheme,
    setKdsTheme,
    currentPlan,
    setCurrentPlan,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('general');
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxConfig | null>(null);
  const [taxForm, setTaxForm] = useState<{ name: string; rate: string; appliesTo: TaxConfig['appliesTo'] }>({ name: '', rate: '', appliesTo: 'all' });
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Load data on mount
  useEffect(() => {
    loadRestaurant();
    loadFeatures();
    loadTaxes();
  }, [loadRestaurant, loadFeatures, loadTaxes]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo size should be less than 2MB');
        return;
      }
      try {
        await uploadLogo(file);
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Failed to upload logo:', error);
      }
    }
  };

  const handleRemoveLogo = async () => {
    // Note: Backend doesn't have a remove logo endpoint, so we'll need to handle this differently
    // For now, we'll just clear the logo URL if there's an update endpoint that accepts null
    // This is a limitation - we'd need a backend endpoint to remove the logo
    console.warn('Logo removal not implemented - needs backend support');
  };

  // Group features by category
  const featuresByCategory = features.length > 0 ? features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureToggle[]>) : {};

  const canEnableFeature = (feature: FeatureToggle) => {
    if (!feature.requiresPlan) return true;
    const planOrder = ['starter', 'professional', 'enterprise'];
    const currentPlanIndex = planOrder.indexOf(currentPlan);
    const requiredPlanIndex = planOrder.indexOf(feature.requiresPlan);
    return currentPlanIndex >= requiredPlanIndex;
  };

  const handleSaveRestaurantInfo = async () => {
    if (!restaurantInfo) return;
    
    setIsSaving(true);
    try {
      await updateRestaurantInfo(restaurantInfo);
    } catch (error) {
      console.error('Failed to save restaurant info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openTaxDialog = (tax?: TaxConfig) => {
    if (tax) {
      setEditingTax(tax);
      setTaxForm({ name: tax.name, rate: tax.rate.toString(), appliesTo: tax.appliesTo });
    } else {
      setEditingTax(null);
      setTaxForm({ name: '', rate: '', appliesTo: 'all' });
    }
    setIsTaxDialogOpen(true);
  };

  const handleSaveTax = async () => {
    const rate = parseFloat(taxForm.rate);
    if (!taxForm.name || isNaN(rate)) return;

    try {
      if (editingTax) {
        await updateTax(editingTax.id, { name: taxForm.name, rate, appliesTo: taxForm.appliesTo });
      } else {
        await addTax({ name: taxForm.name, rate, enabled: true, appliesTo: taxForm.appliesTo });
      }
      setIsTaxDialogOpen(false);
      setTaxForm({ name: '', rate: '', appliesTo: 'all' });
    } catch (error) {
      console.error('Failed to save tax:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.manageConfiguration')}</p>
        </div>
        <Badge className={planBadgeColors[currentPlan]}>
          <Crown className="h-3 w-3 mr-1" />
          {t(`settings.${currentPlan}`)} Plan
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            {t('settings.general')}
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            {t('settings.staff')}
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleLeft className="h-4 w-4" />
            {t('settings.features')}
          </TabsTrigger>
          <TabsTrigger value="taxes" className="gap-2">
            <Receipt className="h-4 w-4" />
            {t('settings.taxes')}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Moon className="h-4 w-4" />
            {t('settings.appearance')}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          {isLoadingRestaurant ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.restaurantInfo')}</CardTitle>
                <CardDescription>{t('settings.basicDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>{t('settings.logo')}</Label>
                <div className="flex items-start gap-4">
                  <div 
                    className="relative w-24 h-24 border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {restaurantInfo?.logo ? (
                      <>
                        <img 
                          src={restaurantInfo.logo} 
                          alt="Logo" 
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveLogo();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <ImagePlus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Upload</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{t('settings.uploadRestaurantLogo')}</p>
                    <p>This will appear on receipts, the waiter app, and reports.</p>
                    <p className="text-xs mt-1">{t('settings.recommendedSquareImage')}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={restaurantInfo?.name || ''}
                    onChange={(e) => updateRestaurantInfo({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    value={restaurantInfo?.phone || ''}
                    onChange={(e) => updateRestaurantInfo({ phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantInfo?.email || ''}
                    onChange={(e) => updateRestaurantInfo({ email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={restaurantInfo?.website || ''}
                    onChange={(e) => updateRestaurantInfo({ website: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('settings.address')}</Label>
                  <Input
                    id="address"
                    value={restaurantInfo?.address || ''}
                    onChange={(e) => updateRestaurantInfo({ address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('settings.currency')}</Label>
                  <Select 
                    value={restaurantInfo?.currency || 'MMK'} 
                    onValueChange={(v) => updateRestaurantInfo({ currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MMK">MMK - Myanmar Kyat (Ks)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
                      <SelectItem value="THB">THB - Thai Baht (฿)</SelectItem>
                      <SelectItem value="PHP">PHP - Philippine Peso (₱)</SelectItem>
                      <SelectItem value="MYR">MYR - Malaysian Ringgit (RM)</SelectItem>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah (Rp)</SelectItem>
                      <SelectItem value="VND">VND - Vietnamese Dong (₫)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select 
                    value={restaurantInfo?.timezone || 'Asia/Yangon'} 
                    onValueChange={(v) => updateRestaurantInfo({ timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Yangon">Myanmar (MMT)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Bangkok (ICT)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Manila">Manila (PHT)</SelectItem>
                      <SelectItem value="Asia/Ho_Chi_Minh">Ho Chi Minh (ICT)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Jakarta (WIB)</SelectItem>
                      <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (MYT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveRestaurantInfo} disabled={isSaving || !restaurantInfo}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('common.loading') : t('settings.saveChanges')}
              </Button>
            </CardFooter>
          </Card>
          )}

          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.subscription')}</CardTitle>
              <CardDescription>{t('settings.choosePlan')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Starter Plan */}
                <div className={cn(
                  "p-5 border-2 rounded-lg transition-all",
                  currentPlan === 'starter' 
                    ? "border-primary bg-primary/5" 
                    : "border-muted"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{t('settings.starter')}</h3>
                    {currentPlan === 'starter' && <Badge className="bg-primary">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold mb-1">{t('settings.contactSales')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.perfectForSmall')}</p>
                  <Button 
                    variant={currentPlan === 'starter' ? "secondary" : "outline"} 
                    className="w-full mb-4"
                    onClick={() => window.open('mailto:sales@smartrestaurant.com?subject=Starter Plan Inquiry', '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t('settings.contactSales')}
                  </Button>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.upToTables', { count: 20 })}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.basicPOS')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.menuManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.orderManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.basicReports')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.kitchenDisplayKDS')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.waiterApp')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.inventoryManagement')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.autoStockDeduction')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.splitBilling')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.tableReservations')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.multiLocation')}</li>
                  </ul>
                </div>

                {/* Professional Plan */}
                <div className={cn(
                  "p-5 border-2 rounded-lg transition-all relative",
                  currentPlan === 'professional' 
                    ? "border-primary bg-primary/5" 
                    : "border-blue-500"
                )}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{t('settings.professional')}</h3>
                    {currentPlan === 'professional' && <Badge className="bg-primary">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold mb-1">{t('settings.contactSales')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.bestForGrowing')}</p>
                  <Button 
                    variant={currentPlan === 'professional' ? "secondary" : "default"} 
                    className="w-full mb-4"
                    onClick={() => window.open('mailto:sales@smartrestaurant.com?subject=Professional Plan Inquiry', '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t('settings.contactSales')}
                  </Button>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.upToTables', { count: 50 })}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.advancedPOS')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.menuManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.orderManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.advancedReports')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.kitchenDisplayKDS')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.waiterApp')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.inventoryManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.autoStockDeduction')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.splitBilling')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.tableReservations')}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" /> {t('settings.multiLocation')}</li>
                  </ul>
                </div>

                {/* Enterprise Plan */}
                <div className={cn(
                  "p-5 border-2 rounded-lg transition-all",
                  currentPlan === 'enterprise' 
                    ? "border-primary bg-primary/5" 
                    : "border-purple-500"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      {t('settings.enterprise')}
                    </h3>
                    {currentPlan === 'enterprise' && <Badge className="bg-primary">Current</Badge>}
                  </div>
                  <p className="text-2xl font-bold mb-1">{t('settings.contactSales')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.forLargeChains')}</p>
                  <Button 
                    variant={currentPlan === 'enterprise' ? "secondary" : "outline"} 
                    className="w-full mb-4 border-purple-500 text-purple-700 hover:bg-purple-50"
                    onClick={() => window.open('mailto:sales@smartrestaurant.com?subject=Enterprise Plan Inquiry', '_blank')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t('settings.contactSales')}
                  </Button>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.unlimitedTables')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.fullPOSFeatures')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.menuManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.orderManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.customReports')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.kitchenDisplayKDS')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.waiterApp')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.inventoryManagement')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.autoStockDeduction')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.splitBilling')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.tableReservations')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.multiLocationSupport')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.customerSelfOrdering')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.prioritySupport')}</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {t('settings.customIntegrations')}</li>
                  </ul>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="font-medium mb-2">Need help choosing the right plan?</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Our sales team is here to help you find the perfect solution for your restaurant.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Button variant="outline" onClick={() => window.open('mailto:sales@smartrestaurant.com', '_blank')}>
                    <Mail className="h-4 w-4 mr-2" />
                    sales@smartrestaurant.com
                  </Button>
                  <Button variant="outline" onClick={() => window.open('tel:+959123456789', '_blank')}>
                    <Phone className="h-4 w-4 mr-2" />
                    +95 9 123 456 789
                  </Button>
                </div>
              </div>

              {/* Demo Mode Notice */}
              <div className="text-center text-sm text-muted-foreground">
                <p>🎮 <strong>Demo Mode:</strong> Click on any plan to simulate switching plans and see feature access changes.</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {(['starter', 'professional', 'enterprise'] as const).map((plan) => (
                  <Button
                    key={plan}
                    variant={currentPlan === plan ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPlan(plan)}
                  >
                    {currentPlan === plan && <Check className="h-4 w-4 mr-1" />}
                    Try {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Management */}
        <TabsContent value="staff" className="space-y-6">
          <StaffManagement />
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features" className="space-y-6">
          {isLoadingFeatures ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(featuresByCategory).map(([category, categoryFeatures]) => {
            const Icon = categoryIcons[category] || Settings;
            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="capitalize">{category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryFeatures.map((feature) => {
                    const canEnable = canEnableFeature(feature);
                    return (
                      <div
                        key={feature.id}
                        className={cn(
                          "flex items-start justify-between p-4 border rounded-lg",
                          !canEnable && "opacity-60 bg-muted/50"
                        )}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{feature.name}</h4>
                            {feature.requiresPlan && (
                              <Badge variant="outline" className={planBadgeColors[feature.requiresPlan]}>
                                {feature.requiresPlan === 'enterprise' && <Crown className="h-3 w-3 mr-1" />}
                                {feature.requiresPlan}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                          {!canEnable && (
                            <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Upgrade to {feature.requiresPlan} plan to enable
                            </p>
                          )}
                        </div>
                        <Switch
                          checked={feature.enabled && canEnable}
                          onCheckedChange={async () => {
                            if (canEnable) {
                              await toggleFeature(feature.id);
                            }
                          }}
                          disabled={!canEnable}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
          )}
        </TabsContent>

        {/* Tax Configuration */}
        <TabsContent value="taxes" className="space-y-6">
          {isLoadingTaxes ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>Configure taxes applied to orders</CardDescription>
              </div>
              <Button onClick={() => openTaxDialog()}>
                Add Tax
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((tax) => (
                    <TableRow key={tax.id}>
                      <TableCell className="font-medium">{tax.name}</TableCell>
                      <TableCell>{tax.rate}%</TableCell>
                      <TableCell className="capitalize">{tax.appliesTo}</TableCell>
                      <TableCell>
                        <Switch
                          checked={tax.enabled}
                          onCheckedChange={() => updateTax(tax.id, { enabled: !tax.enabled })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openTaxDialog(tax)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete ${tax.name}? This action cannot be undone.`)) {
                                await deleteTax(tax.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearanceSettings')}</CardTitle>
              <CardDescription>Customize the appearance of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>{t('settings.displayTheme')}</Label>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { value: 'light', label: t('settings.light'), icon: Sun },
                    { value: 'dark', label: t('settings.dark'), icon: Moon },
                    { value: 'system', label: t('settings.system'), icon: Monitor },
                  ] as const).map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all",
                        theme === option.value 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/50"
                      )}
                      onClick={() => setTheme(option.value)}
                    >
                      <option.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>KDS Display Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Kitchen Display System theme (typically dark for better visibility)
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {([
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                  ] as const).map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all",
                        kdsTheme === option.value 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-primary/50"
                      )}
                      onClick={() => setKdsTheme(option.value)}
                    >
                      <option.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tax Dialog */}
      <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Tax' : t('settings.addTax')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tax-name">{t('settings.taxName')}</Label>
              <Input
                id="tax-name"
                value={taxForm.name}
                onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                placeholder="e.g., Sales Tax"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">{t('settings.taxRate')}</Label>
              <Input
                id="tax-rate"
                type="number"
                step="0.01"
                value={taxForm.rate}
                onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                placeholder="e.g., 8.875"
              />
            </div>
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select 
                value={taxForm.appliesTo} 
                onValueChange={(v: any) => setTaxForm({ ...taxForm, appliesTo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="food">Food Only</SelectItem>
                  <SelectItem value="beverages">Beverages Only</SelectItem>
                  <SelectItem value="alcohol">Alcohol Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaxDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveTax}>
              {editingTax ? t('settings.saveChanges') : t('settings.addTax')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

