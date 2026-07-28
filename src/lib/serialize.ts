/**
 * Firestore Timestamp Serialization Utility
 *
 * Converts Firestore Timestamp objects to ISO date strings for JSON responses.
 * This ensures frontend compatibility — the old Prisma responses used ISO strings.
 */

import { Timestamp } from 'firebase-admin/firestore'

/**
 * Recursively convert all Firestore Timestamps in an object to ISO date strings.
 */
export function serializeFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Timestamp) return obj.toDate().toISOString()
  if (Array.isArray(obj)) return obj.map(serializeFirestore)
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeFirestore(value)
    }
    return result
  }
  return obj
}
