'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Globe,
  User,
  LogOut,
  LogIn,
  Shield,
  Briefcase,
  ChevronDown,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useAppStore, useAuthStore, useNotificationStore, type AppView } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { LoginModal } from '@/components/common/login-modal';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/logo';

// ──────────────────────────────────────────────
// Navigation items mapped to AppView
// ──────────────────────────────────────────────

interface NavItem {
  view: AppView;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'home', labelKey: 'nav.home' },
  { view: 'services', labelKey: 'nav.services' },
  { view: 'projects', labelKey: 'nav.projects' },
  { view: 'blog', labelKey: 'nav.blog' },
  { view: 'forum', labelKey: 'nav.forum' },
  { view: 'contact', labelKey: 'nav.contact' },
];

// ──────────────────────────────────────────────
// Header Component
// ──────────────────────────────────────────────

export function Header() {
  const { t, language, setLanguage, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currentView, setCurrentView, searchOpen, setSearchOpen } = useAppStore();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isPartner, logout } = useAuthStore();
  const { unreadCount, notifications, markAllAsRead } = useNotificationStore();
  const router = useRouter();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    setMobileSheetOpen(false);
  };

  const handleNavigateToDashboard = (path: string) => {
    router.push(path);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* ── Logo / Brand ── */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 font-bold text-lg hover:bg-transparent"
              onClick={() => handleNavClick('home')}
            >
              <Logo size="md" />
            </Button>
          </div>

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleNavClick(item.view)}
                className="text-sm"
              >
                {t(item.labelKey)}
              </Button>
            ))}
          </nav>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="size-4" />
                  <span className="hidden sm:inline text-xs">
                    {languages.find((l) => l.code === language)?.flag}{' '}
                    {languages.find((l) => l.code === language)?.nativeName?.split(' ')[0] || language}
                  </span>
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('nav.language')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? t('accessibility.lightMode') : t('accessibility.darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>{t('notif.title')}</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-auto p-1"
                        onClick={markAllAsRead}
                      >
                        {t('notif.markAllRead')}
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <DropdownMenuItem disabled>
                      {t('notif.noNotifications')}
                    </DropdownMenuItem>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 5).map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className={!notif.read ? 'bg-accent/50' : ''}
                        >
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="text-sm font-medium truncate">
                              {notif.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {notif.message}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">{user?.name}</span>
                    <ChevronDown className="size-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Dashboard navigation based on role */}
                  {(isAdmin || isSuperAdmin) && (
                    <DropdownMenuItem onClick={() => handleNavigateToDashboard('/admin')}>
                      <Shield className="mr-2 size-4" />
                      {t('nav.admin')}
                    </DropdownMenuItem>
                  )}
                  {isPartner && !isAdmin && !isSuperAdmin && (
                    <DropdownMenuItem onClick={() => handleNavigateToDashboard('/partner')}>
                      <Briefcase className="mr-2 size-4" />
                      {t('nav.partner')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleNavigateToDashboard('/user')}>
                    <User className="mr-2 size-4" />
                    {t('nav.dashboard')}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} variant="destructive">
                    <LogOut className="mr-2 size-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                >
                  <LogIn className="size-4 mr-1" />
                  <span className="hidden sm:inline">{t('auth.login')}</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                  className="hidden sm:inline-flex"
                >
                  {t('auth.register')}
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">{t('nav.menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Logo size="md" />
                  </SheetTitle>
                </SheetHeader>

                <Separator className="my-2" />

                <nav className="flex flex-col gap-2 px-4">
                  {NAV_ITEMS.map((item) => (
                    <Button
                      key={item.view}
                      variant={currentView === item.view ? 'secondary' : 'ghost'}
                      onClick={() => handleNavClick(item.view)}
                      className="justify-start text-sm"
                    >
                      {t(item.labelKey)}
                    </Button>
                  ))}
                </nav>

                {isAuthenticated && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex flex-col gap-2 px-4">
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigateToDashboard('/user')}
                        className="justify-start text-sm"
                      >
                        <User className="mr-2 size-4" />
                        {t('nav.dashboard')}
                      </Button>
                      {(isAdmin || isSuperAdmin) && (
                        <Button
                          variant="ghost"
                          onClick={() => handleNavigateToDashboard('/admin')}
                          className="justify-start text-sm"
                        >
                          <Shield className="mr-2 size-4" />
                          {t('nav.admin')}
                        </Button>
                      )}
                      {isPartner && !isAdmin && !isSuperAdmin && (
                        <Button
                          variant="ghost"
                          onClick={() => handleNavigateToDashboard('/partner')}
                          className="justify-start text-sm"
                        >
                          <Briefcase className="mr-2 size-4" />
                          {t('nav.partner')}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {isAuthenticated && (
                  <div className="mt-4 px-4">
                    <div className="flex items-center gap-2 py-2">
                      <Avatar className="size-8">
                        <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={logout}
                      className="w-full mt-2"
                    >
                      <LogOut className="mr-2 size-4" />
                      {t('auth.logout')}
                    </Button>
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="mt-4 px-4 flex flex-col gap-2">
                    <Button onClick={() => { setMobileSheetOpen(false); setLoginModalOpen(true); }}>
                      <LogIn className="mr-2 size-4" />
                      {t('auth.login')}
                    </Button>
                    <Button variant="outline" onClick={() => { setMobileSheetOpen(false); setLoginModalOpen(true); }}>
                      {t('auth.register')}
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />


    </>
  );
}
