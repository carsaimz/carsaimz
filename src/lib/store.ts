import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildApiUrl } from '@/lib/api-base'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type UserRole = 'admin' | 'partner' | 'user' | 'super_admin'
export type AuthProvider = 'email' | 'google.com' | 'facebook.com' | 'twitter.com' | 'github.com' | 'microsoft.com' | 'apple.com' | 'phone' | 'anonymous' | 'unknown'

export interface User {
  id: string
  name: string
  email: string | null
  role: UserRole
  avatar: string | null
  phone?: string | null
  company?: string | null
  bio?: string | null
  address?: string | null
  authProvider?: AuthProvider
  isAnonymous?: boolean
  emailVerified?: boolean
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export type AppView = 'home' | 'services' | 'projects' | 'about' | 'faq' | 'blog' | 'forum' | 'blogPost' | 'forumTopic' | 'contact' | 'dashboard' | 'vehicles' | 'partners' | 'reports' | 'settings' | 'map' | 'analytics' | 'admin' | 'partner' | 'chat'

export type Language = 'en' | 'pt' | 'fr' | 'es' | 'zh' | 'de'

// ──────────────────────────────────────────────
// Auth Store (Firebase Auth — client-side authentication)
//
// Flow:
// 1. Client authenticates with Firebase Auth directly (email/password, Google, etc.)
// 2. Firebase Auth returns a UserCredential with an ID token
// 3. Client sends ID token to /api/auth/login or /api/auth/social
// 4. Server verifies token, returns Firestore profile (role, isActive, etc.)
// 5. Store saves the combined profile
// ──────────────────────────────────────────────

interface AuthResult {
  success: boolean
  error?: string
  user?: User
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isPartner: boolean
  isUser: boolean
  isSuperAdmin: boolean
  isLoading: boolean
  hasHydrated: boolean
  lastLoginError: string | null
  lastRegisterError: string | null
  idToken: string | null
  loginWithToken: (idToken: string) => Promise<AuthResult>
  loginWithEmailPassword: (email: string, password: string) => Promise<AuthResult>
  loginWithGoogle: () => Promise<AuthResult>
  loginWithFacebook: () => Promise<AuthResult>
  loginWithGitHub: () => Promise<AuthResult>
  loginWithMicrosoft: () => Promise<AuthResult>
  loginWithApple: () => Promise<AuthResult>
  loginAnonymously: () => Promise<AuthResult>
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthResult>
  logout: () => void
  setUser: (user: User) => void
  updateAvatar: (avatar: string) => void
  setIdToken: (token: string) => void
}

function setUserInStore(set: (partial: Partial<AuthState>) => void, user: User) {
  const userRole = user.role
  set({
    user,
    isAuthenticated: true,
    isAdmin: userRole === 'admin' || userRole === 'super_admin',
    isPartner: userRole === 'partner',
    isUser: userRole === 'user',
    isSuperAdmin: userRole === 'super_admin',
    isLoading: false,
  })
}

function mapRole(roleData: any): UserRole {
  if (typeof roleData === 'string') return roleData as UserRole
  if (roleData && typeof roleData === 'object' && roleData.name) return roleData.name as UserRole
  return 'user'
}

/**
 * Send ID token to server and get Firestore profile.
 */
async function verifyWithServer(idToken: string, endpoint: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })

    const data = await res.json()

    if (data.user) {
      const userRole = mapRole(data.user.role)
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
        authProvider: data.user.authProvider as AuthProvider || 'unknown',
        isAnonymous: data.user.isAnonymous || false,
        emailVerified: data.user.emailVerified || false,
      }
      return { success: true, user }
    } else {
      return { success: false, error: data.error || 'Autenticação falhou.' }
    }
  } catch (err) {
    console.error('Server auth error:', err)
    return { success: false, error: 'Erro de ligação. Verifique a sua rede e tente novamente.' }
  }
}

// ─── Lazy Firebase Auth imports (only when needed) ───

