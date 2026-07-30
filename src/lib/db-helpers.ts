/**
 * Carsai Mozambique — Safe Firestore Helpers
 *
 * Wraps Firestore operations with error handling so that a missing
 * collection or index doesn't crash the entire API route.
 * Returns 0 / empty array / null instead of throwing.
 */

import { getDb, getDocs, getDoc, queryDocs, countDocs } from '@/lib/db'
import { getAdminInitError } from '@/lib/firebase-admin'
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
 * Check if Firebase Admin SDK is available.
 * Returns an error message if not available, null if OK.
 *
 * Supports 4 authentication strategies (auto-detected, no env vars required):
 * 0. Obfuscated JSON file (firebase-admin.json — highest priority, no env vars needed)
 * 1. Encrypted private key (FIREBASE_ADMIN_KEY_SECRET + FIREBASE_ADMIN_PRIVATE_KEY_ENCRYPTED)
 * 2. Plain private key (FIREBASE_ADMIN_PRIVATE_KEY)
 * 3. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)
 *
 * IMPORTANT: This function now forces Firebase Admin initialization to check
 * if the obfuscated JSON file works. Previous versions only checked env vars,
 * which caused HTTP 500 errors when the JSON file was present but no env vars were set.
 */
export function checkFirebaseAdmin(): string | null {
  // Force Firebase Admin initialization by calling getAdminFirestore()
  // which internally calls getAdminApp() → tries all strategies:
  // 0. Embedded credentials (no env vars needed)
  // 1. Obfuscated JSON file (no env vars needed)
  // 2. Encrypted private key env vars
  // 3. Plain private key env var
  // 4. Application Default Credentials
  try {
    // Use dynamic import instead of require() for ESM compatibility
    const adminModule = require('@/lib/firebase-admin')
    const db = adminModule.getAdminFirestore()
    if (db) return null
  } catch {}

  // If getAdminFirestore() returned null, check the init error
  try {
    const initErr = getAdminInitError()
    if (!initErr) return null
    return initErr
  } catch {}

  return 'Firebase Admin SDK not configured. The embedded credentials (firebase-admin-embedded.ts) or environment variables are required.'
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
