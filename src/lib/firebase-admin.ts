/**
 * Carsai Mozambique — Firebase Admin SDK (Server-Side)
 *
 * Used exclusively in API routes (Next.js server-side code).
 * NEVER import this in client/browser code.
 *
 * Firebase Admin v14 uses modular imports:
 * - firebase-admin/app (initializeApp, cert, applicationDefault, getApp, getApps)
 * - firebase-admin/auth (getAuth)
 * - firebase-admin/firestore (getFirestore)
 * - firebase-admin/messaging (getMessaging)
 *
 * Initialization strategy:
 * 1. If PRIVATE_KEY + (CLIENT_EMAIL or hardcoded fallback) → use cert()
 * 2. If only PROJECT_ID is set → use applicationDefault() with explicit projectId
 * 3. If nothing is set → throw a clear error
 *
 * Security approach:
 * - PROJECT_ID and CLIENT_EMAIL are NOT secrets (they're already in client-side code).
 *   Hardcoded fallbacks avoid needing to set them in every environment.
 * - PRIVATE_KEY is the ONLY true secret. It MUST be set as an environment variable
 *   (either in Vercel dashboard or via GitHub Actions → Vercel CLI deploy).
 *   NEVER put the private key in source code — Google will revoke it.
 */

import { initializeApp, getApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

// ─── Firebase Admin types (imported for type annotations only) ───

import type { App as FirebaseAdminApp } from 'firebase-admin/app'
import type { Auth as FirebaseAdminAuth } from 'firebase-admin/auth'
import type { Firestore as FirebaseAdminFirestore } from 'firebase-admin/firestore'
import type { Messaging as FirebaseAdminMessaging } from 'firebase-admin/messaging'

// ─── Firebase Admin singleton ───

let adminApp: FirebaseAdminApp | null = null
let adminAuth: FirebaseAdminAuth | null = null
let adminFirestore: FirebaseAdminFirestore | null = null
let adminMessaging: FirebaseAdminMessaging | null = null

// Track initialization error for diagnostics
let initError: string | null = null

// ─── Hardcoded fallbacks for non-secret values ───
// These are already exposed in client-side code (client-config.ts),
// so there is no security risk in hardcoding them here.
// Only the PRIVATE_KEY is a true secret and MUST come from env vars.

const HARDCODED_PROJECT_ID = 'carsai-mozambique-d5983'
// Service account email format: firebase-adminsdk-XXXXX@PROJECT_ID.iam.gserviceaccount.com
// The suffix (XXXXX) varies per project — we try env var first, then hardcoded fallback.
const HARDCODED_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@carsai-mozambique-d5983.iam.gserviceaccount.com'

function getAdminApp(): FirebaseAdminApp {
  if (adminApp) return adminApp

  // Resolve credentials with hardcoded fallbacks for non-secret values
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || HARDCODED_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || HARDCODED_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (getApps().length > 0) {
    adminApp = getApp()
    return adminApp
  }

  // Strategy 1: Full service account credentials (private key is the only required secret)
  if (privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      })
      initError = null
      return adminApp
    } catch (err: any) {
      initError = `cert() failed: ${err.message}. Check FIREBASE_ADMIN_PRIVATE_KEY format.`
      console.error('[Firebase Admin] cert() initialization failed:', err.message)
    }
  }

  // Strategy 2: Application Default Credentials with explicit projectId
  // This works on Cloud Run, Cloud Functions, App Engine, and when
  // GOOGLE_APPLICATION_CREDENTIALS is set.
  try {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    })
    initError = null
    return adminApp
  } catch (err: any) {
    initError = `applicationDefault() failed: ${err.message}. Set FIREBASE_ADMIN_PRIVATE_KEY env var to use cert() instead.`
  }

  // No credentials available
  initError = 'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_PRIVATE_KEY as an environment variable (Vercel dashboard or GitHub Secrets). PROJECT_ID and CLIENT_EMAIL have hardcoded fallbacks.'
  throw new Error(initError)
}

/**
 * Get the last initialization error (for diagnostics).
 * Returns null if initialization was successful.
 */
export function getAdminInitError(): string | null {
  return initError
}

// ─── Lazy getters (initialize on first use) ───

export function getAdminAuth(): FirebaseAdminAuth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp())
  }
  return adminAuth!
}

export function getAdminFirestore(): FirebaseAdminFirestore {
  if (!adminFirestore) {
    adminFirestore = getFirestore(getAdminApp())
    adminFirestore.settings({ ignoreUndefinedProperties: true })
  }
  return adminFirestore!
}

export function getAdminMessaging(): FirebaseAdminMessaging {
  if (!adminMessaging) {
    adminMessaging = getMessaging(getAdminApp())
  }
  return adminMessaging!
}