async function getFirebaseAuth() {
  const { auth, isFirebaseConfigured } = await import('@/lib/firebase-client')

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado. Adicione as credenciais em .env')
  }

  return await import('@/lib/firebase-client')
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
      idToken: null,

      // ── Login with pre-obtained ID token ──
      loginWithToken: async (idToken: string): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })
        const result = await verifyWithServer(idToken, '/api/auth/login')

        if (result.success && result.user) {
          setUserInStore(set, result.user)
          set({ idToken })
          return { success: true, user: result.user }
        } else {
          set({ isLoading: false, lastLoginError: result.error })
          return { success: false, error: result.error }
        }
      },

      // ── Email/password login via Firebase Auth client ──
      loginWithEmailPassword: async (email: string, password: string): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithEmailAndPassword, auth } = await getFirebaseAuth()
          const credential = await signInWithEmailAndPassword(auth, email, password)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/login')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Email login error:', err)
          let errorMsg = 'Credenciais inválidas.'

          if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            errorMsg = 'Email ou senha incorretos.'
          } else if (err.code === 'auth/too-many-requests') {
            errorMsg = 'Muitas tentativas. Tente novamente mais tarde.'
          } else if (err.code === 'auth/user-disabled') {
            errorMsg = 'Conta desactivada. Contacte o suporte.'
          } else if (err.message?.includes('not configured')) {
            errorMsg = 'Firebase não configurado. Contacte o administrador.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Google Sign-In ──
      loginWithGoogle: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithPopup, auth, googleProvider } = await getFirebaseAuth()
          const credential = await signInWithPopup(auth, googleProvider)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Google login error:', err)
          let errorMsg = 'Falha no login com Google.'

          if (err.code === 'auth/popup-closed-by-user') {
            errorMsg = 'Popup fechado. Tente novamente.'
          } else if (err.code === 'auth/popup-blocked') {
            errorMsg = 'Popup bloqueado pelo navegador. Permita popups e tente novamente.'
          } else if (err.code === 'auth/cancelled-popup-request') {
            errorMsg = 'Operação cancelada.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Facebook Sign-In ──
      loginWithFacebook: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithPopup, auth, facebookProvider } = await getFirebaseAuth()
          const credential = await signInWithPopup(auth, facebookProvider)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Facebook login error:', err)
          let errorMsg = 'Falha no login com Facebook.'
          if (err.code === 'auth/popup-closed-by-user') errorMsg = 'Popup fechado.'
          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── GitHub Sign-In ──
      loginWithGitHub: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithPopup, auth, githubProvider } = await getFirebaseAuth()
          const credential = await signInWithPopup(auth, githubProvider)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('GitHub login error:', err)
          let errorMsg = 'Falha no login com GitHub.'
          if (err.code === 'auth/popup-closed-by-user') errorMsg = 'Popup fechado.'
          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Microsoft Sign-In ──
      loginWithMicrosoft: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithPopup, auth, microsoftProvider } = await getFirebaseAuth()
          const credential = await signInWithPopup(auth, microsoftProvider)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Microsoft login error:', err)
          let errorMsg = 'Falha no login com Microsoft.'
          if (err.code === 'auth/popup-closed-by-user') errorMsg = 'Popup fechado.'
          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Apple Sign-In ──
      loginWithApple: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInWithPopup, auth, appleProvider } = await getFirebaseAuth()
          const credential = await signInWithPopup(auth, appleProvider)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Apple login error:', err)
          let errorMsg = 'Falha no login com Apple.'
          if (err.code === 'auth/popup-closed-by-user') errorMsg = 'Popup fechado.'
          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Anonymous Sign-In ──
      loginAnonymously: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const { signInAnonymously, auth } = await getFirebaseAuth()
          const credential = await signInAnonymously(auth)
          const idToken = await credential.user.getIdToken()

          const result = await verifyWithServer(idToken, '/api/auth/anonymous')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Anonymous login error:', err)
          set({ isLoading: false, lastLoginError: 'Falha no login como visitante.' })
          return { success: false, error: 'Falha no login como visitante.' }
        }
      },

      // ── Email/password registration ──
      register: async (name: string, email: string, password: string, phone?: string): Promise<AuthResult> => {
        set({ isLoading: true, lastRegisterError: null })

        try {
          const { createUserWithEmailAndPassword, auth } = await getFirebaseAuth()
          const credential = await createUserWithEmailAndPassword(auth, email, password)

          // Update display name in Firebase Auth
          const { updateProfile } = await getFirebaseAuth()
          await updateProfile(credential.user, { displayName: name })

          const idToken = await credential.user.getIdToken()

          // Send to server to create Firestore profile
          const res = await fetch(buildApiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone }),
          })

          const data = await res.json()

          if (data.user) {
            const userRole = mapRole(data.user.role)
            const user: User = {
              id: data.user.id || credential.user.uid,
              name: data.user.name || name,
              email: data.user.email || email,
              role: userRole,
              avatar: null,
              phone: data.user.phone || phone || null,
              authProvider: 'email',
              isAnonymous: false,
              emailVerified: false,
            }
            setUserInStore(set, user)
            set({ idToken, lastRegisterError: null })
            return { success: true, user }
          } else {
            // Firebase Auth user was created but Firestore profile failed
            // Still set the user with basic info
            const user: User = {
              id: credential.user.uid,
              name: name,
              email: email,
              role: 'user',
              avatar: null,
              authProvider: 'email',
              isAnonymous: false,
              emailVerified: false,
            }
            setUserInStore(set, user)
            set({ idToken })
            return { success: true, user }
          }
        } catch (err: any) {
          console.error('Register error:', err)
          let errorMsg = 'Falha ao criar conta.'

          if (err.code === 'auth/email-already-in-use') {
            errorMsg = 'Este email já está registado.'
          } else if (err.code === 'auth/weak-password') {
            errorMsg = 'Senha demasiado fraca. Use pelo menos 6 caracteres.'
          } else if (err.code === 'auth/invalid-email') {
            errorMsg = 'Email inválido.'
          } else if (err.message?.includes('not configured')) {
            errorMsg = 'Firebase não configurado. Contacte o administrador.'
          }

          set({ isLoading: false, lastRegisterError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      logout: async () => {
        try {
          const { signOut, auth } = await getFirebaseAuth()
          await signOut(auth)
        } catch (err) {
          console.warn('Firebase signOut failed (non-critical):', err)
        }

        set({
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          isPartner: false,
          isUser: false,
          isSuperAdmin: false,
          idToken: null,
          lastLoginError: null,
          lastRegisterError: null,
        })
      },

      setUser: (user: User) => {
        setUserInStore(set, user)
      },

      updateAvatar: (avatar: string) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, avatar } })
        }
      },

      setIdToken: (token: string) => {
        set({ idToken: token })
      },
    }),
    {
      name: 'carsai-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        isPartner: state.isPartner,
        isUser: state.isUser,
        isSuperAdmin: state.isSuperAdmin,
        idToken: state.idToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true
        }
      },
    }
  )
)

