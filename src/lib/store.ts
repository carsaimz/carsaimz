import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiFetch, safeJson } from '@/lib/api-fetch'
import {
  shouldUseNativeAuth,
  nativeSignInWithGoogle,
  nativeSignInWithGithub,
  nativeSignInAnonymously,
  nativeSignInWithEmailPassword,
  nativeCreateUserWithEmailAndPassword,
  nativeSignOut,
  type NativeAuthResult,
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
  link?: string | null
  channels?: { web?: boolean; email?: boolean; push?: boolean }
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

  // Sync auth cookies for middleware/proxy (server-side role checks)
  if (typeof document !== 'undefined') {
    document.cookie = `carsai-role=${userRole};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`
  }
}

function mapRole(roleData: any): UserRole {
  if (typeof roleData === 'string') return roleData as UserRole
  if (roleData && typeof roleData === 'object' && roleData.name) return roleData.name as UserRole
  return 'user'
}

/**
 * Resolve role from a Firestore user profile.
 * The profile may have:
 *   - `role` as a string (e.g. 'admin') — new format
 *   - `role` as an object { id, name } — from server API response
 *   - `roleId` as a string — reference to a roles/{id} document (legacy)
 *   - None of the above — default to 'user'
 *
 * When roleId is present, we try to read the role document from Firestore
 * (client-side) to resolve the name.
 */
async function resolveRoleFromProfile(profile: any): Promise<UserRole> {
  // 1. Direct `role` field (string or object)
  if (profile.role) {
    return mapRole(profile.role)
  }

  // 2. `roleId` — resolve from Firestore roles collection
  if (profile.roleId) {
    try {
      const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client')
      if (isFirebaseConfigured() && firestoreClient) {
        const { doc, getDoc } = await import('firebase/firestore')
        const roleRef = doc(firestoreClient, 'roles', profile.roleId)
        const roleSnap = await getDoc(roleRef)
        if (roleSnap.exists()) {
          const roleData = roleSnap.data()
          return roleData.name as UserRole || 'user'
        }
      }
    } catch (err) {
      console.warn('[Auth] Failed to resolve roleId:', err)
    }
  }

  return 'user'
}

/**
 * Verify authentication with server API route.
 * Uses apiFetch (instead of raw fetch) to handle:
 *   - Capacitor CORS bypass (external URL + CORS middleware)
 *   - HTML response detection/retry (static export fallback)
 *   - Proper error handling without "Unexpected token '<'" crashes
 *
 * If server is unavailable, falls back to client-side Firestore or
 * native auth result data.
 *
 * @param nativeResult Optional native auth result with user info,
 *   used when the Web SDK's auth.currentUser is not yet synced.
 */
async function verifyWithServer(
  idToken: string,
  endpoint: string,
  nativeResult?: NativeAuthResult
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Use apiFetch instead of raw fetch — it handles CORS, HTML detection,
    // and automatic retry with external URL for Capacitor apps.
    // Pass the relative path (e.g., '/api/auth/login') — apiFetch handles
    // the full URL resolution internally (don't use buildApiUrl here).
    const res = await apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })

    // Check if response is JSON before parsing
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      console.warn('[Auth] Server returned non-JSON response:', contentType)
      // Not JSON — fall back
      return await fallbackVerify(idToken, nativeResult)
    }

    if (res.ok) {
      const data = await safeJson(res)
      if (!data) return await fallbackVerify(idToken, nativeResult)

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

    // Server returned non-OK status — try to parse error
    let errorMsg = 'Autenticação falhou.'
    try {
      const errData = await safeJson(res)
      if (errData) errorMsg = errData.error || errorMsg
    } catch {}

    // If the error is not a permanent auth error, try client-side fallback
    if (res.status !== 401 && res.status !== 403) {
      console.warn('[Auth] Server API error, falling back to client-side:', errorMsg)
      return await fallbackVerify(idToken, nativeResult)
    }

    return { success: false, error: errorMsg }
  } catch (err) {
    // Network error — server not available (static export / Capacitor / CORS blocked)
    console.warn('[Auth] Server API not reachable, falling back:', err)
    return await fallbackVerify(idToken, nativeResult)
  }
}

