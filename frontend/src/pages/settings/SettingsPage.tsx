import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Building2,
  Receipt,
  Moon,
  Sun,
  Monitor,
  Crown,
  Save,
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
import { useTranslation } from 'react-i18next';
import { useSettingsStore, RestaurantInfo } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import { StaffManagement } from '@/components/features/settings/StaffManagement';

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
    updateRestaurantSettings,
    theme,
    setTheme,
    kdsTheme,
    setKdsTheme,
    currentPlan,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [taxRate, setTaxRate] = useState<string>('0');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Local state for restaurant info form
  const [restaurantForm, setRestaurantForm] = useState<RestaurantInfo | null>(null);

  // Load data on mount
  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  // Sync restaurant form state when restaurantInfo loads
  useEffect(() => {
    if (restaurantInfo) {
      setRestaurantForm(restaurantInfo);
      setTaxRate(restaurantInfo.taxRate?.toString() || '0');
    }
  }, [restaurantInfo]);

  // Optimized handlers using useCallback - simplified for better performance
  const handleFieldChange = useCallback((field: keyof RestaurantInfo, value: string) => {
    setRestaurantForm(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

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


  const handleSaveRestaurantInfo = async () => {
    if (!restaurantForm) return;

    setIsSaving(true);
    try {
      await updateRestaurantInfo(restaurantForm);
    } catch (error) {
      console.error('Failed to save restaurant info:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTaxRate = async () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0) {
      alert('Please enter a valid tax rate (0 or greater)');
      return;
    }

    try {
      setIsSaving(true);
      await updateRestaurantSettings({
        operations: {
          taxRate: rate
        }
      });
      // Reload restaurant to get updated tax rate
      await loadRestaurant();
    } catch (error) {
      console.error('Failed to save tax rate:', error);
      alert('Failed to save tax rate. Please try again.');
    } finally {
      setIsSaving(false);
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
          <TabsTrigger value="receipt" className="gap-2">
            <Receipt className="h-4 w-4" />
            Receipt Settings
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
                      value={restaurantForm?.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      disabled={!restaurantForm}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('settings.phone')}</Label>
                    <Input
                      id="phone"
                      value={restaurantForm?.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      disabled={!restaurantForm}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantForm?.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      disabled={!restaurantForm}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={restaurantForm?.website || ''}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      disabled={!restaurantForm}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">{t('settings.address')}</Label>
                    <Input
                      id="address"
                      value={restaurantForm?.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      disabled={!restaurantForm}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('settings.currency')}</Label>
                    <Select
                      value={restaurantForm?.currency || 'MMK'}
                      onValueChange={(v) => handleFieldChange('currency', v)}
                      disabled={!restaurantForm}
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
                      value={restaurantForm?.timezone || 'Asia/Yangon'}
                      onValueChange={(v) => handleFieldChange('timezone', v)}
                      disabled={!restaurantForm}
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
                <Button onClick={handleSaveRestaurantInfo} disabled={isSaving || !restaurantForm}>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Management */}
        <TabsContent value="staff" className="space-y-6">
          <StaffManagement />
        </TabsContent>

        {/* Receipt Settings */}
        <TabsContent value="receipt" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Configuration</CardTitle>
              <CardDescription>Configure how receipts are displayed and printed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Receipt Header */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Receipt Header</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure what information appears at the top of receipts
                  </p>
                </div>
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Restaurant Name</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Address</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Phone Number</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Header Text (optional)</Label>
                    <Input placeholder="Enter custom text to display at the top of receipts" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Receipt Footer */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Receipt Footer</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure what information appears at the bottom of receipts
                  </p>
                </div>
                <div className="space-y-3 pl-4">
                  <div className="space-y-2">
                    <Label>Thank You Message</Label>
                    <Input placeholder="Thank you for your visit!" defaultValue="Thank you for your visit!" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website (optional)</Label>
                    <Input placeholder="www.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Social Media (optional)</Label>
                    <Input placeholder="@restaurant" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Receipt Format */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Receipt Format</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Control what details appear on receipts
                  </p>
                </div>
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Tax Breakdown</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Item Details</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Modifiers/Add-ons</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Table Number</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Waiter Name</Label>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="space-y-2">
                    <Label>Receipt Width</Label>
                    <Select defaultValue="80mm">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58mm (Standard)</SelectItem>
                        <SelectItem value="80mm">80mm (Wide)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-print Receipt on Payment</Label>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Printer Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Printer Settings</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure receipt printer
                  </p>
                </div>
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Receipt Printer</Label>
                    <Switch defaultChecked={false} />
                  </div>
                  <div className="space-y-2">
                    <Label>Printer Name</Label>
                    <Input placeholder="Receipt Printer" />
                  </div>
                  <div className="space-y-2">
                    <Label>Printer IP Address (optional)</Label>
                    <Input placeholder="192.168.1.100" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={async () => {
                  // TODO: Save receipt settings
                  setIsSaving(true);
                  try {
                    // await updateRestaurantSettings({ receipt: receiptSettings });
                    setIsSaving(false);
                  } catch (error) {
                    console.error('Failed to save receipt settings:', error);
                    setIsSaving(false);
                  }
                }}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Receipt Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Configuration */}
        <TabsContent value="taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax rate and application for orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tax Rate */}
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="e.g., 8.0"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the tax rate as a percentage (e.g., 8 for 8%)
                </p>
              </div>

              <Separator />

              {/* Auto-Apply Tax Setting */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Automatically apply taxes to orders</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    When enabled, the tax rate will be automatically added to all orders. When disabled, taxes will not be applied.
                  </p>
                </div>
                <Switch
                  checked={restaurantInfo?.autoApplyTax !== false}
                  onCheckedChange={async (checked) => {
                    try {
                      await updateRestaurantSettings({
                        operations: {
                          autoApplyTax: checked
                        }
                      });
                    } catch (error) {
                      console.error('Failed to update tax setting:', error);
                    }
                  }}
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveTaxRate} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Tax Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
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

    </div>
  );
}