// ──────────────────────────────────────────────
// Notification Store
// ──────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (type: NotificationType, title: string, message: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (type: NotificationType, title: string, message: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newNotification: Notification = {
      id,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
    }
    const updated = [newNotification, ...get().notifications]
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    })
  },

  markAsRead: (id: string) => {
    const updated = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    })
  },

  markAllAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }))
    set({
      notifications: updated,
      unreadCount: 0,
    })
  },

  removeNotification: (id: string) => {
    const updated = get().notifications.filter((n) => n.id !== id)
    set({
      notifications: updated,
      unreadCount: updated.filter((n) => !n.read).length,
    })
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 })
  },
}))

// ──────────────────────────────────────────────
// App Store
// ──────────────────────────────────────────────

interface AppState {
  currentView: AppView
  sidebarOpen: boolean
  searchQuery: string
  searchOpen: boolean
  language: Language
  selectedPostSlug: string | null
  selectedTopicSlug: string | null
  setCurrentView: (view: AppView) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSearchQuery: (query: string) => void
  setSearchOpen: (open: boolean) => void
  setLanguage: (language: Language) => void
  setSelectedPostSlug: (slug: string | null) => void
  setSelectedTopicSlug: (slug: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  sidebarOpen: true,
  searchQuery: '',
  searchOpen: false,
  language: 'pt',
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
}))
