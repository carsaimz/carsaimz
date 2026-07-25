import { create } from 'zustand';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type UserRole = 'admin' | 'partner' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export type AppView = 'home' | 'services' | 'projects' | 'about' | 'faq' | 'blog' | 'forum' | 'blogPost' | 'forumTopic' | 'contact' | 'dashboard' | 'vehicles' | 'partners' | 'reports' | 'settings' | 'map' | 'analytics' | 'admin' | 'partner';

export type Language = 'en' | 'pt' | 'fr';

// ──────────────────────────────────────────────
// Demo Users (for testing)
// ──────────────────────────────────────────────

export const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 'demo-admin-001',
    name: 'Carlos Mutemba',
    email: 'admin@carsai.mz',
    role: 'admin',
    avatar: null,
  },
  partner: {
    id: 'demo-partner-001',
    name: 'Ana Rodrigues',
    email: 'partner@carsai.mz',
    role: 'partner',
    avatar: null,
  },
  user: {
    id: 'demo-user-001',
    name: 'João Silva',
    email: 'user@carsai.mz',
    role: 'user',
    avatar: null,
  },
};

// ──────────────────────────────────────────────
// Auth Store
// ──────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isUser: boolean;
  login: (email: string, password: string) => boolean;
  loginAsDemo: (role: UserRole) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateAvatar: (avatar: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isPartner: false,
  isUser: false,

  login: (email: string, password: string): boolean => {
    // Simulated login — match demo credentials
    // In production this would call an API
    const roleMap: Record<string, UserRole> = {
      'admin@carsai.mz': 'admin',
      'partner@carsai.mz': 'partner',
      'user@carsai.mz': 'user',
    };

    const role = roleMap[email];
    if (role && password === 'demo123') {
      const demoUser = DEMO_USERS[role];
      set({
        user: demoUser,
        isAuthenticated: true,
        isAdmin: role === 'admin',
        isPartner: role === 'partner',
        isUser: role === 'user',
      });
      return true;
    }
    return false;
  },

  loginAsDemo: (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    set({
      user: demoUser,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isPartner: role === 'partner',
      isUser: role === 'user',
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isPartner: false,
      isUser: false,
    });
  },

  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'admin',
      isPartner: user.role === 'partner',
      isUser: user.role === 'user',
    });
  },

  updateAvatar: (avatar: string) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, avatar } });
    }
  },
}));

// ──────────────────────────────────────────────
// Notification Store
// ──────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, title: string, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (type: NotificationType, title: string, message: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: Notification = {
      id,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
    };
    const updated = [newNotification, ...get().notifications];
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAsRead: (id: string) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({
      notifications: updated,
      unreadCount: 0,
    });
  },

  removeNotification: (id: string) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

// ──────────────────────────────────────────────
// App Store
// ──────────────────────────────────────────────

interface AppState {
  currentView: AppView;
  sidebarOpen: boolean;
  searchQuery: string;
  language: Language;
  selectedPostSlug: string | null;
  selectedTopicSlug: string | null;
  setCurrentView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (language: Language) => void;
  setSelectedPostSlug: (slug: string | null) => void;
  setSelectedTopicSlug: (slug: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  sidebarOpen: true,
  searchQuery: '',
  language: 'pt', // Portuguese as default for Mozambique
  selectedPostSlug: null,
  selectedTopicSlug: null,

  setCurrentView: (view: AppView) => set({ currentView: view }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setLanguage: (language: Language) => set({ language }),
  setSelectedPostSlug: (slug: string | null) => set({ selectedPostSlug: slug }),
  setSelectedTopicSlug: (slug: string | null) => set({ selectedTopicSlug: slug }),
}));
