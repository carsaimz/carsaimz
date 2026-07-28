/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 *
 * Firebase client config uses env vars with hardcoded fallbacks:
 *   - CI/Workflows: env vars injected from GitHub Secrets (override)
 *   - Local dev: hardcoded fallbacks work without .env
 *
 * This keeps secrets out of .env while allowing CI override capability.
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

// ─── Firebase Config (client-side — env vars with hardcoded fallbacks) ───
// These values are public by design — they end up in the client bundle.
// Hardcoded fallbacks allow local dev without .env.
// CI workflows inject env vars from GitHub Secrets to override if needed.

export const FIREBASE_CONFIG = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY             || 'AIzaSyBAqWCPbR_ExDUYSH__1CvFZ7ONo2JZXKU',
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         || 'carsai-mozambique-d5983.firebaseapp.com',
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID          || 'carsai-mozambique-d5983',
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      || 'carsai-mozambique-d5983.firebasestorage.app',
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '136334398331',
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID              || '1:136334398331:web:4a81fc100951ed4835e3de',
  measurementId:      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID      || 'G-4P1J5KZHXF',
}

// ─── Firebase VAPID Key (for FCM push notifications) ───
// Public key — safe to hardcode (used client-side for web push).
// CI can override via NEXT_PUBLIC_FIREBASE_VAPID_KEY GitHub Secret.

export const FIREBASE_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BOWPwKVMZEKRdoPsEKm-VZNd7QMvCGFYj-NUhGqdrufuycM0t4sfteUh3MJPPS5AdvIAqXs-tsNte7mcn7hpOqE'

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
  githubSignIn: true,         // Requires GitHub OAuth App (free to set up)
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
