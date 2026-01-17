import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, MapPin, Phone, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurantStore } from '@/store/restaurantStore';

const onboardingSchema = z.object({
    name: z.string().min(2, 'Restaurant name is required'),
    description: z.string().optional().or(z.literal('')),
    addressLine1: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    phone: z.string().min(5, 'Phone number is required'),
    currency: z.string().min(1, 'Currency is required'),
    timezone: z.string().min(1, 'Timezone is required'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function OnboardingPage() {
    const { createRestaurant, isLoading } = useRestaurantStore();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            currency: 'MMK',
            timezone: 'Asia/Yangon',
        },
    });

    const onSubmit = async (data: OnboardingFormData) => {
        setError(null);
        try {
            await createRestaurant(data);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Failed to create restaurant. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex justify-center mb-8">
                    <img src="/logos/SMART-restaurant.png" alt="Logo" className="h-[200px] w-auto" />
                </div>

                <Card className="border-t-4 border-t-primary shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Welcome to SmartResto!</CardTitle>
                        <CardDescription>
                            Let's get your restaurant set up. You can change these details later in settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {error && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">Restaurant Name</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            placeholder="e.g. Olive Garden"
                                            className="pl-9"
                                            {...register('name')}
                                        />
                                    </div>
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Briefly describe your restaurant..."
                                        className="min-h-[80px]"
                                        {...register('description')}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="addressLine1">Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="addressLine1"
                                            placeholder="Street address"
                                            className="pl-9"
                                            {...register('addressLine1')}
                                        />
                                    </div>
                                    {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" placeholder="e.g. Yangon" {...register('city')} />
                                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            placeholder="+95 9..."
                                            className="pl-9"
                                            {...register('phone')}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select onValueChange={(v) => setValue('currency', v)} defaultValue="MMK">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
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
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select onValueChange={(v) => setValue('timezone', v)} defaultValue="Asia/Yangon">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
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

                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    SmartResto SaaS Platform &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
