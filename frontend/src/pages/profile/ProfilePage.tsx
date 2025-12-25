import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  Key,
  LogOut,
  Camera,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  server: 'bg-green-100 text-green-700',
  kitchen: 'bg-orange-100 text-orange-700',
  cashier: 'bg-purple-100 text-purple-700',
};

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  // Get display name - prefer name, fallback to firstName + lastName
  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  // Initialize form when editing starts
  useEffect(() => {
    if (isEditing && user) {
      setEditForm({
        name: displayName,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [isEditing, user, displayName]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">{t('profile.pleaseLogin')}</p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    // In production, this would update the user in the auth store
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    // Validation
    if (!passwordForm.currentPassword) {
      setPasswordError(t('profile.currentPasswordRequired'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('profile.passwordTooShort'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsChangePasswordOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    // Show success message
    alert(t('profile.passwordChanged'));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) {
      // Fallback to firstName and lastName
      const first = user?.firstName?.[0] || '';
      const last = user?.lastName?.[0] || '';
      return (first + last).toUpperCase() || 'U';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-700'}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                {user.isActive !== false && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {t('common.active')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
                <Key className="h-4 w-4 mr-2" />
                {t('profile.changePassword')}
              </Button>
              <Button variant="destructive" onClick={() => setIsLogoutDialogOpen(true)}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('profile.profileInformation')}</CardTitle>
              <CardDescription>{t('profile.updateProfileInfo')}</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                {t('profile.editProfile')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            // Edit Mode
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('common.name')}</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('profile.phone')}</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="e.g., +95 9 123 456 789"
                  />
                </div>
              </div>
            </>
          ) : (
            // View Mode
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.name')}</p>
                  <p className="font-medium">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.email')}</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.phone')}</p>
                  <p className="font-medium">{user.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.role')}</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.memberSince')}</p>
                  <p className="font-medium">{formatDate(user.createdAt || new Date())}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditForm({ name: displayName, email: user.email, phone: user.phone || '' });
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? t('common.loading') : t('profile.saveChanges')}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your password and account security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('auth.password')}</p>
                <p className="text-sm text-muted-foreground">Last changed: Never</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
              {t('profile.changePassword')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.changePassword')}</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder={t('profile.currentPassword')}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder={t('profile.newPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder={t('profile.confirmPassword')}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={isSaving}>
              {isSaving ? t('common.loading') : t('profile.changePassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.confirmLogout')}</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('nav.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

