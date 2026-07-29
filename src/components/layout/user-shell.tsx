'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';
import { AiChatAssistant } from '@/components/features/ai-chat-assistant';
import { RealTimeNotifications } from '@/components/features/real-time-notifications';
import { LoginModal } from '@/components/common/login-modal';
import { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Briefcase,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  UserCircle,
  ClipboardList,
  CreditCard,
  FileText,
  Headphones,
  Settings,
  HelpCircle,
  Shield,
  Scale,
  Cookie,
  // Admin menu icons
  LayoutDashboard,
  Users,
  BarChart3,
  ScrollText,
  Globe,
  FolderOpen,
  MessageSquare,
  Database,
  // Partner menu icons
  Link2,
  Percent,
  Banknote,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Language flag emoji mapping — only pt-pt, en-us, pt-br get flags
// ──────────────────────────────────────────────

const LANGUAGE_FLAGS: Record<string, string> = {
  'pt-pt': '🇲🇿', 'en-us': '🇺🇸', 'pt-br': '🇧🇷',
  'fr-fr': '🇫🇷', 'es-es': '🇪🇸', 'zh-cn': '🇨🇳', 'de-de': '🇩🇪',
};

// ──────────────────────────────────────────────
// User menu items
// ──────────────────────────────────────────────

interface SidebarLink {
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const USER_MENU_ITEMS: SidebarLink[] = [
  { path: '/user', labelKey: 'dashboard.profile', icon: UserCircle },
  { path: '/user/quotes', labelKey: 'dashboard.quotes', icon: ClipboardList },
  { path: '/user/payments', labelKey: 'dashboard.payments', icon: CreditCard },
  { path: '/user/invoices', labelKey: 'dashboard.invoices', icon: FileText },
  { path: '/user/support', labelKey: 'dashboard.support', icon: Headphones },
  { path: '/user/settings', labelKey: 'dashboard.settings', icon: Settings },
];

const ADMIN_MENU_ITEMS: SidebarLink[] = [
  { path: '/admin', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { path: '/admin/services', labelKey: 'admin.services', icon: Globe },
  { path: '/admin/projects', labelKey: 'admin.projects', icon: FolderOpen },
  { path: '/admin/blog', labelKey: 'admin.posts', icon: FileText },
  { path: '/admin/testimonials', labelKey: 'admin.testimonials', icon: MessageSquare },
  { path: '/admin/users', labelKey: 'admin.users', icon: Users },
  { path: '/admin/reports', labelKey: 'admin.reports', icon: BarChart3 },
  { path: '/admin/analytics', labelKey: 'admin.systemLogs', icon: ScrollText },
  { path: '/admin/settings', labelKey: 'admin.systemSettings', icon: Settings },
  { path: '/admin/db-manager', labelKey: 'admin.dbManager', icon: Database },
];

const PARTNER_MENU_ITEMS: SidebarLink[] = [
  { path: '/partner', labelKey: 'partner.portfolio', icon: FolderOpen },
  { path: '/partner/affiliate', labelKey: 'partner.affiliate', icon: Link2 },
  { path: '/partner/commissions', labelKey: 'partner.commissions', icon: Percent },
  { path: '/partner/withdrawals', labelKey: 'partner.withdrawals', icon: Banknote },
];

const LEGAL_LINKS: SidebarLink[] = [
  { path: '/about', labelKey: 'nav.about', icon: HelpCircle },
  { path: '/faq', labelKey: 'nav.faq', icon: HelpCircle },
  { path: '/privacy', labelKey: 'footer.privacy', icon: Shield },
  { path: '/terms', labelKey: 'footer.terms', icon: Scale },
  { path: '/cookies', labelKey: 'footer.cookies', icon: Cookie },
];

// ──────────────────────────────────────────────
// User Shell Component
// ──────────────────────────────────────────────

export function UserShell({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, isPartner } = useAuthStore();
  const { unreadCount, notifications, markAllAsRead } = useNotificationStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isPrivileged = isAdmin || isSuperAdmin;
  const canAccessAll = isPrivileged || isPartner;

  const currentFlag = LANGUAGE_FLAGS[language] || '🌐';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <SidebarProvider>
        {/* ── Sidebar ── */}
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <img src="/logo.png" alt="CarsaiMZ" className="h-6 w-auto shrink-0" />
              <div className="group-data-[collapsible=icon]:hidden flex flex-col">
                <span className="text-xs text-muted-foreground">{t('nav.dashboard')}</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            {/* ── Admin section (shown for admin/super_admin) ── */}
            {isPrivileged && (
              <SidebarGroup>
                <SidebarGroupLabel>{t('admin.title')}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {ADMIN_MENU_ITEMS.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={pathname === item.path}
                          onClick={() => router.push(item.path)}
                          tooltip={t(item.labelKey)}
                        >
                          <item.icon className="size-4" />
                          <span>{t(item.labelKey)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ── User section (always shown) ── */}
            <SidebarGroup>
              <SidebarGroupLabel>{t('dashboard.title')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {USER_MENU_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={pathname === item.path}
                        onClick={() => router.push(item.path)}
                        tooltip={t(item.labelKey)}
                      >
                        <item.icon className="size-4" />
                        <span>{t(item.labelKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* ── Partner section (shown for admin/super_admin/partner) ── */}
            {canAccessAll && (
              <SidebarGroup>
                <SidebarGroupLabel>{t('partner.title')}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {PARTNER_MENU_ITEMS.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={pathname === item.path}
                          onClick={() => router.push(item.path)}
                          tooltip={t(item.labelKey)}
                        >
                          <item.icon className="size-4" />
                          <span>{t(item.labelKey)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Legal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {LEGAL_LINKS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => router.push(item.path)}
                        tooltip={t(item.labelKey)}
                      >
                        <item.icon className="size-4" />
                        <span>{t(item.labelKey)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={user?.name || ''}>
                  <Avatar className="size-5">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name || ''} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="group-data-[collapsible=icon]:hidden flex flex-col">
                    <span className="text-sm font-medium truncate">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        {/* ── Main Content Area ── */}
        <SidebarInset>
          {/* ── Topbar ── */}
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Language flag */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-7">
                    <span className="text-base leading-none">{currentFlag}</span>
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
                      <span className="mr-2 text-lg">{LANGUAGE_FLAGS[lang.code] || '🌐'}</span>
                      <span>{lang.nativeName}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme toggle */}
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 relative">
                    <Bell className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>{t('notif.title')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>{t('notif.noNotifications')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-7">
                    <Avatar className="size-5">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
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
                  {canAccessAll && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Shield className="mr-2 size-4" />
                        {t('admin.title')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/partner')}>
                        <Briefcase className="mr-2 size-4" />
                        {t('partner.title')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => router.push('/home')}>
                    ← {t('common.backToSite')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} variant="destructive">
                    <LogOut className="mr-2 size-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ── Page Content ── */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>

          {/* ── Footer ── */}
          <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            © 2026 Carsai Mozambique ·{' '}
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link> ·{' '}
            <Link href="/terms" className="hover:text-foreground">Terms</Link> ·{' '}
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
          </footer>
        </SidebarInset>
      </SidebarProvider>

      <AiChatAssistant />
      <RealTimeNotifications />
      {loginModalOpen && <LoginModal open={loginModalOpen} onOpenChange={(v) => setLoginModalOpen(v)} />}
    </>
  );
}
