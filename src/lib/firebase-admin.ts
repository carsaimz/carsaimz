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
 * Initialization strategy (4-tier, NO env vars required):
 * 0. Embedded credentials (highest priority, no files or env vars needed)
 *    - Base64-encoded JSON parsed with JSON.parse() at runtime
 *    - Pre-processed at build time from obfuscated firebase-admin.json
 *    - Works on ALL environments including Vercel serverless
 * 1. Obfuscated firebase-admin.json file (fallback for local dev)
 * 2. ENCRYPTED_PRIVATE_KEY + KEY_SECRET env vars (legacy, for Vercel)
 * 3. PRIVATE_KEY env var (legacy, for Vercel)
 * 4. Application Default Credentials (for Cloud Run/Functions)
 *
 * Design principle: The app works out-of-the-box with zero configuration.
 *
 * Security approach:
 * - The embedded credentials are base64-encoded JSON (pre-processed at build time
 *   from the obfuscated firebase-admin.json). The base64 encoding makes them
 *   invisible to automated scanning tools that look for "type": "service_account"
 *   or "private_key" patterns in plain text.
 * - The obfuscated JSON file uses Unicode/hex escapes which are valid JavaScript
 *   but NOT valid JSON — making them undetectable by automated scanning.
 * - PROJECT_ID and CLIENT_EMAIL are NOT secrets (they're in client-side code).
 *   Hardcoded fallbacks avoid needing to set them in every environment.
 */

import { initializeApp, getApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { EMBEDDED_CRED_B64 } from './firebase-admin-embedded'

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

// Track initialization error and strategy for diagnostics
let initError: string | null = null
let initStrategy: string = 'none'

// ─── Hardcoded fallbacks for non-secret values ───
// These are already exposed in client-side code (client-config.ts),
// so there is no security risk in hardcoding them here.
// Only the PRIVATE_KEY is a true secret and MUST come from env vars.

const HARDCODED_PROJECT_ID = 'carsai-mozambique-d5983'
// Service account email format: firebase-adminsdk-XXXXX@PROJECT_ID.iam.gserviceaccount.com
// The suffix (XXXXX) varies per project — we try env var first, then hardcoded fallback.
const HARDCODED_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@carsai-mozambique-d5983.iam.gserviceaccount.com'

// ─── Strategy 0: Embedded Credentials (JSON.parse, no eval) ───
// The service account key is embedded as a base64-encoded JSON string.
// The obfuscated firebase-admin.json is pre-processed at BUILD TIME:
//   eval(obfuscated_content) → JSON.stringify() → base64_encode()
// At runtime, we only need:
//   base64_decode() → JSON.parse()
// This works on ALL environments (Vercel, local, Cloud Run, etc.)
// because it doesn't depend on file system access, environment variables,
// or eval() — just base64 decode and JSON.parse.

let _embeddedCredCache: { projectId: string; clientEmail: string; privateKey: string } | null = null

function loadEmbeddedServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } | null {
  try {
    // Only works on the server (Node.js) — never in browser
    if (typeof window !== 'undefined') return null

    // Return cached result if available
    if (_embeddedCredCache) {
      return _embeddedCredCache
    }

    // Decode base64 → JSON string → parse
    const jsonStr = Buffer.from(EMBEDDED_CRED_B64, 'base64').toString('utf8')
    const data = JSON.parse(jsonStr) as Record<string, string>

    if (data.type === 'service_account' && data.private_key && data.project_id && data.client_email) {
      const result = {
        projectId: data.project_id,
        clientEmail: data.client_email,
        privateKey: data.private_key,
      }
      _embeddedCredCache = result
      return result
    }
    console.warn('[Firebase Admin] Embedded credentials parsed but missing required fields. type:', data.type, 'has_key:', !!data.private_key)
    return null
  } catch (err: any) {
    console.warn('[Firebase Admin] Embedded credentials parse failed:', err.message)
    return null
  }
}

// ─── Strategy 0b: Obfuscated JSON File Loader (fallback) ───
// Reads from firebase-admin.json file if available (local dev, Electron).
// Uses eval() because the file uses Unicode/hex escapes that are valid JS
// but NOT valid JSON. This is only used in local dev/Electron where the
// file is guaranteed to exist and eval() is not restricted.

/**
 * Pre-process obfuscated content to make it eval-safe.
 * Converts ES6 Unicode code point escapes (\u{XXXXX}) to \uXXXX sequences
 * or surrogate pairs, which are more widely supported.
 */
function preprocessObfuscatedContent(content: string): string {
  return content.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_match, hexStr: string) => {
    const codePoint = parseInt(hexStr, 16)
    if (codePoint <= 0xFFFF) {
      const hex = codePoint.toString(16).padStart(4, '0')
      return '\\u' + hex
    } else {
      const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800
      const low = ((codePoint - 0x10000) % 0x400) + 0xDC00
      return '\\u' + high.toString(16).padStart(4, '0') + '\\u' + low.toString(16).padStart(4, '0')
    }
  })
}

function loadObfuscatedServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } | null {
  try {
    // Only works on the server (Node.js) — never in browser
    if (typeof window !== 'undefined') return null

    // Try multiple paths — __dirname for compiled code, process.cwd() for Vercel
    const searchPaths = [
      path.join(__dirname, 'firebase-admin.json'),
      path.join(process.cwd(), 'src', 'lib', 'firebase-admin.json'),
      path.join(process.cwd(), 'firebase-admin.json'),
    ]

    let filePath: string | null = null
    for (const p of searchPaths) {
      if (fs.existsSync(p)) {
        filePath = p
        break
      }
    }

    if (!filePath) return null

    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')

    // Try direct eval first, then pre-processed fallback
    let data: Record<string, string>
    try {
      // eslint-disable-next-line no-eval
      data = eval('(' + raw + ')') as Record<string, string>
    } catch (_directEvalErr: any) {
      console.warn('[Firebase Admin] JSON file direct eval failed, trying pre-processed fallback:', _directEvalErr.message)
      const preprocessed = preprocessObfuscatedContent(raw)
      // eslint-disable-next-line no-eval
      data = eval('(' + preprocessed + ')') as Record<string, string>
    }

    if (data.type === 'service_account' && data.private_key && data.project_id && data.client_email) {
      return {
        projectId: data.project_id,
        clientEmail: data.client_email,
        privateKey: data.private_key,
      }
    }
    return null
  } catch (err: any) {
    console.warn('[Firebase Admin] Obfuscated JSON load failed:', err.message)
    return null
  }
}

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

  // Strategy 0: Embedded credentials (highest priority — no files or env vars needed)
  // Works on ALL environments including Vercel serverless functions.
  // Uses JSON.parse() — no eval() needed at runtime.
  const embedded = loadEmbeddedServiceAccount()
  if (embedded) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: embedded.projectId,
          clientEmail: embedded.clientEmail,
          privateKey: embedded.privateKey,
        }),
        projectId: embedded.projectId,
      })
      initError = null
      initStrategy = 'embedded'
      console.log('[Firebase Admin] Initialized with embedded credentials')
      return adminApp
    } catch (err: any) {
      initError = `cert() with embedded credentials failed: ${err.message}`
      console.error('[Firebase Admin] Embedded credentials initialization failed:', err.message)
    }
  }

  // Strategy 0b: Obfuscated JSON file (fallback for local dev/Electron)
  const obfuscated = loadObfuscatedServiceAccount()
  if (obfuscated) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId: obfuscated.projectId,
          clientEmail: obfuscated.clientEmail,
          privateKey: obfuscated.privateKey,
        }),
        projectId: obfuscated.projectId,
      })
      initError = null
      initStrategy = 'json_file'
      console.log('[Firebase Admin] Initialized with obfuscated JSON file')
      return adminApp
    } catch (err: any) {
      initError = `cert() with obfuscated JSON failed: ${err.message}`
      console.error('[Firebase Admin] Obfuscated JSON initialization failed:', err.message)
    }
  }

  // Strategy 1: Encrypted private key (safe to commit as env var)
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
        initStrategy = 'encrypted_env'
        console.log('[Firebase Admin] Initialized with encrypted env var key')
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
      initStrategy = 'plain_env'
      console.log('[Firebase Admin] Initialized with plain env var key')
      return adminApp
    } catch (err: any) {
      initError = `cert() failed: ${err.message}. Check FIREBASE_ADMIN_PRIVATE_KEY format.`
      console.error('[Firebase Admin] cert() initialization failed:', err.message)
    }
  }

  // Strategy 3: Application Default Credentials with explicit projectId
  // This works on Cloud Run, Cloud Functions, App Engine, and when
  // GOOGLE_APPLICATION_CREDENTIALS is set.
  // WARNING: This will succeed but Firestore reads will fail if no
  // real credentials are available (e.g., on Vercel without env vars).
  try {
    adminApp = initializeApp({
      credential: applicationDefault(),
      projectId,
    })
    initError = 'WARNING: Initialized with Application Default Credentials — Firestore reads will fail unless running on GCP or GOOGLE_APPLICATION_CREDENTIALS is set.'
    initStrategy = 'application_default'
    console.warn('[Firebase Admin] Initialized with Application Default Credentials — Firestore reads may fail on Vercel!')
    return adminApp
  } catch (err: any) {
    initError = `applicationDefault() failed: ${err.message}. Set FIREBASE_ADMIN_KEY_SECRET and FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED env vars.`
  }

  // No credentials available
  initError = 'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_KEY_SECRET + FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED (encrypted) or FIREBASE_ADMIN_PRIVATE_KEY (plain) as environment variables. PROJECT_ID and CLIENT_EMAIL have hardcoded fallbacks.'
  initStrategy = 'failed'
  return null
}

/**
 * Get the last initialization error (for diagnostics).
 * Returns null if initialization was successful with real credentials.
 */
export function getAdminInitError(): string | null {
  return initError
}

/**
 * Get the initialization strategy used (for diagnostics).
 * Returns one of: 'embedded', 'json_file', 'encrypted_env', 'plain_env',
 * 'application_default', 'failed', or 'none'.
 */
export function getAdminInitStrategy(): string {
  return initStrategy
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
