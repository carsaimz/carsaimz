/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 * Firebase Auth handles authentication client-side.
 * Firestore is accessed via API routes (server-side Admin SDK).
 *
 * Firebase Spark Plan (Free) Features:
 * ✅ Authentication (Email/Password, Google, Phone, Anonymous)
 * ✅ Firestore (1GB storage, 50K reads/day, 20K writes/day)
 * ✅ Cloud Storage (5GB free)
 * ✅ Cloud Messaging (FCM — unlimited push notifications)
 * ✅ Analytics (free usage tracking)
 * ✅ App Check (free abuse prevention)
 * ✅ Crashlytics (free crash reporting)
 * ✅ Performance Monitoring (free)
 * ✅ Remote Config (free dynamic configuration)
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
// Toggle features based on Firebase project configuration.
// Spark plan (free) supports: Email/Password, Google, Phone, Anonymous auth.

export const FEATURES = {
  // Core features
  chat: true,
  forum: true,
  blog: true,
  newsletter: true,
  affiliate: false,

  // Firebase Auth — Spark plan (free) providers
  emailSignIn: true,          // ✅ Free — Email/Password authentication
  googleSignIn: true,         // ✅ Free — Google Sign-In
  phoneSignIn: true,          // ✅ Free — Phone/SMS OTP authentication
  anonymousSignIn: true,      // ✅ Free — Guest/anonymous access

  // Firebase Auth — Additional providers (free on Spark but require external setup)
  facebookSignIn: false,      // Requires Facebook Developer App
  githubSignIn: false,        // Requires GitHub OAuth App
  microsoftSignIn: false,     // Requires Microsoft Entra ID App
  appleSignIn: false,         // Requires Apple Developer Account ($99/year)

  // Firebase services
  pushNotifications: true,    // FCM — free on Spark
  analytics: true,            // Google Analytics — free
  cloudStorage: true,         // 5GB free on Spark
  crashlytics: true,          // Free crash reporting
  performanceMonitoring: true, // Free performance tracking
  remoteConfig: true,         // Free dynamic configuration
  appCheck: true,             // Free abuse prevention
}
