/**
 * Carsai Mozambique — Firestore Database Service
 *
 * Replaces the Prisma db.ts module with Firestore operations.
 * All CRUD operations use Firebase Admin Firestore SDK.
 *
 * Firestore is a NoSQL database — collections hold documents.
 * Each document has an auto-generated ID (similar to cuid() in Prisma).
 *
 * Collection structure mirrors the original Prisma schema:
 * - users/{uid}
 * - roles/{id}
 * - permissions/{id}
 * - role_permissions/{id}
 * - services/{id}
 * - projects/{id}
 * - testimonials/{id}
 * - posts/{id}
 * - categories/{id}
 * - tags/{id}
 * - post_tags/{id}
 * - comments/{id}
 * - subscribers/{id}
 * - forum_categories/{id}
 * - forum_topics/{id}
 * - forum_posts/{id}
 * - forum_likes/{id}
 * - quotes/{id}
 * - proposals/{id}
 * - payments/{id}
 * - invoices/{id}
 * - invoice_items/{id}
 * - affiliate_clicks/{id}
 * - affiliate_commissions/{id}
 * - notifications/{id}
 * - support_tickets/{id}
 * - ticket_replies/{id}
 * - file_attachments/{id}
 * - settings/{key}          ← key is the document ID
 * - ai_providers/{id}
 * - logs/{id}
 * - pages/{id}
 */

import { getAdminFirestore } from '@/lib/firebase-admin'
import {
  Firestore,
  CollectionReference,
  Query,
  WhereFilterOp,
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore'

// ─── Firestore instance ───

let db: Firestore | undefined = undefined

export function getDb(): Firestore {
  if (!db) {
    const firestore = getAdminFirestore()
    if (!firestore) throw new Error('Firebase Admin Firestore not configured')
    db = firestore
  }
  return db
}

// ─── Timestamp helpers ───

export const now = () => FieldValue.serverTimestamp()
export const increment = (n: number) => FieldValue.increment(n)

// ─── Collection references ───

export function collection(name: string): CollectionReference {
  return getDb().collection(name)
}

// ─── Generic CRUD operations ───

/**
 * Create a document with auto-generated ID.
 */
export async function createDoc(
  collectionName: string,
  data: Record<string, any>
): Promise<string> {
  const ref = getDb().collection(collectionName).doc()
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(docData)
  return ref.id
}

/**
 * Create a document with a specific ID.
 */
export async function createDocWithId(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<string> {
  const ref = getDb().collection(collectionName).doc(id)
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(docData)
  return id
}

/**
 * Get a document by ID.
 */
export async function getDoc<T = Record<string, any>>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const snap = await getDb().collection(collectionName).doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() } as T
}

/**
 * Update a document by ID.
 */
export async function updateDoc(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const updateData = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  }
  await getDb().collection(collectionName).doc(id).update(updateData)
}

/**
 * Upsert a document by ID — creates if missing, merges if exists.
 * Uses Firestore set() with { merge: true } which:
 * - Creates the document with all fields + timestamps if it doesn't exist
 * - Only updates the specified fields (preserving existing) if it does exist
 * - Always updates updatedAt
 *
 * This is the "auto-create" pattern: any missing fields or documents
 * are silently created without overwriting existing data.
 */
export async function upsertDoc(
  collectionName: string,
  id: string,
  data: Record<string, any>
): Promise<void> {
  const ref = getDb().collection(collectionName).doc(id)
  const docData = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(docData, { merge: true })
}

/**
 * Ensure a document field exists — if the field is missing or null,
 * set it to the provided default value. Non-destructive; never overwrites
 * existing non-null values.
 *
 * This is the "auto-create missing fields" pattern.
 */
export async function ensureDocField(
  collectionName: string,
  id: string,
  field: string,
  defaultValue: any
): Promise<void> {
  const snap = await getDb().collection(collectionName).doc(id).get()
  if (!snap.exists) {
    // Document doesn't exist — create it with just this field
    await getDb().collection(collectionName).doc(id).set({
      [field]: defaultValue,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return
  }
  const data = snap.data()
  if (data && (data[field] === undefined || data[field] === null)) {
    // Field is missing or null — set it
    await getDb().collection(collectionName).doc(id).update({
      [field]: defaultValue,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

/**
 * Delete a document by ID.
 */
export async function deleteDoc(
  collectionName: string,
  id: string
): Promise<void> {
  await getDb().collection(collectionName).doc(id).delete()
}

/**
 * Get all documents in a collection.
 */
export async function getDocs<T = Record<string, any>>(
  collectionName: string
): Promise<T[]> {
  const snap = await getDb().collection(collectionName).get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

/**
 * Query documents with filters.
 */
export async function queryDocs<T = Record<string, any>>(
  collectionName: string,
  filters: Array<{ field: string; op: WhereFilterOp; value: any }>,
  orderBy?: string,
  orderDir?: 'asc' | 'desc',
  limit?: number
): Promise<T[]> {
  let q: Query = getDb().collection(collectionName)

  for (const f of filters) {
    q = q.where(f.field, f.op, f.value)
  }

  if (orderBy) {
    q = q.orderBy(orderBy, orderDir || 'asc')
  }

  if (limit) {
    q = q.limit(limit)
  }

  const snap = await q.get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T))
}

/**
 * Get a single document matching a query.
 */
export async function getDocByField<T = Record<string, any>>(
  collectionName: string,
  field: string,
  value: any
): Promise<T | null> {
  const snap = await getDb().collection(collectionName)
    .where(field, '==', value)
    .limit(1)
    .get()

  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as T
}

/**
 * Count documents in a collection (with optional filters).
 * Note: Firestore doesn't have a native count on Spark plan.
 * This fetches all matching docs and counts them — use sparingly.
 */
export async function countDocs(
  collectionName: string,
  filters?: Array<{ field: string; op: WhereFilterOp; value: any }>
): Promise<number> {
  let q: Query = getDb().collection(collectionName)

  if (filters) {
    for (const f of filters) {
      q = q.where(f.field, f.op, f.value)
    }
  }

  const snap = await q.select('__name__').get()
  return snap.size
}

/**
 * Create multiple documents in a batch.
 */
export async function createMany(
  collectionName: string,
  dataArray: Array<Record<string, any>>
): Promise<string[]> {
  const batch = getDb().batch()
  const ids: string[] = []

  for (const data of dataArray) {
    const ref = getDb().collection(collectionName).doc()
    ids.push(ref.id)
    batch.set(ref, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  return ids
}

/**
 * Delete all documents in a collection matching filters.
 */
export async function deleteMany(
  collectionName: string,
  filters?: Array<{ field: string; op: WhereFilterOp; value: any }>
): Promise<number> {
  let q: Query = getDb().collection(collectionName)

  if (filters) {
    for (const f of filters) {
      q = q.where(f.field, f.op, f.value)
    }
  }

  const snap = await q.select('__name__').get()
  const batch = getDb().batch()

  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()

  return snap.size
}

// ─── Firestore Timestamp conversion helpers ───

export function timestampToDate(ts: Timestamp | undefined): Date | null {
  if (!ts) return null
  return ts.toDate()
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}
