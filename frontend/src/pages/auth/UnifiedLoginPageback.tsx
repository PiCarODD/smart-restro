import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, Shield, Utensils, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SmartRetroLogo } from '@/components/ui/SmartRetroLogo';
import { useAuthStore } from '@/store/authStore';

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
      return '/waiter';
    case 'kitchen':
      return '/kds';
    default:
      return '/dashboard';
  }
};

const REMEMBER_EMAIL_KEY = 'remembered_email';
const REMEMBER_PASSWORD_KEY = 'remembered_password';
const REMEMBER_IDENTIFIER_KEY = 'remembered_identifier';
const REMEMBER_PIN_KEY = 'remembered_pin';

type AdminLoginFormData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type WaiterLoginFormData = {
  identifier: string;
  pin: string;
  rememberMe?: boolean;
};

export function UnifiedLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, waiterLogin, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'waiter'>('admin');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const adminLoginSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
    rememberMe: z.boolean().optional().default(false),
  });

  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    formState: { errors: adminErrors },
    setValue: setAdminValue,
    watch: watchAdmin,
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const waiterLoginSchema = z.object({
    identifier: z.string().min(1, t('waiter.emailOrPhone')),
    pin: z.string().length(6, t('waiter.pin')),
    rememberMe: z.boolean().optional().default(false),
  });

  const {
    register: registerWaiter,
    handleSubmit: handleWaiterSubmit,
    formState: { errors: waiterErrors },
    setValue: setWaiterValue,
    watch: watchWaiter,
  } = useForm<WaiterLoginFormData>({
    resolver: zodResolver(waiterLoginSchema),
    defaultValues: {
      identifier: '',
      pin: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    const rememberAdmin = localStorage.getItem('remember_admin') === 'true';
    if (rememberAdmin) {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      const savedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);
      if (savedEmail && savedPassword) {
        setAdminValue('email', savedEmail);
        setAdminValue('password', savedPassword);
        setAdminValue('rememberMe', true);
      }
    }

    const rememberWaiter = localStorage.getItem('remember_waiter') === 'true';
    if (rememberWaiter) {
      const savedIdentifier = localStorage.getItem(REMEMBER_IDENTIFIER_KEY);
      const savedPin = localStorage.getItem(REMEMBER_PIN_KEY);
      if (savedIdentifier && savedPin) {
        setWaiterValue('identifier', savedIdentifier);
        setWaiterValue('pin', savedPin);
        setWaiterValue('rememberMe', true);
      }
    }
  }, [setAdminValue, setWaiterValue]);

  const onAdminSubmit = async (data: AdminLoginFormData) => {
    clearError();
    
    if (data.rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      localStorage.setItem(REMEMBER_PASSWORD_KEY, data.password);
      localStorage.setItem('remember_admin', 'true');
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      localStorage.removeItem('remember_admin');
    }

    const success = await login({ email: data.email, password: data.password });
    if (success) {
      const user = useAuthStore.getState().user;
      if (user) {
        navigate(getRedirectPath(user.role));
      } else {
        navigate('/dashboard');
      }
    }
  };

  const onWaiterSubmit = async (data: WaiterLoginFormData) => {
    clearError();

    if (isLocked) {
      return;
    }

    if (data.rememberMe) {
      localStorage.setItem(REMEMBER_IDENTIFIER_KEY, data.identifier);
      localStorage.setItem(REMEMBER_PIN_KEY, data.pin);
      localStorage.setItem('remember_waiter', 'true');
    } else {
      localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
      localStorage.removeItem(REMEMBER_PIN_KEY);
      localStorage.removeItem('remember_waiter');
    }

    const success = await waiterLogin(data.identifier.trim(), data.pin);
    
    if (success) {
      setLoginAttempts(0);
      const user = useAuthStore.getState().user;
      if (user && (user.role === 'waiter' || user.role === 'server')) {
        setShowShiftDialog(true);
      } else {
        navigate(getRedirectPath(user?.role || 'waiter'));
      }
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setLoginAttempts(0);
        }, 30 * 60 * 1000);
      }
    }
  };

  const handleStartShift = () => {
    localStorage.setItem('waiter_shift_start', new Date().toISOString());
    setShowShiftDialog(false);
    navigate('/waiter');
  };

  const adminRememberMe = watchAdmin('rememberMe');
  const waiterRememberMe = watchWaiter('rememberMe');

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234ade80' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="relative z-10 text-center space-y-8">
          <SmartRetroLogo className="h-16 w-auto mx-auto" />
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-lg text-gray-600 max-w-md">
              Streamline your restaurant operations with our comprehensive management system
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <SmartRetroLogo className="h-12 w-auto mx-auto mb-4" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">{t('auth.welcomeBack')}</h2>
            <p className="text-gray-500">{t('auth.signInToRestaurant')}</p>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginMode('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
                loginMode === 'admin'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="h-4 w-4" />
              {t('auth.adminLogin')}
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('waiter')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
                loginMode === 'waiter'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Utensils className="h-4 w-4" />
              {t('auth.waiterLogin')}
            </button>
          </div>

          {/* Admin Login Form */}
          {loginMode === 'admin' && (
            <form onSubmit={handleAdminSubmit(onAdminSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter your email"
                    {...registerAdmin('email')}
                    className={`pl-10 h-11 ${adminErrors.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {adminErrors.email && (
                  <p className="text-sm text-red-600">{adminErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...registerAdmin('password')}
                    className={`pr-10 h-11 ${adminErrors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {adminErrors.password && (
                  <p className="text-sm text-red-600">{adminErrors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="admin-remember"
                    checked={adminRememberMe}
                    onCheckedChange={(checked) => setAdminValue('rememberMe', checked as boolean)}
                  />
                  <Label htmlFor="admin-remember" className="text-sm cursor-pointer">
                    {t('auth.rememberMe')}
                  </Label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>

              {/* Demo Credentials */}
              <div className="pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-3 text-center">
                  {t('auth.demoCredentials')}
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-purple-50 rounded">
                    <span className="font-medium text-purple-700">{t('auth.saasAdmin')}</span>
                    <span className="font-mono text-gray-600">superadmin@smartresto.com / super123</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span className="font-medium text-blue-700">{t('auth.tenantOwner')}</span>
                    <span className="font-mono text-gray-600">owner@thaipalace.com / owner123</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700">{t('auth.restaurantAdmin')}</span>
                    <span className="font-mono text-gray-600">admin@smartresto.com / admin123</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Waiter Login Form */}
          {loginMode === 'waiter' && (
            <form onSubmit={handleWaiterSubmit(onWaiterSubmit)} className="space-y-5">
              {isLocked && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-700 text-center">
                    {t('waiter.accountLocked')}
                  </p>
                  <p className="text-xs text-red-600 text-center mt-1">
                    {t('waiter.accountLockedDescription')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="waiter-identifier" className="text-sm font-medium">
                  {t('waiter.emailOrPhone')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="waiter-identifier"
                    type="text"
                    placeholder={t('waiter.emailOrPhonePlaceholder')}
                    {...registerWaiter('identifier')}
                    className={`pl-10 h-11 ${waiterErrors.identifier ? 'border-red-500' : ''}`}
                    disabled={isLocked || isLoading}
                  />
                </div>
                {waiterErrors.identifier && (
                  <p className="text-sm text-red-600">{waiterErrors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="waiter-pin" className="text-sm font-medium">
                  {t('waiter.pin')}
                </Label>
                <div className="flex justify-center gap-2 mb-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                        watchWaiter('pin')?.length > index
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {watchWaiter('pin')?.length > index && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                  ))}
                </div>
                <Input
                  id="waiter-pin"
                  type="password"
                  placeholder="Enter 6-digit PIN"
                  {...registerWaiter('pin')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setWaiterValue('pin', value);
                  }}
                  className="text-center text-xl tracking-widest font-mono h-11"
                  disabled={isLocked || isLoading}
                  maxLength={6}
                />
                {waiterErrors.pin && (
                  <p className="text-sm text-red-600">{waiterErrors.pin.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="waiter-remember"
                    checked={waiterRememberMe}
                    onCheckedChange={(checked) => setWaiterValue('rememberMe', checked as boolean)}
                  />
                  <Label htmlFor="waiter-remember" className="text-sm cursor-pointer">
                    {t('auth.rememberMe')}
                  </Label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {loginAttempts > 0 && loginAttempts < 5 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 text-center">
                    {t('waiter.failedAttempts', { count: loginAttempts, max: 5 })}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('waiter.loggingIn')}
                  </>
                ) : (
                  t('waiter.login')
                )}
              </Button>

              {/* Demo Hint */}
              <div className="pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2 text-center">
                  {t('waiter.demoHint')}
                </p>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <p className="text-xs font-mono text-gray-700">
                    waiter@smartresto.com / 567890
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Shift Start Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('waiter.startShift')}
            </DialogTitle>
            <DialogDescription>
              {t('waiter.startShiftDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {t('waiter.shiftStartTime')}: <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowShiftDialog(false); navigate('/login'); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleStartShift}>
              {t('waiter.confirmStartShift')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
