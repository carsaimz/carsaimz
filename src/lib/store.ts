import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildApiUrl } from '@/lib/api-base'
import {
  shouldUseNativeAuth,
  nativeSignInWithGoogle,
  nativeSignInWithGithub,
  nativeSignInAnonymously,
  nativeSignInWithEmailPassword,
  nativeCreateUserWithEmailAndPassword,
  nativeSignOut,
} from '@/lib/native-auth'

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
// 1. Client authenticates with Firebase Auth directly (email/password, Google, phone, anonymous)
// 2. Firebase Auth returns a UserCredential with an ID token
// 3. Client sends ID token to /api/auth/login, /api/auth/social, /api/auth/anonymous, or /api/auth/verify
// 4. Server verifies token, returns Firestore profile (role, isActive, etc.)
// 5. Store saves the combined profile
//
// Phone Auth Flow:
// 1. Client calls loginWithPhone(phoneNumber, recaptchaContainerId)
// 2. Firebase sends SMS OTP to the phone number
// 3. User enters the OTP code
// 4. Client calls verifyPhoneCode(verificationId, otpCode)
// 5. Firebase verifies OTP and returns credential with ID token
// 6. Client sends ID token to /api/auth/social (phone treated as social provider)
// 7. Server verifies token and returns Firestore profile
// ──────────────────────────────────────────────

export interface AuthResult {
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
  // Phone auth state
  phoneVerificationId: string | null
  loginWithToken: (idToken: string) => Promise<AuthResult>
  loginWithEmailPassword: (email: string, password: string) => Promise<AuthResult>
  loginWithGoogle: () => Promise<AuthResult>
  loginWithGithub: () => Promise<AuthResult>
  loginAnonymously: () => Promise<AuthResult>
  loginWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ verificationId: string } | null>
  verifyPhoneCode: (verificationId: string, verificationCode: string) => Promise<AuthResult>
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
 * Verify authentication with server API route.
 * If server is unavailable (static export / Capacitor), falls back to
 * client-side Firestore profile lookup/creation.
 */
async function verifyWithServer(idToken: string, endpoint: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const res = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })

    // If the server returned a valid response (not 404), use it
    if (res.ok) {
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
    }

    // Server returned 404 or other error — fall back to client-side Firestore
    console.warn('[Auth] Server API unavailable, falling back to client-side Firestore')
    return await verifyWithClientFirestore(idToken)
  } catch (err) {
    // Network error — server not available (static export / Capacitor)
    console.warn('[Auth] Server API not reachable, falling back to client-side Firestore:', err)
    return await verifyWithClientFirestore(idToken)
  }
}

/**
 * Client-side Firestore fallback for authentication.
 * Used when the server API routes are not available (static export / Capacitor).
 * Reads the user profile from Firestore directly, or creates one if it doesn't exist.
 */
