#!/usr/bin/env node

/**
 * Carsai Mozambique — Firebase Init Script
 * 
 * Validates Firebase configuration and tests connection.
 * Run: bun run firebase:init
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  console.error('[Firebase Init] ERROR: Credentials not configured.')
  console.error('[Firebase Init] Set these in .env:')
  console.error('  FIREBASE_ADMIN_PROJECT_ID')
  console.error('  FIREBASE_ADMIN_CLIENT_EMAIL')
  console.error('  FIREBASE_ADMIN_PRIVATE_KEY')
  console.error('')
  console.error('[Firebase Init] Also set NEXT_PUBLIC_FIREBASE_* vars for client SDK.')
  process.exit(1)
}

console.log('[Firebase Init] Initializing Firebase Admin...')
console.log(`[Firebase Init] Project: ${projectId}`)
console.log(`[Firebase Init] Client email: ${clientEmail}`)

try {
  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  })

  const db = getFirestore(app)
  const auth = getAuth(app)

  // Test Firestore connection
  console.log('[Firebase Init] Testing Firestore connection...')
  const testDoc = await db.collection('_test').doc('connection').get()
  console.log('[Firebase Init] Firestore: Connected ✓')

  // Test Auth connection
  console.log('[Firebase Init] Testing Auth connection...')
  await auth.listUsers(1)
  console.log('[Firebase Init] Auth: Connected ✓')

  console.log('\n[Firebase Init] ============================')
  console.log('[Firebase Init] Firebase is ready!')
  console.log('[Firebase Init] Run `bun run firebase:seed` to seed the database.')
  console.log('[Firebase Init] ============================')

  // Clean up test doc
  await db.collection('_test').doc('connection').delete()

} catch (e) {
  console.error('[Firebase Init] Connection failed:', e.message)
  process.exit(1)
}
