/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 * Firebase client config is hardcoded here (it's public anyway —
 * embedded in the client bundle regardless of whether it comes
 * from env vars or hardcoded).
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

// ─── Firebase Config (client-side — hardcoded) ───
// These values are public by design — they end up in the client bundle
// regardless of whether they come from env vars or hardcoded constants.
// Hardcoding them eliminates the risk of accidentally committing secrets
// in .env files and simplifies local development setup.

export const FIREBASE_CONFIG = {
  apiKey:             'AIzaSyBAqWCPbR_ExDUYSH__1CvFZ7ONo2JZXKU',
  authDomain:         'carsai-mozambique-d5983.firebaseapp.com',
  projectId:          'carsai-mozambique-d5983',
  storageBucket:      'carsai-mozambique-d5983.firebasestorage.app',
  messagingSenderId:  '136334398331',
  appId:              '1:136334398331:web:4a81fc100951ed4835e3de',
  measurementId:      'G-4P1J5KZHXF',
}

// ─── Firebase VAPID Key (for FCM push notifications) ───
// Public key — safe to hardcode (used client-side for web push).

export const FIREBASE_VAPID_KEY = 'BOWPwKVMZEKRdoPsEKm-VZNd7QMvCGFYj-NUhGqdrufuycM0t4sfteUh3MJPPS5AdvIAqXs-tsNte7mcn7hpOqE'

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
