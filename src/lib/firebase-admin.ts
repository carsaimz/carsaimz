/**
 * Carsai Mozambique — Firebase Admin SDK (Server-Side)
 *
 * Used exclusively in API routes (Next.js server-side code).
 * NEVER import this in client/browser code.
 *
 * Firebase Admin v14 uses modular imports:
 * - firebase-admin/app (initializeApp, cert, getApp, getApps)
 * - firebase-admin/auth (getAuth)
 * - firebase-admin/firestore (getFirestore)
 * - firebase-admin/messaging (getMessaging)
 */

import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app'
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

function getAdminApp(): FirebaseAdminApp {
  if (adminApp) return adminApp

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY as environment variables (GitHub Secrets for CI, .env.local for local dev)'
    )
  }

  if (getApps().length > 0) {
    adminApp = getApp()
  } else {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    })
  }

  return adminApp
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
