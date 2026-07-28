/**
 * Carsai Mozambique — Firebase Client Configuration
 *
 * Used by browser-side code (Firebase Auth, Firestore client reads, FCM, Analytics).
 * Values come from client-config.ts which uses env vars with hardcoded fallbacks:
 *   - CI: env vars injected from GitHub Secrets override fallbacks
 *   - Local dev: hardcoded fallbacks work without .env
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
  GithubAuthProvider,
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
  }).catch(() => {})
}

// ─── Firebase Cloud Messaging (lazy — only in browser) ───

let messagingClient: Messaging | null = null

if (typeof window !== 'undefined') {
  isMessagingSupported().then((supported) => {
    if (supported) {
      messagingClient = getMessaging(app)
    }
  }).catch(() => {})
}

// ─── Auth providers ───

export const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')

export const githubProvider = new GithubAuthProvider()
githubProvider.addScope('user:email')
githubProvider.addScope('read:user')

// ─── FCM Token Request (client-side) ───

/**
 * Request FCM registration token for push notifications.
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

export function createRecaptchaVerifier(
  containerOrId: string | HTMLElement,
  size: 'normal' | 'invisible' = 'invisible'
): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerOrId, {
    size,
    callback: () => {},
    'expired-callback': () => {},
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

  PhoneAuthProvider,
  GithubAuthProvider,
  RecaptchaVerifier,
}

export type { User, UserCredential, IdTokenResult, ApplicationVerifier }

export function isFirebaseConfigured(): boolean {
  return !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId
}
