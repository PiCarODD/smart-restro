import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, Utensils, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';

export function WaiterLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { waiterLogin, isLoading, error } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showShiftDialog, setShowShiftDialog] = useState(false);

  const handlePinEntry = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    // Validate identifier and PIN before login
    if (!identifier.trim()) {
      return;
    }
    if (pin.length === 6) {
      const success = await waiterLogin(identifier.trim(), pin);
      if (success) {
        // Show shift start dialog instead of navigating directly
        setShowShiftDialog(true);
      }
    }
  };

  const handleStartShift = () => {
    // Record shift start time (in production, this would be sent to server)
    const shiftStartTime = new Date().toISOString();
    localStorage.setItem('waiter_shift_start', shiftStartTime);
    setShowShiftDialog(false);
    navigate('/waiter');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Utensils className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('waiter.login')}</CardTitle>
          <CardDescription>{t('waiter.enterPin')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identifier Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('waiter.emailOrPhone')}</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('waiter.emailOrPhonePlaceholder')}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isLoading}
            />
          </div>

          {/* PIN Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('waiter.pin')}</label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                    pin.length > index ? 'border-primary bg-primary/10' : 'border-muted'
                  }`}
                >
                  {pin.length > index ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((digit) => (
              <Button
                key={digit}
                variant={digit === 'C' ? 'destructive' : 'outline'}
                className="h-14 text-xl font-medium"
                onClick={() => {
                  if (digit === 'C') handleClear();
                  else if (digit === '⌫') handleBackspace();
                  else handlePinEntry(digit);
                }}
                disabled={isLoading}
              >
                {digit}
              </Button>
            ))}
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleSubmit}
            disabled={!identifier.trim() || pin.length !== 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>

          {/* Demo hint */}
          <p className="text-center text-xs text-muted-foreground">
            {t('waiter.demoHint')}
            <br />
            <span className="text-xs">Demo: waiter@demo.com / PIN: 123456</span>
          </p>
        </CardContent>
      </Card>

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
            <p className="text-sm text-muted-foreground">
              {t('waiter.shiftStartTime')}: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowShiftDialog(false); navigate('/waiter/login'); }}>
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