async function verifyWithClientFirestore(idToken: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const { auth, firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client')

    if (!isFirebaseConfigured() || !firestoreClient) {
      return { success: false, error: 'Firebase não configurado.' }
    }

    // Decode the ID token to get the Firebase user info
    // We need to get the current Firebase Auth user
    const currentUser = auth.currentUser
    if (!currentUser) {
      return { success: false, error: 'Utilizador não autenticado.' }
    }

    const uid = currentUser.uid
    const { doc, getDoc, setDoc } = await import('firebase/firestore')

    // Try to read existing profile from Firestore
    const userRef = doc(firestoreClient, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      // Profile exists — return it
      const profile = userSnap.data()
      const userRole = mapRole(profile.role)
      const user: User = {
        id: uid,
        name: profile.name || currentUser.displayName || 'Utilizador',
        email: profile.email || currentUser.email || null,
        role: userRole,
        avatar: profile.avatar || currentUser.photoURL || null,
        phone: profile.phone || currentUser.phoneNumber || null,
        company: profile.company || null,
        bio: profile.bio || null,
        address: profile.address || null,
        authProvider: (currentUser.providerData[0]?.providerId as AuthProvider) || 'unknown',
        isAnonymous: currentUser.isAnonymous,
        emailVerified: currentUser.emailVerified,
      }
      return { success: true, user }
    }

    // Profile doesn't exist — create it (first-time social/anonymous login)
    const providerId = currentUser.providerData[0]?.providerId || 'unknown'
    let authProvider: AuthProvider = 'unknown'
    if (providerId === 'google.com') authProvider = 'google.com'
    else if (providerId === 'phone') authProvider = 'phone'
    else if (providerId === 'anonymous') authProvider = 'anonymous'
    else if (providerId === 'password') authProvider = 'email'

    const newProfile = {
      name: currentUser.displayName || 'Utilizador',
      email: currentUser.email || null,
      phone: currentUser.phoneNumber || null,
      avatar: currentUser.photoURL || null,
      company: null,
      bio: null,
      address: null,
      role: 'user',
      isActive: true,
      emailVerified: currentUser.emailVerified,
      authProvider,
      isAnonymous: currentUser.isAnonymous,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(userRef, newProfile)

    const user: User = {
      id: uid,
      name: newProfile.name,
      email: newProfile.email,
      role: 'user',
      avatar: newProfile.avatar,
      phone: newProfile.phone,
      company: null,
      bio: null,
      address: null,
      authProvider,
      isAnonymous: currentUser.isAnonymous,
      emailVerified: currentUser.emailVerified,
    }
    return { success: true, user }
  } catch (err) {
    console.error('[Auth] Client-side Firestore fallback error:', err)
    return { success: false, error: 'Erro de autenticação. Tente novamente.' }
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
      phoneVerificationId: null,

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
          let idToken: string

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            const nativeResult = await nativeSignInWithEmailPassword(email, password)
            idToken = nativeResult.idToken
          } else {
            // ── Web path: Firebase Web SDK ──
            const { signInWithEmailAndPassword, auth } = await getFirebaseAuth()
            const credential = await signInWithEmailAndPassword(auth, email, password)
            idToken = await credential.user.getIdToken()
          }

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
          } else if (err.code === 'auth/invalid-email') {
            errorMsg = 'Email inválido.'
          } else if (err.message?.includes('not configured')) {
            errorMsg = 'Firebase não configurado. Contacte o administrador.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Google Sign-In ──
      // Web: Uses signInWithRedirect (more reliable than popup — avoids popup blockers)
      // Native: Uses @capacitor-firebase/authentication GoogleSignIn
      loginWithGoogle: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          let idToken: string

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            // Uses Google Sign-In via Android system account picker / iOS ASAuthorization
            const nativeResult = await nativeSignInWithGoogle()
            idToken = nativeResult.idToken
          } else {
            // ── Web path: Firebase Web SDK signInWithRedirect ──
            // Using redirect instead of popup because:
            // 1. Popup blockers don't interfere
            // 2. Works in Capacitor WebView (popup doesn't close immediately)
            // 3. More reliable cross-browser compatibility
            const { signInWithRedirect, auth, googleProvider } = await getFirebaseAuth()
            await signInWithRedirect(auth, googleProvider)
            // After redirect, the page will reload and getRedirectResult() will
            // return the credential. The auth-context.tsx handles this on mount.
            // Return a special "redirecting" result so the UI knows what's happening.
            return { success: true }
          }

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
          } else if (err.code === 'auth/unauthorized-domain') {
            errorMsg = 'Domínio não autorizado. Adicione este domínio no Firebase Console.'
          } else if (err.code === 'auth/redirect-operation-pending') {
            errorMsg = 'Operação de redirecionamento em curso. Aguarde.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── GitHub Sign-In ──
      // Web: Uses signInWithRedirect (same reason as Google)
      // Native: Uses @capacitor-firebase/authentication
      loginWithGithub: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          let idToken: string

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            const nativeResult = await nativeSignInWithGithub()
            idToken = nativeResult.idToken
          } else {
            // ── Web path: Firebase Web SDK signInWithRedirect ──
            const { signInWithRedirect, auth, githubProvider } = await getFirebaseAuth()
            await signInWithRedirect(auth, githubProvider)
            // After redirect, the page will reload and getRedirectResult() will
            // return the credential. The auth-context.tsx handles this on mount.
            return { success: true }
          }

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

          if (err.code === 'auth/unauthorized-domain') {
            errorMsg = 'Domínio não autorizado. Adicione este domínio no Firebase Console.'
          } else if (err.code === 'auth/account-exists-with-different-credential') {
            errorMsg = 'Conta já existe com outro método de login. Use o mesmo método que registou.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── Phone Authentication (Step 1: Send SMS OTP) ──
      loginWithPhone: async (phoneNumber: string, recaptchaContainerId: string): Promise<{ verificationId: string } | null> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const fb = await getFirebaseAuth()
          const { auth, PhoneAuthProvider, createRecaptchaVerifier } = fb

          // Create RecaptchaVerifier for the given container
          const recaptchaVerifier = createRecaptchaVerifier(recaptchaContainerId, 'invisible')

          // Send SMS verification code
          const phoneProvider = new PhoneAuthProvider(auth)
          const verificationId = await phoneProvider.verifyPhoneNumber(
            phoneNumber,
            recaptchaVerifier
          )

          set({ phoneVerificationId: verificationId, isLoading: false })
          return { verificationId }
        } catch (err: any) {
          console.error('Phone auth error:', err)
          let errorMsg = 'Falha no login por telefone.'

          if (err.code === 'auth/invalid-phone-number') {
            errorMsg = 'Número de telefone inválido. Use formato +258XXXXXXXXX.'
          } else if (err.code === 'auth/quota-exceeded') {
            errorMsg = 'Limite de SMS excedido. Tente novamente mais tarde.'
          } else if (err.code === 'auth/too-many-requests') {
            errorMsg = 'Muitas tentativas. Tente novamente mais tarde.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return null
        }
      },

      // ── Phone Authentication (Step 2: Verify OTP code) ──
      verifyPhoneCode: async (verificationId: string, verificationCode: string): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          const fb = await getFirebaseAuth()
          const { auth, PhoneAuthProvider, signInWithCredential } = fb

          // Create credential from verification ID + OTP code
          const credential = PhoneAuthProvider.credential(verificationId, verificationCode)
          const userCredential = await signInWithCredential(auth, credential)
          const idToken = await userCredential.user.getIdToken()

          // Verify with server to get Firestore profile
          const result = await verifyWithServer(idToken, '/api/auth/social')

          if (result.success && result.user) {
            setUserInStore(set, result.user)
            set({ idToken, phoneVerificationId: null })
            return { success: true, user: result.user }
          } else {
            set({ isLoading: false, lastLoginError: result.error, phoneVerificationId: null })
            return { success: false, error: result.error }
          }
        } catch (err: any) {
          console.error('Phone verify error:', err)
          let errorMsg = 'Código de verificação inválido.'

          if (err.code === 'auth/invalid-verification-code') {
            errorMsg = 'Código SMS incorreto. Verifique e tente novamente.'
          } else if (err.code === 'auth/invalid-verification-id') {
            errorMsg = 'Sessão de verificação expirada. Tente novamente.'
          } else if (err.code === 'auth/code-expired') {
            errorMsg = 'Código expirado. Solicite um novo código SMS.'
          }

          set({ isLoading: false, lastLoginError: errorMsg, phoneVerificationId: null })
          return { success: false, error: errorMsg }
        }
      },

      // ── Anonymous Sign-In ──
      loginAnonymously: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          let idToken: string

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            const nativeResult = await nativeSignInAnonymously()
            idToken = nativeResult.idToken
          } else {
            // ── Web path: Firebase Web SDK ──
            const { signInAnonymously, auth } = await getFirebaseAuth()
            const credential = await signInAnonymously(auth)
            idToken = await credential.user.getIdToken()
          }

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
          const { createUserWithEmailAndPassword, auth, updateProfile } = await getFirebaseAuth()
          const credential = await createUserWithEmailAndPassword(auth, email, password)

          // Update display name in Firebase Auth
          await updateProfile(credential.user, { displayName: name })

          const idToken = await credential.user.getIdToken()

          // Send to server to create Firestore profile
          const res = await fetch(buildApiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone }),
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
          if (shouldUseNativeAuth()) {
            await nativeSignOut()
          } else {
            const { signOut, auth } = await getFirebaseAuth()
            await signOut(auth)
          }
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
          phoneVerificationId: null,
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
