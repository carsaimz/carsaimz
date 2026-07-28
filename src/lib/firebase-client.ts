/**
 * Carsai Mozambique — Firebase Client Configuration
 *
 * Used by browser-side code (Firebase Auth, Firestore client reads, FCM, Analytics).
 * All values come from the hardcoded config in client-config.ts
 * (Firebase client SDK config is public by design — it ends up in the
 * client bundle regardless of whether it comes from env vars or hardcoded).
 *
 * Firebase Spark Plan (Free) features integrated:
 * - Authentication (email/password, Google, anonymous, phone)
 * - Firestore (NoSQL database — 1GB free, 50K reads/day, 20K writes/day)
 * - Cloud Messaging (FCM — free push notifications)
 * - Analytics (free usage tracking)
 * - Cloud Storage (5GB free — file uploads)
 * - App Check (free abuse prevention)
 * - Crashlytics (free crash reporting)
 * - Performance Monitoring (free)
 * - Remote Config (free dynamic configuration)
 */

import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from '@/lib/client-config'

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  linkWithPopup,
  linkWithCredential,
  unlink,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  User,
  UserCredential,
  IdTokenResult,
  ApplicationVerifier,
  RecaptchaVerifier,
} from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging'
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

// ─── Firebase App singleton ───

let app: FirebaseApp

if (!getApps().length) {
  app = initializeApp(FIREBASE_CONFIG)
} else {
  app = getApp()
}

// ─── Firebase Auth singleton ───

let auth: Auth

try {
  auth = getAuth(app)
  // Set language for auth UI (email verification, password reset, etc.)
  auth.languageCode = 'pt'
} catch {
  // During static export, auth may not be available
  auth = null as unknown as Auth
}

// ─── Firestore client singleton ───

let firestoreClient: Firestore | null = null

try {
  firestoreClient = getFirestore(app)
} catch {
  // During static export, Firestore may not be available
  firestoreClient = null
}

// ─── Firebase Storage singleton ───

let storageClient: FirebaseStorage | null = null

try {
  storageClient = getStorage(app)
} catch {
  storageClient = null
}

// ─── Firebase Analytics (lazy — only in browser) ───

let analyticsClient: Analytics | null = null

if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analyticsClient = getAnalytics(app)
    }
  }).catch(() => {
    // Analytics not supported (e.g. SSR, privacy mode)
  })
}

// ─── Firebase Cloud Messaging (lazy — only in browser) ───

let messagingClient: Messaging | null = null

if (typeof window !== 'undefined') {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messagingClient = getMessaging(app)
    }
  }).catch(() => {
    // FCM not supported (e.g. Safari, SSR)
  })
}

// ─── Auth providers ───

export const googleProvider = new GoogleAuthProvider()

// Configure Google provider to request profile + email
googleProvider.addScope('profile')
googleProvider.addScope('email')

// ─── FCM Token Request (client-side) ───

/**
 * Request FCM registration token for push notifications.
 * Returns the token string or null if not supported/permission denied.
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    if (!messagingClient) return null

    const { getToken } = await import('firebase/messaging')

    if (!FIREBASE_VAPID_KEY) {
      console.warn('[FCM] VAPID key not configured — push notifications disabled')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied')
      return null
    }

    const token = await getToken(messagingClient, { vapidKey: FIREBASE_VAPID_KEY })
    return token
  } catch (error) {
    console.error('[FCM] Error getting token:', error)
    return null
  }
}

/**
 * Listen for foreground FCM messages.
 */
export async function onForegroundMessage(
  callback: (payload: any) => void
): Promise<() => void> {
  try {
    if (!messagingClient) return () => {}

    const { onMessage } = await import('firebase/messaging')
    return onMessage(messagingClient, callback)
  } catch {
    return () => {}
  }
}

// ─── Phone Auth Helper ───

/**
 * Create a RecaptchaVerifier instance for phone authentication.
 * Must be called in the browser with a visible reCAPTCHA container.
 *
 * Usage:
 *   const verifier = createRecaptchaVerifier('recaptcha-container')
 *   const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
 */
export function createRecaptchaVerifier(
  containerOrId: string | HTMLElement,
  size: 'normal' | 'invisible' = 'invisible'
): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerOrId, {
    size,
    callback: () => {
      // reCAPTCHA solved — allow sign-in
    },
    'expired-callback': () => {
      // Response expired — ask user to solve again
    },
  })
}

// ─── Export everything ───

export {
  app,
  auth,
  firestoreClient,
  storageClient,
  analyticsClient,
  messagingClient,

  // Auth functions
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  linkWithPopup,
  linkWithCredential,
  unlink,
  fetchSignInMethodsForEmail,
  getRedirectResult,

  // Auth types
  PhoneAuthProvider,
  RecaptchaVerifier,
}

export type { User, UserCredential, IdTokenResult, ApplicationVerifier }

// ─── Helper: check if Firebase is configured ───

export function isFirebaseConfigured(): boolean {
  return !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId
}
