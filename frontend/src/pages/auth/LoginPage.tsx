import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

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
};

export function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const loginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
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

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl">🍽️</span>
          </div>
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

        {/* Demo Credentials */}
        <div className="mt-6 rounded-lg bg-muted p-4">
          <p className="text-sm font-medium mb-2">{t('auth.demoCredentials')}:</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><span className="font-medium text-purple-600">{t('auth.saasAdmin')}:</span> superadmin@smartresto.com / super123</p>
            <p><span className="font-medium text-blue-600">{t('auth.tenantOwner')}:</span> owner@thaipalace.com / owner123</p>
            <p><span className="font-medium">{t('auth.restaurantAdmin')}:</span> admin@smartresto.com / admin123</p>
            <p><span className="font-medium">{t('auth.manager')}:</span> manager@smartresto.com / manager123</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

