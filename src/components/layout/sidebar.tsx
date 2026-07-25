'use client';

import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Shield,
  Briefcase,
  MessageSquare,
  BarChart3,
  History,
  Wallet,
  CreditCard,
  Headphones,
  UserCircle,
  FolderOpen,
  Link2,
  Percent,
  Banknote,
  ClipboardList,
  Car,
  Map,
  ScrollText,
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useAppStore, useAuthStore, type AppView, type UserRole } from '@/lib/store';
import { useLanguage } from '@/contexts/language-context';

// ──────────────────────────────────────────────
// Sidebar menu items per role
// ──────────────────────────────────────────────

interface SidebarMenuItemConfig {
  view: AppView;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const USER_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { view: 'dashboard', labelKey: 'dashboard.profile', icon: UserCircle },
  { view: 'dashboard', labelKey: 'dashboard.quotes', icon: ClipboardList },
  { view: 'dashboard', labelKey: 'dashboard.payments', icon: CreditCard },
  { view: 'dashboard', labelKey: 'dashboard.invoices', icon: FileText },
  { view: 'dashboard', labelKey: 'dashboard.support', icon: Headphones },
  { view: 'settings', labelKey: 'dashboard.settings', icon: Settings },
];

const ADMIN_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { view: 'dashboard', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { view: 'vehicles', labelKey: 'admin.users', icon: Users },
  { view: 'services', labelKey: 'nav.services', icon: Briefcase },
  { view: 'projects', labelKey: 'nav.projects', icon: FolderOpen },
  { view: 'blog', labelKey: 'nav.blog', icon: FileText },
  { view: 'forum', labelKey: 'nav.forum', icon: MessageSquare },
  { view: 'reports', labelKey: 'admin.reports', icon: BarChart3 },
  { view: 'settings', labelKey: 'admin.systemSettings', icon: Settings },
  { view: 'analytics', labelKey: 'admin.systemLogs', icon: ScrollText },
];

const PARTNER_MENU_ITEMS: SidebarMenuItemConfig[] = [
  { view: 'dashboard', labelKey: 'partner.portfolio', icon: FolderOpen },
  { view: 'dashboard', labelKey: 'partner.affiliate', icon: Link2 },
  { view: 'dashboard', labelKey: 'partner.commissions', icon: Percent },
  { view: 'dashboard', labelKey: 'partner.withdrawals', icon: Banknote },
];

// ──────────────────────────────────────────────
// Get menu items for a role
// ──────────────────────────────────────────────

function getMenuItems(role: UserRole): SidebarMenuItemConfig[] {
  switch (role) {
    case 'admin':
      return ADMIN_MENU_ITEMS;
    case 'partner':
      return PARTNER_MENU_ITEMS;
    case 'user':
      return USER_MENU_ITEMS;
    default:
      return USER_MENU_ITEMS;
  }
}

// ──────────────────────────────────────────────
// Dashboard Sidebar Component
// ──────────────────────────────────────────────

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const { user, isAuthenticated, isAdmin, isPartner } = useAuthStore();

  // Only render sidebar when user is logged in and in dashboard views
  const isDashboardView = ['dashboard', 'admin', 'partner', 'vehicles', 'partners', 'reports', 'settings', 'map', 'analytics'].includes(currentView);

  if (!isAuthenticated || !isDashboardView) {
    // No sidebar for public views — just render children directly
    return <>{children}</>;
  }

  const role: UserRole = isAdmin ? 'admin' : isPartner ? 'partner' : 'user';
  const menuItems = getMenuItems(role);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <Car className="size-5 text-primary shrink-0" />
            <div className="group-data-[collapsible=icon]:hidden flex flex-col">
              <span className="font-bold text-sm">Carsai</span>
              <span className="text-xs text-muted-foreground">
                {role === 'admin' ? t('nav.admin') : role === 'partner' ? t('nav.partner') : t('nav.dashboard')}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <Separator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              {role === 'admin' ? t('admin.title') : role === 'partner' ? t('partner.title') : t('dashboard.title')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.labelKey}>
                    <SidebarMenuButton
                      isActive={currentView === item.view}
                      onClick={() => setCurrentView(item.view)}
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

      <SidebarInset>
        <header className="flex items-center gap-2 px-4 py-2 border-b md:hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-2 h-4" />
          <span className="font-semibold text-sm">Carsai</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
