import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildApiUrl } from '@/lib/api-base';
import { supabaseClient } from '@/lib/supabase';
import { isSupabaseAnonKeyValid } from '@/lib/client-config';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type UserRole = 'admin' | 'partner' | 'user' | 'super_admin';

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
// Auth Store (with persist middleware)
// ──────────────────────────────────────────────

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isUser: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  lastLoginError: string | null;
  lastRegisterError: string | null;
  login: (login: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthResult>;
  logout: () => void;
  setUser: (user: User) => void;
  updateAvatar: (avatar: string) => void;
}

/**
 * Helper: set the user in the store after a successful auth.
 */
function setUserInStore(
  set: (partial: Partial<AuthState>) => void,
  user: User,
) {
  const userRole = user.role;
  set({
    user,
    isAuthenticated: true,
    isAdmin: userRole === 'admin' || userRole === 'super_admin',
    isPartner: userRole === 'partner',
    isUser: userRole === 'user',
    isSuperAdmin: userRole === 'super_admin',
    isLoading: false,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isPartner: false,
      isUser: false,
      isSuperAdmin: false,
      isLoading: false,
      hasHydrated: false,
      lastLoginError: null,
      lastRegisterError: null,

      login: async (login: string, password: string): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null });

        // ── PRIMARY: Supabase client-side auth ──
        if (isSupabaseAnonKeyValid) {
          try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
              email: login,
              password,
            });

            if (error) {
              // Supabase returned an auth error (wrong password, user not found, etc.)
              const errorMsg = error.message === 'Invalid login credentials'
                ? 'Credenciais inválidas'
                : error.message;
              set({ isLoading: false, lastLoginError: errorMsg });
              return { success: false, error: errorMsg };
            }

            if (data.user) {
              const meta = data.user.user_metadata || {};
              const user: User = {
                id: data.user.id,
                name: meta.name || data.user.email?.split('@')[0] || 'Utilizador',
                email: data.user.email || '',
                role: (meta.role as UserRole) || 'user',
                avatar: meta.avatar || null,
                phone: meta.phone || null,
                company: meta.company || null,
                bio: meta.bio || null,
                address: meta.address || null,
              };
              setUserInStore(set, user);
              return { success: true };
            }
          } catch (supabaseErr) {
            console.warn('[Auth] Supabase client auth failed, falling back to API route:', supabaseErr);
            // Fall through to API route fallback
          }
        } else {
          console.info('[Auth] SUPABASE_ANON_KEY not set or invalid — skipping Supabase client auth, using API route fallback.');
        }

        // ── FALLBACK: API route (Prisma) ──
        try {
          const res = await fetch(buildApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
          });

          const data = await res.json();

          if (data.success && data.user) {
            const userRole = (data.user.role as UserRole) || 'user';
            const user: User = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: userRole,
              avatar: data.user.avatar || null,
              phone: data.user.phone || null,
              company: data.user.company || null,
              bio: data.user.bio || null,
              address: data.user.address || null,
            };
            setUserInStore(set, user);
            return { success: true };
          } else {
            const errorMsg = data.error || 'Credenciais inválidas';
            set({ isLoading: false, lastLoginError: errorMsg });
            return { success: false, error: errorMsg };
          }
        } catch (err) {
          console.error('Login error (API route fallback):', err);
          const errorMsg = 'Erro de ligação. Verifique a sua rede e tente novamente.';
          set({ isLoading: false, lastLoginError: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      register: async (name: string, email: string, password: string, phone?: string): Promise<AuthResult> => {
        set({ isLoading: true, lastRegisterError: null });

        // ── PRIMARY: Supabase client-side auth ──
        if (isSupabaseAnonKeyValid) {
          try {
            const { data, error } = await supabaseClient.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name,
                  phone: phone || undefined,
                },
              },
            });

            if (error) {
              // Supabase returned an error (email taken, weak password, etc.)
              let errorMsg = error.message;
              // Translate common Supabase errors to Portuguese
              if (errorMsg.includes('already registered') || errorMsg.includes('already been registered')) {
                errorMsg = 'Já existe uma conta com este e-mail';
              } else if (errorMsg.includes('Password should be')) {
                errorMsg = 'Palavra-passe deve ter pelo menos 8 caracteres';
              }
              set({ isLoading: false, lastRegisterError: errorMsg });
              return { success: false, error: errorMsg };
            }

            if (data.user) {
              const meta = data.user.user_metadata || {};
              const user: User = {
                id: data.user.id,
                name: meta.name || name,
                email: data.user.email || email,
                role: 'user',
                avatar: null,
                phone: meta.phone || phone || null,
                company: null,
                bio: null,
                address: null,
              };
              setUserInStore(set, user);
              set({ lastRegisterError: null });
              return { success: true };
            }
          } catch (supabaseErr) {
            console.warn('[Auth] Supabase client auth failed, falling back to API route:', supabaseErr);
            // Fall through to API route fallback
          }
        } else {
          console.info('[Auth] SUPABASE_ANON_KEY not set or invalid — skipping Supabase client auth, using API route fallback.');
        }

        // ── FALLBACK: API route (Prisma) ──
        try {
          const res = await fetch(buildApiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone: phone || undefined }),
          });

          const data = await res.json();

          if (data.success && data.user) {
            const userRole = (data.user.role as UserRole) || 'user';
            const user: User = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: userRole,
              avatar: null,
              phone: data.user.phone || null,
              company: null,
              bio: null,
              address: null,
            };
            setUserInStore(set, user);
            set({ lastRegisterError: null });
            return { success: true };
          } else {
            const errorMsg = data.error || 'Falha ao criar conta. Por favor, tente novamente.';
            set({ isLoading: false, lastRegisterError: errorMsg });
            return { success: false, error: errorMsg };
          }
        } catch (err) {
          console.error('Register error (API route fallback):', err);
          const errorMsg = 'Erro de ligação. Verifique a sua rede e tente novamente.';
          set({ isLoading: false, lastRegisterError: errorMsg });
          return { success: false, error: errorMsg };
        }
      },

      logout: async () => {
        // Sign out from Supabase if the key is configured
        if (isSupabaseAnonKeyValid) {
          try {
            await supabaseClient.auth.signOut();
          } catch (err) {
            console.warn('[Auth] Supabase signOut failed (non-critical):', err);
          }
        }
        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isPartner: false,
          isUser: false,
          isSuperAdmin: false,
          lastLoginError: null,
          lastRegisterError: null,
        });
      },

      setUser: (user: User) => {
        setUserInStore(set, user);
      },

      updateAvatar: (avatar: string) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, avatar } });
        }
      },
    }),
    {
      name: 'carsai-auth', // localStorage key
      partialize: (state) => ({
        // Only persist state fields, not functions or hasHydrated
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        isPartner: state.isPartner,
        isUser: state.isUser,
        isSuperAdmin: state.isSuperAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration as complete after rehydration
        if (state) {
          state.hasHydrated = true;
        }
      },
    }
  )
);

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
