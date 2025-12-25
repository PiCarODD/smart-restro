import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Search, User, Settings, LogOut, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';

type Language = 'en' | 'my';
const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
];

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { restaurant } = useRestaurantStore();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(i18n.language as Language || 'en');

  // Sync currentLanguage with i18n language
  useEffect(() => {
    setCurrentLanguage(i18n.language as Language || 'en');
    // Update HTML lang attribute
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = async (lang: Language) => {
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Left: Title or Search */}
      <div className="flex items-center gap-4">
        {title ? (
          <h1 className="text-xl font-semibold">{title}</h1>
        ) : (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Right: Restaurant Name, Language, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Restaurant Name */}
        {restaurant && (
          <span className="text-sm text-muted-foreground hidden md:block mr-2">
            {restaurant.name}
          </span>
        )}

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className="flex items-center justify-between"
              >
                <span>{lang.nativeName}</span>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={user?.avatar} alt={user?.firstName} />
                <AvatarFallback>
                  {user ? getInitials(user.firstName, user.lastName) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