/**
 * Smart fallback: tries client-side Firestore first (if auth.currentUser available),
 * then uses native auth result data if provided.
 * This prevents the "Utilizador não autenticado" error on mobile.
 */
async function fallbackVerify(
  idToken: string,
  nativeResult?: NativeAuthResult
): Promise<{ success: boolean; user?: User; error?: string }> {
  // Try client-side Firestore (needs auth.currentUser)
  const clientResult = await verifyWithClientFirestore(idToken)
  if (clientResult.success) return clientResult

  // If client-side Firestore failed AND we have native auth result,
  // use the native result data directly
  if (nativeResult) {
    return verifyWithNativeResult(nativeResult)
  }

  return clientResult
}

/**
 * Create user profile from native auth result data.
 * Used when both the server API and client-side Firestore are unavailable,
 * but we have the native auth result with user info.
 *
 * This prevents the "Utilizador não autenticado" error on mobile.
 */
async function verifyWithNativeResult(nativeResult: NativeAuthResult): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Try to create/update the Firestore profile using client-side Firestore
    // even if auth.currentUser is not yet synced
    const { firestoreClient, isFirebaseConfigured } = await import('@/lib/firebase-client')

    if (isFirebaseConfigured() && firestoreClient) {
      const { doc, getDoc, setDoc } = await import('firebase/firestore')
      const uid = nativeResult.uid

      // Try to read existing profile
      const userRef = doc(firestoreClient, 'users', uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const profile = userSnap.data()
        const userRole = await resolveRoleFromProfile(profile)
        const user: User = {
          id: uid,
          name: profile.name || nativeResult.displayName || 'Utilizador',
          email: profile.email || nativeResult.email || null,
          role: userRole,
          avatar: profile.avatar || nativeResult.photoUrl || null,
          phone: profile.phone || nativeResult.phoneNumber || null,
          authProvider: nativeResult.providerId as AuthProvider || 'unknown',
          isAnonymous: nativeResult.isAnonymous,
          emailVerified: nativeResult.emailVerified,
        }
        return { success: true, user }
      }

      // Profile doesn't exist — create it from native auth result
      const authProvider = nativeResult.providerId as AuthProvider
      await setDoc(userRef, {
        name: nativeResult.displayName || nativeResult.email?.split('@')[0] || 'Utilizador',
        email: nativeResult.email || null,
        phone: nativeResult.phoneNumber || null,
        avatar: nativeResult.photoUrl || null,
        company: null,
        bio: null,
        address: null,
        roleId: null,
        isActive: true,
        emailVerified: nativeResult.emailVerified,
        authProvider,
        isAnonymous: nativeResult.isAnonymous,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const user: User = {
        id: uid,
        name: nativeResult.displayName || 'Utilizador',
        email: nativeResult.email,
        role: 'user',
        avatar: nativeResult.photoUrl || null,
        phone: nativeResult.phoneNumber || null,
        authProvider,
        isAnonymous: nativeResult.isAnonymous,
        emailVerified: nativeResult.emailVerified,
      }
      return { success: true, user }
    }

    // Firestore not available — use native result data as last resort
    const user: User = {
      id: nativeResult.uid,
      name: nativeResult.displayName || 'Utilizador',
      email: nativeResult.email,
      role: 'user',
      avatar: nativeResult.photoUrl || null,
      phone: nativeResult.phoneNumber || null,
      authProvider: nativeResult.providerId as AuthProvider || 'unknown',
      isAnonymous: nativeResult.isAnonymous,
      emailVerified: nativeResult.emailVerified,
    }
    return { success: true, user }
  } catch (err) {
    console.error('[Auth] Native result fallback error:', err)
    // Last resort: use native result data directly without Firestore
    const user: User = {
      id: nativeResult.uid,
      name: nativeResult.displayName || 'Utilizador',
      email: nativeResult.email,
      role: 'user',
      avatar: nativeResult.photoUrl || null,
      phone: nativeResult.phoneNumber || null,
      authProvider: nativeResult.providerId as AuthProvider || 'unknown',
      isAnonymous: nativeResult.isAnonymous,
      emailVerified: nativeResult.emailVerified,
    }
    return { success: true, user }
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
      // Profile exists — resolve role from roleId or role field
      const profile = userSnap.data()
      const userRole = await resolveRoleFromProfile(profile)
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
    else if (providerId === 'github.com') authProvider = 'github.com'
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
      roleId: null,
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
          let nativeAuthResult: NativeAuthResult | undefined

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            const nativeResult = await nativeSignInWithEmailPassword(email, password)
            idToken = nativeResult.idToken
            nativeAuthResult = nativeResult // Pass to fallback if server fails
          } else {
            // ── Web path: Firebase Web SDK ──
            const { signInWithEmailAndPassword, auth } = await getFirebaseAuth()
            const credential = await signInWithEmailAndPassword(auth, email, password)
            idToken = await credential.user.getIdToken()
          }

          const result = await verifyWithServer(idToken, '/api/auth/login', nativeAuthResult)

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
      // Web: Uses signInWithPopup (primary) with redirect fallback ONLY for popup-blocked
      // Native: Uses @capacitor-firebase/authentication GoogleSignIn
      loginWithGoogle: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          let idToken: string
          let nativeAuthResult: NativeAuthResult | undefined
          const isNative = shouldUseNativeAuth()

          if (isNative) {
            // ── Native path: @capacitor-firebase/authentication ──
            // Uses Google Sign-In via Android system account picker / iOS ASAuthorization
            const nativeResult = await nativeSignInWithGoogle()
            idToken = nativeResult.idToken
            nativeAuthResult = nativeResult
          } else {
            // ── Web path: Firebase Web SDK signInWithPopup ONLY ──
            // Using popup exclusively because:
            // 1. Returns result immediately — no page reload needed
            // 2. Works reliably on Vercel / deployed domains
            // 3. signInWithRedirect causes "missing initial state" errors in
            //    storage-partitioned browsers (Chrome 114+, Safari 17+)
            // 4. No need for getRedirectResult() handler or /__/auth/handler URL
            //
            // If popup is blocked, we show a user-friendly error instead of
            // falling back to redirect (which breaks in modern browsers).
            const fb = await getFirebaseAuth()
            const { auth, googleProvider, signInWithPopup } = fb

            const userCredential = await signInWithPopup(auth, googleProvider)

            // Popup succeeded — get the ID token and verify with server immediately
            idToken = await userCredential.user.getIdToken()
          }

          const result = await verifyWithServer(idToken, '/api/auth/social', nativeAuthResult)

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
            errorMsg = 'Domínio não autorizado. Adicione este domínio no Firebase Console → Authentication → Settings → Authorized domains.'
          } else if (err.code === 'auth/operation-not-allowed') {
            errorMsg = 'Login com Google não está activado. Active no Firebase Console → Authentication → Sign-in method.'
          } else if (err.code === 'auth/account-exists-with-different-credential') {
            errorMsg = 'Já existe uma conta com este email. Tente outro método de login.'
          } else if (err.code === 'auth/network-request-failed') {
            errorMsg = 'Erro de rede. Verifique a sua ligação e tente novamente.'
          }

          set({ isLoading: false, lastLoginError: errorMsg })
          return { success: false, error: errorMsg }
        }
      },

      // ── GitHub Sign-In ──
      // Web: Uses signInWithPopup ONLY (no redirect fallback — it causes "missing initial state" errors)
      // Native: Uses @capacitor-firebase/authentication
      loginWithGithub: async (): Promise<AuthResult> => {
        set({ isLoading: true, lastLoginError: null })

        try {
          let idToken: string
          let nativeAuthResult: NativeAuthResult | undefined
          const isNative = shouldUseNativeAuth()

          if (isNative) {
            const nativeResult = await nativeSignInWithGithub()
            idToken = nativeResult.idToken
            nativeAuthResult = nativeResult
          } else {
            // ── Web path: Firebase Web SDK signInWithPopup ONLY ──
            // Using popup exclusively — same reason as Google login:
            // signInWithRedirect causes "missing initial state" errors in
            // storage-partitioned browsers and navigates to /__/auth/handler URL.
            const fb = await getFirebaseAuth()
            const { auth, githubProvider, signInWithPopup } = fb

            const userCredential = await signInWithPopup(auth, githubProvider)

            // Popup succeeded — get the ID token and verify with server immediately
            idToken = await userCredential.user.getIdToken()
          }

          const result = await verifyWithServer(idToken, '/api/auth/social', nativeAuthResult)

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
            errorMsg = 'Domínio não autorizado. Adicione este domínio no Firebase Console → Authentication → Settings → Authorized domains.'
          } else if (err.code === 'auth/account-exists-with-different-credential') {
            errorMsg = 'Conta já existe com outro método de login. Use o mesmo método que registou.'
          } else if (err.code === 'auth/popup-closed-by-user') {
            errorMsg = 'Popup fechado. Tente novamente.'
          } else if (err.code === 'auth/popup-blocked') {
            errorMsg = 'Popup bloqueado pelo navegador. Permita popups para este site e tente novamente.'
          } else if (err.code === 'auth/network-request-failed') {
            errorMsg = 'Erro de rede. Verifique a sua ligação e tente novamente.'
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
          let nativeAuthResult: NativeAuthResult | undefined

          if (shouldUseNativeAuth()) {
            // ── Native path: @capacitor-firebase/authentication ──
            const nativeResult = await nativeSignInAnonymously()
            idToken = nativeResult.idToken
            nativeAuthResult = nativeResult
          } else {
            // ── Web path: Firebase Web SDK ──
            const { signInAnonymously, auth } = await getFirebaseAuth()
            const credential = await signInAnonymously(auth)
            idToken = await credential.user.getIdToken()
          }

          const result = await verifyWithServer(idToken, '/api/auth/anonymous', nativeAuthResult)

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

          // Try server API first to create Firestore profile
          let serverProfileCreated = false
          try {
            const res = await apiFetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, phone }),
            })

            // Check if response is JSON (not HTML from static export)
            const contentType = res.headers.get('content-type') || ''
            if (contentType.includes('application/json')) {
              const data = await safeJson(res)
              if (!data) return { success: false, error: 'Server returned non-JSON response' }

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
              }
            }
            // If not JSON or no user data, fall through to client-side Firestore
          } catch (apiErr) {
            console.warn('[Auth] Server API unavailable for registration, falling back to client-side Firestore:', apiErr)
          }

          // Fallback: Create Firestore profile directly using client SDK
          if (!serverProfileCreated) {
            try {
              const { firestoreClient } = await import('@/lib/firebase-client')
              if (firestoreClient) {
                const { doc, setDoc, getDoc, getDocs, collection, query, where } = await import('firebase/firestore')
                const uid = credential.user.uid

                // Find the "user" role
                let roleId: string | null = null
                try {
                  const rolesRef = collection(firestoreClient, 'roles')
                  const q = query(rolesRef, where('name', '==', 'user'))
                  const roleSnap = await getDocs(q)
                  if (!roleSnap.empty) {
                    roleId = roleSnap.docs[0].id
                  }
                } catch (e) {
                  console.warn('[Auth] Could not find user role:', e)
                }

                // Create user profile in Firestore
                const userRef = doc(firestoreClient, 'users', uid)
                await setDoc(userRef, {
                  name: name || email.split('@')[0],
                  email: email.toLowerCase().trim(),
                  phone: phone || null,
                  company: null,
                  avatar: null,
                  bio: null,
                  address: null,
                  roleId: roleId,
                  isActive: true,
                  emailVerified: false,
                  authProvider: 'email',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })

                const user: User = {
                  id: uid,
                  name: name,
                  email: email,
                  role: 'user',
                  avatar: null,
                  phone: phone || null,
                  authProvider: 'email',
                  isAnonymous: false,
                  emailVerified: false,
                }
                setUserInStore(set, user)
                set({ idToken, lastRegisterError: null })
                return { success: true, user }
              }
            } catch (fsErr) {
              console.error('[Auth] Client-side Firestore profile creation failed:', fsErr)
            }
          }

          // Last resort: Firebase Auth user was created but Firestore profile failed
          // Still set the user with basic info so the UI works
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

        // Clear auth cookies on logout
        if (typeof document !== 'undefined') {
          document.cookie = 'carsai-role=;path=/;max-age=0;SameSite=Lax'
          document.cookie = 'carsai-id-token=;path=/;max-age=0;SameSite=Lax'
        }
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
        // Sync ID token cookie for middleware/proxy (server-side auth verification)
        if (typeof document !== 'undefined' && token) {
          document.cookie = `carsai-id-token=${token};path=/;max-age=${60 * 60 * 24 * 30};SameSite=Lax`
        }
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
