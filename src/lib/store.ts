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

export type Language = 'en' | 'pt' | 'fr';

// ──────────────────────────────────────────────
// Demo Users (for testing)
// ──────────────────────────────────────────────

export const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 'demo-admin-001',
    name: 'Carlos Silva',
    email: 'admin@carsai.mz',
    role: 'admin',
    avatar: null,
    phone: '+258 84 123 4567',
    company: 'Carsai Moçambique',
    bio: 'Director Executivo da Carsai Moçambique',
    address: 'Maputo, Moçambique',
  },
  partner: {
    id: 'demo-partner-001',
    name: 'Ana Ferreira',
    email: 'partner@carsai.mz',
    role: 'partner',
    avatar: null,
    phone: '+258 85 234 5678',
    company: 'Digital Solutions MZ',
    bio: 'Parceira estratégica com foco em marketing digital',
    address: 'Beira, Moçambique',
  },
  user: {
    id: 'demo-user-001',
    name: 'João Machado',
    email: 'user@carsai.mz',
    role: 'user',
    avatar: null,
    phone: '+258 86 345 6789',
    company: 'Tech Startup MZ',
    bio: 'Empreendedor tech em Maputo',
    address: 'Maputo, Moçambique',
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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string) => boolean;
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

  login: async (email: string, password: string): Promise<boolean> => {
    // Validate demo credentials first
    const roleMap: Record<string, UserRole> = {
      'admin@carsai.mz': 'admin',
      'partner@carsai.mz': 'partner',
      'user@carsai.mz': 'user',
    };

    const role = roleMap[email];
    if (!role || password !== 'demo123') {
      return false;
    }

    // Fetch real user data from database API
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.user) {
        const dbUser = data.user;
        const userRole = (dbUser.role as UserRole) || role;
        set({
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: userRole,
            avatar: dbUser.avatar || null,
            phone: dbUser.phone || null,
            company: dbUser.company || null,
            bio: dbUser.bio || null,
            address: dbUser.address || null,
          },
          isAuthenticated: true,
          isAdmin: userRole === 'admin',
          isPartner: userRole === 'partner',
          isUser: userRole === 'user',
          isLoading: false,
        });
        return true;
      }
    } catch (err) {
      console.error('Login API error:', err);
    }

    // Fallback to demo users if API fails
    const demoUser = DEMO_USERS[role];
    set({
      user: demoUser,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isPartner: role === 'partner',
      isUser: role === 'user',
      isLoading: false,
    });
    return true;
  },

  loginAsDemo: async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      admin: 'admin@carsai.mz',
      partner: 'partner@carsai.mz',
      user: 'user@carsai.mz',
    };
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(emailMap[role])}`);
      const data = await res.json();
      if (data.success && data.user) {
        const dbUser = data.user;
        const userRole = (dbUser.role as UserRole) || role;
        set({
          user: {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: userRole,
            avatar: dbUser.avatar || null,
            phone: dbUser.phone || null,
            company: dbUser.company || null,
            bio: dbUser.bio || null,
            address: dbUser.address || null,
          },
          isAuthenticated: true,
          isAdmin: userRole === 'admin',
          isPartner: userRole === 'partner',
          isUser: userRole === 'user',
          isLoading: false,
        });
        return;
      }
    } catch (err) {
      console.error('Demo login API error:', err);
    }

    // Fallback to demo users
    const demoUser = DEMO_USERS[role];
    set({
      user: demoUser,
      isAuthenticated: true,
      isAdmin: role === 'admin',
      isPartner: role === 'partner',
      isUser: role === 'user',
      isLoading: false,
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

  register: (name: string, email: string, password: string): boolean => {
    // Simple simulated registration - creates a user role
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: 'user',
      avatar: null,
      phone: null,
      company: null,
      bio: null,
      address: null,
    };
    set({
      user: newUser,
      isAuthenticated: true,
      isAdmin: false,
      isPartner: false,
      isUser: true,
    });
    return true;
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
