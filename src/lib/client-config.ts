/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 * Firebase Auth handles authentication client-side.
 * Firestore is accessed via API routes (server-side Admin SDK).
 */

// ─── App version (embedded at build time) ───

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.2.1'
export const APP_BUILD = process.env.NEXT_PUBLIC_APP_BUILD || '2'

// ─── API base URL ───
// For Capacitor mobile app, set NEXT_PUBLIC_API_URL to your deployed server.
// For local development, leave empty (relative URLs work on same-origin).

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ─── Site URLs ───

export const SITE_URL = 'https://carsai.mz'
export const GITHUB_URL = 'https://github.com/carsaimz'

// ─── Firebase Config (client-side) ───

export const FIREBASE_CONFIG = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId:      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

export function isFirebaseConfigured(): boolean {
  return !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId
}

// ─── Feature flags ───

export const FEATURES = {
  chat: true,
  forum: true,
  blog: true,
  newsletter: true,
  affiliate: false,
  // Firebase features
  googleSignIn: true,
  facebookSignIn: false,   // Enable after Facebook app setup
  githubSignIn: false,     // Enable after GitHub OAuth setup
  microsoftSignIn: false,  // Enable after Microsoft app setup
  appleSignIn: false,      // Enable after Apple Developer setup
  phoneSignIn: false,      // Enable after phone auth setup
  anonymousSignIn: true,
  pushNotifications: true, // FCM
  analytics: true,
  crashlytics: true,
  performanceMonitoring: true,
  remoteConfig: true,
}
