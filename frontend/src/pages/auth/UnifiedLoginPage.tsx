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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <SmartRetroLogo className="h-14 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-600">{t('auth.signInToRestaurant')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 border-0">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl border-0">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                clearError();
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                loginMode === 'admin'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>{t('auth.adminLogin')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('waiter');
                clearError();
              }}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                loginMode === 'waiter'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Utensils className="h-4 w-4" />
              <span>{t('auth.waiterLogin')}</span>
            </button>
          </div>

          {/* Admin Login Form */}
          {loginMode === 'admin' && (
            <form onSubmit={handleAdminSubmit(onAdminSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-semibold text-gray-700">
                  {t('auth.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@smartresto.com"
                    {...registerAdmin('email')}
                    className={`pl-10 h-12 border-0 border-b-2 ${
                      adminErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                    }`}
                  />
                </div>
                {adminErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{adminErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-semibold text-gray-700">
                  {t('auth.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...registerAdmin('password')}
                    className={`pr-10 h-12 border-0 border-b-2 ${
                      adminErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {adminErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{adminErrors.password.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="admin-remember"
                  checked={adminRememberMe}
                  onCheckedChange={(checked) => setAdminValue('rememberMe', checked as boolean)}
                  className="h-4 w-4"
                />
                <Label htmlFor="admin-remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  {t('auth.rememberMe')}
                </Label>
              </div>

              {error && loginMode === 'admin' && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 text-center font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>

              {/* Demo Credentials */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 text-center uppercase tracking-wide">
                  {t('auth.demoCredentials')}
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-purple-50 rounded-lg">
                    <span className="font-semibold text-purple-700">{t('auth.saasAdmin')}</span>
                    <span className="font-mono text-gray-700">superadmin@smartresto.com / super123</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-blue-50 rounded-lg">
                    <span className="font-semibold text-blue-700">{t('auth.tenantOwner')}</span>
                    <span className="font-mono text-gray-700">owner@thaipalace.com / owner123</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-700">{t('auth.restaurantAdmin')}</span>
                    <span className="font-mono text-gray-700">admin@smartresto.com / admin123</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Waiter Login Form */}
          {loginMode === 'waiter' && (
            <form onSubmit={handleWaiterSubmit(onWaiterSubmit)} className="space-y-5">
              {isLocked && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 text-center">
                    {t('waiter.accountLocked')}
                  </p>
                  <p className="text-xs text-red-600 text-center mt-1">
                    {t('waiter.accountLockedDescription')}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="waiter-identifier" className="text-sm font-semibold text-gray-700">
                  {t('waiter.emailOrPhone')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="waiter-identifier"
                    type="text"
                    placeholder={t('waiter.emailOrPhonePlaceholder')}
                    {...registerWaiter('identifier')}
                    className={`pl-10 h-12 border-0 border-b-2 ${
                      waiterErrors.identifier ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                    }`}
                    disabled={isLocked || isLoading}
                  />
                </div>
                {waiterErrors.identifier && (
                  <p className="text-sm text-red-600 mt-1">{waiterErrors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="waiter-pin" className="text-sm font-semibold text-gray-700">
                  {t('waiter.pin')}
                </Label>
                <div className="flex justify-center gap-2.5 mb-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                        watchWaiter('pin')?.length > index
                          ? 'border-primary bg-primary/10 shadow-md scale-105'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {watchWaiter('pin')?.length > index && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
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
                  className="text-center text-xl tracking-[0.3em] font-mono h-12 border-0 border-b-2 border-gray-300 focus:border-primary"
                  disabled={isLocked || isLoading}
                  maxLength={6}
                />
                {waiterErrors.pin && (
                  <p className="text-sm text-red-600 mt-1">{waiterErrors.pin.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <Checkbox
                  id="waiter-remember"
                  checked={waiterRememberMe}
                  onCheckedChange={(checked) => setWaiterValue('rememberMe', checked as boolean)}
                  className="h-4 w-4"
                />
                <Label htmlFor="waiter-remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  {t('auth.rememberMe')}
                </Label>
              </div>

              {error && loginMode === 'waiter' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-center font-medium">{error}</p>
                </div>
              )}

              {loginAttempts > 0 && loginAttempts < 5 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 text-center font-medium">
                    {t('waiter.failedAttempts', { count: loginAttempts, max: 5 })}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('waiter.loggingIn')}
                  </>
                ) : (
                  t('waiter.login')
                )}
              </Button>

              {/* Demo Hint */}
              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 text-center uppercase tracking-wide">
                  {t('waiter.demoHint')}
                </p>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
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
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5 text-primary" />
              {t('waiter.startShift')}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {t('waiter.startShiftDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {t('waiter.shiftStartTime')}: <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShiftDialog(false);
                navigate('/login');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleStartShift} className="bg-primary hover:bg-primary/90">
              {t('waiter.confirmStartShift')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
