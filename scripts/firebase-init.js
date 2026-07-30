#!/usr/bin/env node

/**
 * Carsai Mozambique — Firebase Init Script
 * 
 * Validates Firebase configuration and tests connection.
 * Run: bun run firebase:init
 * 
 * No env vars needed — uses the obfuscated JSON file (firebase-admin.json)
 * or falls back to FIREBASE_ADMIN_* env vars.
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const fs = require('fs')
const path = require('path')

// ─── Load credentials from obfuscated JSON or env vars ───

const HARDCODED_PROJECT_ID = 'carsai-mozambique-d5983'
const HARDCODED_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@carsai-mozambique-d5983.iam.gserviceaccount.com'

function loadObfuscatedServiceAccount() {
  try {
    const filePath = path.join(__dirname, '..', 'src', 'lib', 'firebase-admin.json')
    if (!fs.existsSync(filePath)) return null

    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
    // eslint-disable-next-line no-eval
    const data = eval('(' + raw + ')')

    if (data.type === 'service_account' && data.private_key && data.project_id && data.client_email) {
      return {
        projectId: data.project_id,
        clientEmail: data.client_email,
        privateKey: data.private_key,
      }
    }
    return null
  } catch (err) {
    console.warn('[Firebase Init] Obfuscated JSON load failed:', err.message)
    return null
  }
}

// Try obfuscated JSON first, then env vars
let projectId, clientEmail, privateKey

const obfuscated = loadObfuscatedServiceAccount()
if (obfuscated) {
  projectId = obfuscated.projectId
  clientEmail = obfuscated.clientEmail
  privateKey = obfuscated.privateKey
  console.log('[Firebase Init] Using obfuscated JSON file (firebase-admin.json)')
} else {
  projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || HARDCODED_PROJECT_ID
  clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || HARDCODED_CLIENT_EMAIL
  privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!privateKey) {
    console.error('[Firebase Init] ERROR: No credentials found.')
    console.error('[Firebase Init] The obfuscated JSON file (src/lib/firebase-admin.json) was not found.')
    console.error('[Firebase Init] Alternatively, set FIREBASE_ADMIN_PRIVATE_KEY in .env')
    process.exit(1)
  }
  console.log('[Firebase Init] Using env vars (FIREBASE_ADMIN_*)')
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
