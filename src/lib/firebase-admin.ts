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
 * Initialization strategy (3-tier):
 * 1. If ENCRYPTED_PRIVATE_KEY + KEY_SECRET → decrypt, then use cert()
 * 2. If PRIVATE_KEY (plain) + (CLIENT_EMAIL or hardcoded fallback) → use cert()
 * 3. If only PROJECT_ID is set → use applicationDefault() with explicit projectId
 * 4. If nothing is set → throw a clear error
 *
 * Security approach:
 * - The private key is AES-256-GCM encrypted. The encrypted blob is safe to
 *   commit to the repo — Google cannot detect or revoke it because it's encrypted.
 * - Only the FIREBASE_ADMIN_KEY_SECRET (a 64-char hex passphrase) must be set
 *   as an environment variable in Vercel.
 * - PROJECT_ID and CLIENT_EMAIL are NOT secrets (they're already in client-side code).
 *   Hardcoded fallbacks avoid needing to set them in every environment.
 * - To re-encrypt: node scripts/encrypt-key.js
 */

import { initializeApp, getApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import crypto from 'crypto'

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

// ─── AES-256-GCM Decryption ───
// The private key is encrypted using AES-256-GCM. The encrypted blob
// consists of: IV (16 bytes) + Auth Tag (16 bytes) + Ciphertext.
// The decryption key is derived from the secret using SHA-256.

function decryptPrivateKey(encryptedBlob: string, secret: string): string | null {
  try {
    // Derive 32-byte key from the secret using SHA-256
    const key = crypto.createHash('sha256').update(secret).digest()

    // Decode the base64 blob
    const blob = Buffer.from(encryptedBlob, 'base64')

    // Extract IV (first 16 bytes), Auth Tag (next 16 bytes), Ciphertext (rest)
    const iv = blob.subarray(0, 16)
    const authTag = blob.subarray(16, 32)
    const ciphertext = blob.subarray(32)

    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, undefined, 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (err: any) {
    console.error('[Firebase Admin] Decryption failed:', err.message)
    return null
  }
}

function getAdminApp(): FirebaseAdminApp | null {
  if (adminApp) return adminApp

  // Resolve credentials with hardcoded fallbacks for non-secret values
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || HARDCODED_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || HARDCODED_CLIENT_EMAIL

  if (getApps().length > 0) {
    adminApp = getApp()
    return adminApp
  }

  // Strategy 1: Encrypted private key (preferred — safe to commit)
  const encryptedKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED
  const keySecret = process.env.FIREBASE_ADMIN_KEY_SECRET

  if (encryptedKey && keySecret) {
    try {
      const privateKey = decryptPrivateKey(encryptedKey, keySecret)
      if (privateKey) {
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
    } catch (err: any) {
      initError = `cert() with encrypted key failed: ${err.message}. Check FIREBASE_ADMIN_KEY_SECRET and FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED.`
      console.error('[Firebase Admin] Encrypted key initialization failed:', err.message)
    }
  }

  // Strategy 2: Plain private key (legacy — for Vercel env vars without encryption)
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

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

  // Strategy 3: Application Default Credentials with explicit projectId
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
    initError = `applicationDefault() failed: ${err.message}. Set FIREBASE_ADMIN_KEY_SECRET and FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED env vars.`
  }

  // No credentials available
  initError = 'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_KEY_SECRET + FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED (encrypted) or FIREBASE_ADMIN_PRIVATE_KEY (plain) as environment variables. PROJECT_ID and CLIENT_EMAIL have hardcoded fallbacks.'
  return null
}

/**
 * Get the last initialization error (for diagnostics).
 * Returns null if initialization was successful.
 */
export function getAdminInitError(): string | null {
  return initError
}

// ─── Lazy getters (initialize on first use) ───

export function getAdminAuth(): FirebaseAdminAuth | null {
  if (!adminAuth) {
    const app = getAdminApp()
    if (!app) return null
    adminAuth = getAuth(app)
  }
  return adminAuth
}

export function getAdminFirestore(): FirebaseAdminFirestore | null {
  if (!adminFirestore) {
    const app = getAdminApp()
    if (!app) return null
    adminFirestore = getFirestore(app)
    adminFirestore.settings({ ignoreUndefinedProperties: true })
  }
  return adminFirestore
}

export function getAdminMessaging(): FirebaseAdminMessaging | null {
  if (!adminMessaging) {
    const app = getAdminApp()
    if (!app) return null
    adminMessaging = getMessaging(app)
  }
  return adminMessaging
}
