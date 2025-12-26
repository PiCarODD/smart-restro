import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { AdvertisingSlideshow } from '@/components/auth/AdvertisingSlideshow';

// LocalStorage keys for remembering credentials
const REMEMBERED_EMAIL_KEY = 'remembered_email';
const REMEMBERED_PASSWORD_KEY = 'remembered_password';
const REMEMBER_ME_KEY = 'remember_me';

// Get redirect path based on user role
const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return '/saas-admin';
    case 'tenant_admin':
    case 'admin':
    case 'manager':
    case 'cashier':
    case 'inventory':
      return '/dashboard';
    case 'waiter':
    case 'server':
    case 'kitchen':
      return '/waiter';
    default:
      return '/dashboard';
  }
};

type LoginFormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
    rememberMe: z.boolean().optional().default(false),
  });

  // Load remembered credentials from localStorage
  const getRememberedCredentials = () => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    const rememberedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY) || '';
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

    return {
      email: rememberedEmail,
      password: rememberedPassword,
      rememberMe,
    };
  };

  const rememberedCredentials = getRememberedCredentials();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedCredentials.email,
      password: rememberedCredentials.password,
      rememberMe: rememberedCredentials.rememberMe,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    
    // Handle "remember me" - save or clear credentials
    if (data.rememberMe) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email);
      localStorage.setItem(REMEMBERED_PASSWORD_KEY, data.password);
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
    
    const success = await login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
    if (success) {
      // Get the user from store after login
      const user = useAuthStore.getState().user;
      if (user) {
        const redirectPath = getRedirectPath(user.role);
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Advertisement images - update these paths to your actual ad images
  const adImages = [
    '/ads/ad-1.jpg',
    '/ads/ad-2.jpg',
    '/ads/ad-3.jpg',
    '/ads/ad-4.jpg',
    '/ads/ad-5.jpg',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
      {/* Advertising TV - Hidden on mobile, shown on large screens */}
      <div className="hidden lg:block h-[600px] w-full">
        <AdvertisingSlideshow images={adImages} interval={5000} />
      </div>
      
      {/* Advertising TV - Shown on mobile above login form */}
      <div className="lg:hidden h-[300px] w-full mb-6">
        <AdvertisingSlideshow images={adImages} interval={5000} />
      </div>

      {/* Login Form */}
      <Card className="shadow-xl w-full">
        <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src="/logos/SMART-restaurant.png" 
            alt="SmartResto Logo" 
            className="h-48 w-auto object-contain"
          />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.welcomeBack')}</CardTitle>
        <CardDescription>
          {t('auth.signInToRestaurant')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@smartresto.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="rememberMe"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal cursor-pointer"
            >
              {t('auth.rememberMe')}
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {t('auth.loginError')}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.signIn')
            )}
          </Button>
        </form>

        </CardContent>
      </Card>
    </div>
  );
}

