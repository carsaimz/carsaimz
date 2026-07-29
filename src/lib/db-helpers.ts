/**
 * Carsai Mozambique — Safe Firestore Helpers
 *
 * Wraps Firestore operations with error handling so that a missing
 * collection or index doesn't crash the entire API route.
 * Returns 0 / empty array / null instead of throwing.
 */

import { getDb, getDocs, getDoc, queryDocs, countDocs } from '@/lib/db'
import { WhereFilterOp } from 'firebase-admin/firestore'

/**
 * Safe count — returns 0 if the collection doesn't exist or query fails.
 */
export async function safeCountDocs(
  collectionName: string,
  filters?: Array<{ field: string; op: WhereFilterOp; value: any }>
): Promise<number> {
  try {
    return await countDocs(collectionName, filters)
  } catch {
    return 0
  }
}

/**
 * Safe getDocs — returns empty array if the collection doesn't exist or query fails.
 */
export async function safeGetDocs<T = Record<string, any>>(
  collectionName: string
): Promise<T[]> {
  try {
    return await getDocs<T>(collectionName)
  } catch {
    return []
  }
}

/**
 * Safe getDoc — returns null if the document doesn't exist or query fails.
 */
export async function safeGetDoc<T = Record<string, any>>(
  collectionName: string,
  id: string
): Promise<T | null> {
  try {
    return await getDoc<T>(collectionName, id)
  } catch {
    return null
  }
}

/**
 * Safe queryDocs — returns empty array if the query fails.
 */
export async function safeQueryDocs<T = Record<string, any>>(
  collectionName: string,
  filters: Array<{ field: string; op: WhereFilterOp; value: any }>,
  orderBy?: string,
  orderDir?: 'asc' | 'desc',
  limit?: number
): Promise<T[]> {
  try {
    return await queryDocs<T>(collectionName, filters, orderBy, orderDir, limit)
  } catch {
    return []
  }
}

/**
 * Check if Firebase Admin SDK is available (env vars configured).
 * Returns an error message if not available, null if OK.
 *
 * Supports 3 authentication strategies:
 * 1. Encrypted private key (FIREBASE_ADMIN_KEY_SECRET + FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED)
 * 2. Plain private key (FIREBASE_ADMIN_PRIVATE_KEY)
 * 3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
 */
export function checkFirebaseAdmin(): string | null {
  const encryptedKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED
  const keySecret = process.env.FIREBASE_ADMIN_KEY_SECRET
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS

  // Strategy 1: Encrypted private key (preferred)
  if (encryptedKey && keySecret) {
    return null
  }

  // Strategy 2: Plain private key (legacy)
  if (privateKey) {
    return null
  }

  // Strategy 3: Application Default Credentials
  if (googleAppCreds) {
    return null
  }

  // Try to use the actual Firebase Admin init — if it's already initialized, it's fine
  try {
    const { getAdminInitError } = require('@/lib/firebase-admin')
    const initErr = getAdminInitError()
    if (!initErr) return null
    return initErr
  } catch {}

  return 'Firebase Admin SDK not configured. Set FIREBASE_ADMIN_KEY_SECRET + FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED (encrypted) or FIREBASE_ADMIN_PRIVATE_KEY (plain) as environment variables. PROJECT_ID and CLIENT_EMAIL have hardcoded fallbacks.'
}

/**
 * Check if Firestore is reachable by trying a simple operation.
 * Returns true if Firestore is working, false if not.
 */
export async function isFirestoreAvailable(): Promise<boolean> {
  try {
    const db = getDb()
    // Try a lightweight read — just check if we can access the users collection
    await db.collection('users').limit(1).get()
    return true
  } catch {
    return false
  }
}
