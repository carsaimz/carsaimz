#!/usr/bin/env node

/**
 * Carsai Mozambique — Firebase/Firestore Seed Script
 * 
 * Seeds the Firestore database with essential roles, permissions,
 * users, and site settings.
 * 
 * Run: bun run firebase:seed
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

// ─── Firebase Admin init ───
// Uses obfuscated JSON file first, then env vars as fallback

const fs = require('fs')
const path = require('path')

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
      return { projectId: data.project_id, clientEmail: data.client_email, privateKey: data.private_key }
    }
    return null
  } catch (err) { return null }
}

let projectId, clientEmail, privateKey

const obfuscated = loadObfuscatedServiceAccount()
if (obfuscated) {
  projectId = obfuscated.projectId
  clientEmail = obfuscated.clientEmail
  privateKey = obfuscated.privateKey
  console.log('[Seed] Using obfuscated JSON file (firebase-admin.json)')
} else {
  projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || HARDCODED_PROJECT_ID
  clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || HARDCODED_CLIENT_EMAIL
  privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!privateKey) {
    console.error('[Seed] ERROR: No credentials found.')
    console.error('[Seed] The obfuscated JSON file (src/lib/firebase-admin.json) was not found.')
    console.error('[Seed] Alternatively, set FIREBASE_ADMIN_PRIVATE_KEY in .env')
    process.exit(1)
  }
  console.log('[Seed] Using env vars (FIREBASE_ADMIN_*)')
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
  projectId,
})

const db = getFirestore(app)
db.settings({ ignoreUndefinedProperties: true })
const auth = getAuth(app)

// ─── Helper functions ───

async function clearCollection(name) {
  const snap = await db.collection(name).select('__name__').get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
  console.log(`[Seed] Cleared ${snap.size} docs from ${name}`)
}

async function createDoc(collection, data) {
  const ref = db.collection(collection).doc()
  await ref.set({ ...data, createdAt: new Date(), updatedAt: new Date() })
  return ref.id
}

async function createDocWithId(collection, id, data) {
  const ref = db.collection(collection).doc(id)
  await ref.set({ ...data, createdAt: new Date(), updatedAt: new Date() })
  return id
}

// ─── Main seed function ───

async function seed() {
  console.log('[Seed] Starting Firebase/Firestore seeding...')

  // ── 1. Clear collections in reverse dependency order ──
  const collections = [
    'notifications', 'forum_likes', 'forum_posts', 'forum_topics', 'forum_categories',
    'post_tags', 'comments', 'posts', 'tags', 'categories',
    'subscribers', 'testimonials', 'projects', 'services',
    'invoice_items', 'invoices', 'payments', 'proposals', 'quotes',
    'affiliate_commissions', 'affiliate_clicks',
    'support_tickets', 'ticket_replies',
    'role_permissions', 'settings', 'logs', 'pages', 'file_attachments', 'ai_providers',
    'users', 'permissions', 'roles',
  ]

  for (const col of collections) {
    await clearCollection(col)
  }

  // ── 2. Create roles ──
  console.log('[Seed] Creating roles...')
  const superAdminRoleId = await createDoc('roles', {
    name: 'super_admin',
    description: 'Super administrador com acesso total e irrestrito ao sistema',
  })
  const adminRoleId = await createDoc('roles', {
    name: 'admin',
    description: 'Administrador com acesso total ao sistema',
  })
  const partnerRoleId = await createDoc('roles', {
    name: 'partner',
    description: 'Parceiro comercial com acesso a funcionalidades de gestão',
  })
  const userRoleId = await createDoc('roles', {
    name: 'user',
    description: 'Utilizador padrão com acesso básico',
  })

  // ── 3. Create permissions ──
  console.log('[Seed] Creating permissions...')
  const permissionDefs = [
    { name: 'manage_posts', description: 'Create, edit, delete blog posts' },
    { name: 'manage_pages', description: 'Create, edit, delete site pages' },
    { name: 'manage_services', description: 'Create, edit, delete services' },
    { name: 'manage_projects', description: 'Create, edit, delete projects' },
    { name: 'manage_testimonials', description: 'Create, edit, delete testimonials' },
    { name: 'manage_users', description: 'Create, edit, delete users and assign roles' },
    { name: 'view_users', description: 'View user profiles and lists' },
    { name: 'manage_quotes', description: 'Create, review, and manage quotes' },
    { name: 'manage_proposals', description: 'Create, edit, send proposals' },
    { name: 'manage_payments', description: 'Record, confirm, and manage payments' },
    { name: 'manage_invoices', description: 'Create, edit, and manage invoices' },
    { name: 'manage_forum', description: 'Moderate forum topics and replies' },
    { name: 'post_in_forum', description: 'Create forum topics and reply to posts' },
    { name: 'manage_settings', description: 'Edit site settings and configuration' },
    { name: 'view_logs', description: 'View system audit logs' },
    { name: 'manage_roles', description: 'Create, edit roles and assign permissions' },
    { name: 'manage_permissions', description: 'Create, edit, delete permissions' },
    { name: 'manage_support', description: 'Handle support tickets and replies' },
    { name: 'create_tickets', description: 'Create support tickets' },
    { name: 'manage_affiliates', description: 'Manage affiliate clicks and commissions' },
    { name: 'view_affiliates', description: 'View affiliate statistics' },
    { name: 'manage_files', description: 'Upload, edit, delete file attachments' },
    { name: 'manage_subscribers', description: 'Manage newsletter subscribers' },
  ]

  const permissions = {}
  for (const def of permissionDefs) {
    const id = await createDoc('permissions', def)
    permissions[def.name] = id
  }

  // ── 4. Role-Permission mappings ──
  console.log('[Seed] Assigning permissions to roles...')
  const allPermIds = Object.values(permissions)
  const rolePermBatch = db.batch()

  // super_admin + admin: all permissions
  for (const roleId of [superAdminRoleId, adminRoleId]) {
    for (const permId of allPermIds) {
      const ref = db.collection('role_permissions').doc()
      rolePermBatch.set(ref, { roleId, permissionId: permId, createdAt: new Date() })
    }
  }

  // partner: specific permissions
  const partnerPermNames = [
    'manage_posts', 'manage_pages', 'manage_services', 'manage_projects',
    'manage_testimonials', 'view_users', 'manage_quotes', 'manage_proposals',
    'manage_payments', 'manage_invoices', 'post_in_forum', 'create_tickets',
    'view_affiliates', 'manage_files',
  ]
  for (const permName of partnerPermNames) {
    const ref = db.collection('role_permissions').doc()
    rolePermBatch.set(ref, { roleId: partnerRoleId, permissionId: permissions[permName], createdAt: new Date() })
  }

  // user: basic permissions
  const userPermNames = ['post_in_forum', 'create_tickets', 'manage_files']
  for (const permName of userPermNames) {
    const ref = db.collection('role_permissions').doc()
    rolePermBatch.set(ref, { roleId: userRoleId, permissionId: permissions[permName], createdAt: new Date() })
  }

  await rolePermBatch.commit()

  // ── 5. Create super_admin user in Firebase Auth + Firestore ──
  console.log('[Seed] Creating super_admin user...')
  const superAdminEmail = 'carsaimozambique@gmail.com'
  let superAdminUid

  try {
    const userRecord = await auth.createUser({
      email: superAdminEmail,
      password: 'Carnanda23',
      displayName: 'Carsai Admin',
      emailVerified: true,
    })
    superAdminUid = userRecord.uid
  } catch (e) {
    // User might already exist in Firebase Auth
    const existingUser = await auth.getUserByEmail(superAdminEmail)
    superAdminUid = existingUser.uid
  }

  await createDocWithId('users', superAdminUid, {
    name: 'Carsai Admin',
    email: superAdminEmail,
    phone: '847545020',
    company: 'Carsai Mozambique',
    avatar: null,
    bio: 'CEO & Founder of Carsai Mozambique',
    address: 'Montepuez, Cabo Delgado, Mozambique',
    roleId: superAdminRoleId,
    isActive: true,
    emailVerified: true,
    authProvider: 'email',
  })

  // ── 6. Create admin user ──
  const adminEmail = 'suporte.carsaimz@gmail.com'
  let adminUid

  try {
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: 'CarsaiAdmin2025',
      displayName: 'Carsai Support',
      emailVerified: true,
    })
    adminUid = userRecord.uid
  } catch (e) {
    const existingUser = await auth.getUserByEmail(adminEmail)
    adminUid = existingUser.uid
  }

  await createDocWithId('users', adminUid, {
    name: 'Carsai Support',
    email: adminEmail,
    phone: '874512581',
    company: 'Carsai Mozambique',
    avatar: null,
    bio: null,
    address: null,
    roleId: adminRoleId,
    isActive: true,
    emailVerified: true,
    authProvider: 'email',
  })

  // ── 7. Create site settings ──
  console.log('[Seed] Creating settings...')
  const settings = [
    { key: 'company_name', value: 'Carsai Mozambique' },
    { key: 'contact_email', value: 'carsaimozambique@gmail.com' },
    { key: 'support_email', value: 'suporte.carsaimz@gmail.com' },
    { key: 'developer_email', value: 'carsaideveloper@gmail.com' },
    { key: 'contact_phone', value: '847545020 / 874512581 / 84246463 / 835020143' },
    { key: 'contact_address', value: 'Montepuez, Cabo Delgado, Mozambique' },
    { key: 'website_url', value: 'https://carsai.mz' },
    { key: 'ceo_name', value: 'Carimo Saide Mpinda' },
    { key: 'developer_name', value: 'CarsaiDev' },
    { key: 'social_whatsapp', value: '847545020' },
    { key: 'social_facebook', value: 'carsaimz' },
    { key: 'social_instagram', value: 'carsaimz' },
    { key: 'social_tiktok', value: 'carsaimz' },
    { key: 'social_youtube', value: 'carsaimz' },
    { key: 'social_discord', value: 'carsaimz' },
    { key: 'social_github', value: 'carsaimz' },
    { key: 'mpesa_number', value: '847545020' },
  ]

  const settingsBatch = db.batch()
  for (const setting of settings) {
    const ref = db.collection('settings').doc(setting.key)
    settingsBatch.set(ref, { value: setting.value, createdAt: new Date(), updatedAt: new Date() })
  }
  await settingsBatch.commit()

  // ── Summary ──
  console.log('\n[Seed] ============================')
  console.log('[Seed] Roles: 4 (super_admin, admin, partner, user)')
  console.log(`[Seed] Permissions: ${Object.keys(permissions).length}`)
  console.log(`[Seed] super_admin: ${superAdminEmail} / Carnanda23`)
  console.log(`[Seed] admin: ${adminEmail} / CarsaiAdmin2025`)
  console.log(`[Seed] Settings: ${settings.length}`)
  console.log('[Seed] Done!')
}

seed().catch((e) => {
  console.error('[Seed] Fatal error:', e)
  process.exit(1)
})
