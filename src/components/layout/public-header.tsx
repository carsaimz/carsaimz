'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  LogIn,
  Shield,
  Briefcase,
  ChevronDown,
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

import { useAuthStore, useNotificationStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Navigation items mapped to URL paths
// ──────────────────────────────────────────────

interface NavItem {
  path: string;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/home', labelKey: 'nav.home' },
  { path: '/services', labelKey: 'nav.services' },
  { path: '/projects', labelKey: 'nav.projects' },
  { path: '/blog', labelKey: 'nav.blog' },
  { path: '/forum', labelKey: 'nav.forum' },
  { path: '/contact', labelKey: 'nav.contact' },
];

// ──────────────────────────────────────────────
// Language flag emoji mapping — all supported languages
// ──────────────────────────────────────────────

const LANGUAGE_FLAGS: Record<string, string> = {
  'pt-pt': '🇲🇿',
  'en-us': '🇺🇸',
  'pt-br': '🇧🇷',
  'fr-fr': '🇫🇷',
  'es-es': '🇪🇸',
  'zh-cn': '🇨🇳',
  'de-de': '🇩🇪',
};

// Helper: get flag for a language code, falling back to the lang object's own flag
function getFlag(code: string, langFlag?: string): string {
  return LANGUAGE_FLAGS[code] || langFlag || '🌐';
}

// ──────────────────────────────────────────────
// Header Component
// ──────────────────────────────────────────────

export function PublicHeader() {
  const { t, language, setLanguage, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isPartner, isSuperAdmin, logout } = useAuthStore();
  const { unreadCount, notifications, markAllAsRead } = useNotificationStore();

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const currentFlag = getFlag(language);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* ── Logo only (no text) ── */}
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="flex items-center gap-2 hover:bg-transparent"
          >
            <img src="/logo.png" alt="CarsaiMZ" className="h-8 w-auto" />
          </Link>
        </div>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.path}
              variant={pathname === item.path ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => router.push(item.path)}
              className="text-sm"
            >
              {t(item.labelKey)}
            </Button>
          ))}
        </nav>

        {/* ── Right side actions ── */}
        <div className="flex items-center gap-2">
          {/* Language Switcher with FLAG */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="text-xl leading-none">{currentFlag}</span>
                <span className="hidden sm:inline text-xs">
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
                  <span className="mr-2 text-lg">{getFlag(lang.code, lang.flag)}</span>
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
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Shield className="mr-2 size-4" />
                    {t('nav.admin')}
                  </DropdownMenuItem>
                )}
                {isPartner && !isAdmin && !isSuperAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/partner')}>
                    <Briefcase className="mr-2 size-4" />
                    {t('nav.partner')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/user')}>
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
              <Link href="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                >
                  <LogIn className="size-4 mr-1" />
                  <span className="hidden sm:inline">{t('auth.login')}</span>
                </Button>
              </Link>
              <Link href="/auth" className="hidden sm:inline-flex">
                <Button
                  variant="default"
                  size="sm"
                >
                  {t('auth.register')}
                </Button>
              </Link>
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
                  <img src="/logo.png" alt="CarsaiMZ" className="h-8 w-auto" />
                </SheetTitle>
              </SheetHeader>

              <Separator className="my-2" />

              <nav className="flex flex-col gap-2 px-4">
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.path}
                    variant={pathname === item.path ? 'secondary' : 'ghost'}
                    onClick={() => { router.push(item.path); setMobileSheetOpen(false); }}
                    className="justify-start text-sm"
                  >
                    {t(item.labelKey)}
                  </Button>
                ))}
                {/* Additional links */}
                <Button
                  variant="ghost"
                  onClick={() => { router.push('/about'); setMobileSheetOpen(false); }}
                  className="justify-start text-sm"
                >
                  {t('nav.about') || 'About'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { router.push('/faq'); setMobileSheetOpen(false); }}
                  className="justify-start text-sm"
                >
                  {t('nav.faq') || 'FAQ'}
                </Button>
              </nav>

              {isAuthenticated && (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-2 px-4">
                    <Button
                      variant="ghost"
                      onClick={() => { router.push('/user'); setMobileSheetOpen(false); }}
                      className="justify-start text-sm"
                    >
                      <User className="mr-2 size-4" />
                      {t('nav.dashboard')}
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        onClick={() => { router.push('/admin'); setMobileSheetOpen(false); }}
                        className="justify-start text-sm"
                      >
                        <Shield className="mr-2 size-4" />
                        {t('nav.admin')}
                      </Button>
                    )}
                    {isSuperAdmin && !isAdmin && (
                      <Button
                        variant="ghost"
                        onClick={() => { router.push('/admin'); setMobileSheetOpen(false); }}
                        className="justify-start text-sm"
                      >
                        <Shield className="mr-2 size-4" />
                        {t('nav.admin')}
                      </Button>
                    )}
                    {isPartner && !isAdmin && !isSuperAdmin && (
                      <Button
                        variant="ghost"
                        onClick={() => { router.push('/partner'); setMobileSheetOpen(false); }}
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
                  <Link href="/auth" onClick={() => setMobileSheetOpen(false)}>
                    <Button className="w-full">
                      <LogIn className="mr-2 size-4" />
                      {t('auth.login')}
                    </Button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileSheetOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('auth.register')}
                    </Button>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
