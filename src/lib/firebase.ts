/**
 * Firebase Configuration for Carsai Mozambique
 *
 * Compatible with Capacitor mobile builds using the Firebase JS SDK.
 * All Firebase services are lazily initialized on the client side only.
 * During SSR or static export build, Firebase is not initialized.
 *
 * NOTE: Firebase Crashlytics is NOT available in the Firebase JS SDK for web.
 * For native Android/iOS crash reporting via Capacitor, install:
 *   npm install @capacitor-firebase/crashlytics
 * See: https://capacitorfirebase.com/docs/crashlytics
 *
 * For now, a lightweight error reporting stub is provided that logs
 * errors to the console. This can be replaced with the Capacitor plugin
 * when native crashlytics support is needed.
 */

import { initializeApp, type FirebaseApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getPerformance, type FirebasePerformance } from 'firebase/performance';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton instances
let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let performance: FirebasePerformance | null = null;

/**
 * Check if Firebase should be initialized.
 * Only initializes on the client side with valid configuration.
 */
function shouldInitializeFirebase(): boolean {
  if (typeof window === 'undefined') return false;
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === '') return false;
  if (!firebaseConfig.projectId || firebaseConfig.projectId === '') return false;
  return true;
}

/**
 * Initialize the Firebase app instance.
 * Returns null if Firebase should not be initialized (SSR or missing config).
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!shouldInitializeFirebase()) return null;

  if (!app) {
    // Use existing app if already initialized (hot reload protection)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }

  return app;
}

/**
 * Initialize and return Firebase Analytics.
 * Analytics is only available in browser environments.
 * Returns null if not available or not supported.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!shouldInitializeFirebase()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!analytics) {
    try {
      const supported = await isSupported();
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    } catch (error) {
      console.warn('[Firebase] Analytics initialization failed:', error);
    }
  }

  return analytics;
}

/**
 * Initialize and return Firebase Performance Monitoring.
 * Returns null if not available.
 */
export function getFirebasePerformance(): FirebasePerformance | null {
  if (!shouldInitializeFirebase()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!performance) {
    try {
      performance = getPerformance(firebaseApp);
    } catch (error) {
      console.warn('[Firebase] Performance initialization failed:', error);
    }
  }

  return performance;
}

/**
 * Lightweight error reporting stub for Crashlytics-compatible error tracking.
 *
 * Firebase Crashlytics is not available in the Firebase JS SDK for web.
 * This stub provides basic error logging that can be upgraded to
 * @capacitor-firebase/crashlytics when native mobile support is needed.
 *
 * To enable native Crashlytics via Capacitor:
 * 1. Install: bun add @capacitor-firebase/crashlytics
 * 2. Replace this stub with the Capacitor plugin calls
 * 3. Configure Crashlytics in the Android/iOS native projects
 */
interface CrashlyticsStub {
  recordError: (error: Error | unknown) => void;
  setUserId: (userId: string) => void;
  setCustomKey: (key: string, value: string | number | boolean) => void;
  log: (message: string) => void;
  sendUnsentReports: () => void;
}

let crashlyticsStub: CrashlyticsStub | null = null;

export function getFirebaseCrashlytics(): CrashlyticsStub | null {
  if (!shouldInitializeFirebase()) return null;

  if (!crashlyticsStub) {
    crashlyticsStub = {
      recordError: (error: Error | unknown) => {
        console.error('[Firebase Crashlytics Stub] Error recorded:', error);
        // TODO: Replace with @capacitor-firebase/crashlytics.recordError()
      },
      setUserId: (userId: string) => {
        console.info('[Firebase Crashlytics Stub] User ID set:', userId);
        // TODO: Replace with @capacitor-firebase/crashlytics.setUserId()
      },
      setCustomKey: (key: string, value: string | number | boolean) => {
        console.info(`[Firebase Crashlytics Stub] Custom key set: ${key}=${value}`);
        // TODO: Replace with @capacitor-firebase/crashlytics.setCustomKey()
      },
      log: (message: string) => {
        console.info(`[Firebase Crashlytics Stub] Log: ${message}`);
        // TODO: Replace with @capacitor-firebase/crashlytics.log()
      },
      sendUnsentReports: () => {
        console.info('[Firebase Crashlytics Stub] Sending unsent reports (no-op on web)');
        // TODO: Replace with @capacitor-firebase/crashlytics.sendUnsentReports()
      },
    };
  }

  return crashlyticsStub;
}

/**
 * Initialize all Firebase services at once.
 * Call this once in your app's entry point (e.g., in a useEffect or layout).
 * Returns an object with all initialized services.
 */
export async function initializeFirebase(): Promise<{
  app: FirebaseApp | null;
  analytics: Analytics | null;
  performance: FirebasePerformance | null;
  crashlytics: CrashlyticsStub | null;
}> {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return { app: null, analytics: null, performance: null, crashlytics: null };
  }

  const [analyticsInstance] = await Promise.all([
    getFirebaseAnalytics(),
    Promise.resolve(getFirebasePerformance()),
    Promise.resolve(getFirebaseCrashlytics()),
  ]);

  return {
    app: firebaseApp,
    analytics: analyticsInstance,
    performance,
    crashlytics: crashlyticsStub,
  };
}

/**
 * Check if Firebase is properly configured and available.
 */
export function isFirebaseAvailable(): boolean {
  return shouldInitializeFirebase();
}

// Export config for debugging purposes
export { firebaseConfig };
