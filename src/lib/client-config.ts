/**
 * Carsai Mozambique — Client-Side Configuration
 *
 * Holds only values that are safe to expose in browser code.
 * ALL values are hardcoded — no env vars or external URLs needed.
 *
 * Design principle: The app works out-of-the-box with zero configuration.
 * No secrets, no env vars, no external API URLs required.
 * - Firebase client config: hardcoded (public by design, safe in client bundle)
 * - Firebase Admin: uses obfuscated JSON file (firebase-admin.json)
 * - API calls: use relative paths (same server), no external URL needed
 * - Capacitor: uses the site URL only when running as a native app
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

export const APP_VERSION = '1.0.0'
export const APP_BUILD = '1'

// ─── API base URL ───
// On web (Next.js server mode) and Electron, relative paths like /api/... work natively.
// For Capacitor mobile app (static export), the deployment URL is used as fallback.
// No NEXT_PUBLIC_API_URL env var needed — the hardcoded value works out of the box.

export const API_BASE_URL = ''  // Empty = relative paths (same server)

// ─── Google Sign-In Web OAuth Client ID ───
// Required for Google Sign-In on Android via @capacitor-firebase/authentication.

export const GOOGLE_WEB_CLIENT_ID = '117955101988984767727.apps.googleusercontent.com'

// ─── Site URLs ───
// Used for affiliate links, sharing, API calls from Capacitor, etc.
// SITE_URL: the actual working deployment URL (Capacitor API calls go here)
// APP_PUBLIC_URL: used for affiliate links and sharing
// TODO: When carsai.mz domain is purchased, update both to 'https://carsai.mz'

export const SITE_URL = 'https://carsaimz.vercel.app'
export const APP_PUBLIC_URL = 'https://carsaimz.vercel.app'  // Used for affiliate links
export const GITHUB_URL = 'https://github.com/carsaimz'

// ─── Firebase Config (client-side — hardcoded, no env vars needed) ───
// These values are public by design — they end up in the client bundle.
// No secrets here. Firebase client config is not sensitive.

export const FIREBASE_CONFIG = {
  apiKey:             'AIzaSyBAqWCPbR_ExDUYSH__1CvFZ7ONo2JZXKU',
  authDomain:         'carsaimz.vercel.app',
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
