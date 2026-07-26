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
  phone?: string | null;
  company?: string | null;
  bio?: string | null;
  address?: string | null;
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

export type AppView = 'home' | 'services' | 'projects' | 'about' | 'faq' | 'blog' | 'forum' | 'blogPost' | 'forumTopic' | 'contact' | 'dashboard' | 'vehicles' | 'partners' | 'reports' | 'settings' | 'map' | 'analytics' | 'admin' | 'partner' | 'chat';

export type Language = 'en' | 'pt' | 'fr' | 'es' | 'zh' | 'de';

// ──────────────────────────────────────────────
// Auth Store
// ──────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isUser: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
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
  isLoading: false,

  login: async (login: string, password: string): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        const userRole = (data.user.role as UserRole) || 'user';
        set({
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: userRole,
            avatar: data.user.avatar || null,
            phone: data.user.phone || null,
            company: data.user.company || null,
            bio: data.user.bio || null,
            address: data.user.address || null,
          },
          isAuthenticated: true,
          isAdmin: userRole === 'admin',
          isPartner: userRole === 'partner',
          isUser: userRole === 'user',
          isLoading: false,
        });
        return true;
      } else {
        set({ isLoading: false });
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      set({ isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        const userRole = (data.user.role as UserRole) || 'user';
        set({
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: userRole,
            avatar: null,
            phone: data.user.phone || null,
            company: null,
            bio: null,
            address: null,
          },
          isAuthenticated: true,
          isAdmin: false,
          isPartner: false,
          isUser: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ isLoading: false });
        return false;
      }
    } catch (err) {
      console.error('Register error:', err);
      set({ isLoading: false });
      return false;
    }
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
  searchOpen: boolean;
  language: Language;
  selectedPostSlug: string | null;
  selectedTopicSlug: string | null;
  setCurrentView: (view: AppView) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  setLanguage: (language: Language) => void;
  setSelectedPostSlug: (slug: string | null) => void;
  setSelectedTopicSlug: (slug: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  sidebarOpen: true,
  searchQuery: '',
  searchOpen: false,
  language: 'pt', // Portuguese as default for Mozambique
  selectedPostSlug: null,
  selectedTopicSlug: null,

  setCurrentView: (view: AppView) => set({ currentView: view }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSearchOpen: (open: boolean) => set({ searchOpen: open }),
  setLanguage: (language: Language) => set({ language }),
  setSelectedPostSlug: (slug: string | null) => set({ selectedPostSlug: slug }),
  setSelectedTopicSlug: (slug: string | null) => set({ selectedTopicSlug: slug }),
}));
