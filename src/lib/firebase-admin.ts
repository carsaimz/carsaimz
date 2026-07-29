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
 * 1. If FIREBASE_ADMIN_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY are all set → use cert()
 * 2. If only FIREBASE_ADMIN_PROJECT_ID is set → use applicationDefault() with explicit projectId
 * 3. If nothing is set → throw a clear error
 *
 * The applicationDefault() credential uses Google Application Default Credentials (ADC),
 * which works on Cloud Run, Cloud Functions, App Engine, and any environment where
 * GOOGLE_APPLICATION_CREDENTIALS points to a service account key file.
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

function getAdminApp(): FirebaseAdminApp {
  if (adminApp) return adminApp

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (getApps().length > 0) {
    adminApp = getApp()
    return adminApp
  }

  // Strategy 1: Full service account credentials
  if (projectId && clientEmail && privateKey) {
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
  }

  // Strategy 2: Application Default Credentials with explicit projectId
  // This works on Cloud Run, Cloud Functions, App Engine, and when
  // GOOGLE_APPLICATION_CREDENTIALS is set.
  if (projectId) {
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId,
      })
      initError = null
      return adminApp
    } catch (err: any) {
      initError = `applicationDefault() failed: ${err.message}. Falling back to cert() which requires FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.`
    }
  }

  // No credentials available
  initError = 'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY as environment variables.'
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
