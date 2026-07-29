/**
 * Carsai Mozambique — Client-Side Firestore Seed Utility
 *
 * Seeds essential data (roles, permissions, categories, forum categories)
 * directly from the browser using the Firebase Client SDK.
 *
 * This is needed because:
 * 1. The server-side seed script (firebase-seed.js) requires Firebase Admin credentials
 * 2. With `output: "export"` in next.config.ts, there's no server to run API routes
 * 3. The app needs initial data (roles, categories) to function properly
 *
 * Usage: Call seedInitialData() from the browser console or a setup page.
 * It's safe to call multiple times — it checks for existing data before creating.
 */

import { firestoreClient } from '@/lib/firebase-client'
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
} from 'firebase/firestore'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface SeedResult {
  success: boolean
  message: string
  details: Record<string, number>
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Check if a collection has any documents
 */
async function collectionHasDocs(colName: string): Promise<boolean> {
  if (!firestoreClient) return false
  const snap = await getDocs(collection(firestoreClient, colName))
  return !snap.empty
}

/**
 * Find a document by field value
 */
async function findDocByField(colName: string, field: string, value: string): Promise<string | null> {
  if (!firestoreClient) return null
  const q = query(collection(firestoreClient, colName), where(field, '==', value))
  const snap = await getDocs(q)
  return snap.empty ? null : snap.docs[0].id
}

/**
 * Create a document with auto-generated ID
 */
async function createDoc(colName: string, data: Record<string, unknown>): Promise<string> {
  if (!firestoreClient) throw new Error('Firestore not available')
  const ref = doc(collection(firestoreClient, colName))
  await setDoc(ref, { ...data, createdAt: new Date(), updatedAt: new Date() })
  return ref.id
}

// ──────────────────────────────────────────────
// Seed Functions
// ──────────────────────────────────────────────

/**
 * Seed roles if they don't exist
 */
async function seedRoles(): Promise<number> {
  const hasRoles = await collectionHasDocs('roles')
  if (hasRoles) {
    console.log('[Seed] Roles already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating roles...')
  const roles = [
    { name: 'super_admin', description: 'Super administrador com acesso total e irrestrito ao sistema' },
    { name: 'admin', description: 'Administrador com acesso total ao sistema' },
    { name: 'partner', description: 'Parceiro comercial com acesso a funcionalidades de gestão' },
    { name: 'user', description: 'Utilizador padrão com acesso básico' },
  ]

  let count = 0
  for (const role of roles) {
    const existing = await findDocByField('roles', 'name', role.name)
    if (!existing) {
      await createDoc('roles', role)
      count++
    }
  }
  return count
}

/**
 * Seed permissions if they don't exist
 */
async function seedPermissions(): Promise<number> {
  const hasPerms = await collectionHasDocs('permissions')
  if (hasPerms) {
    console.log('[Seed] Permissions already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating permissions...')
  const permissions = [
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

  let count = 0
  for (const perm of permissions) {
    const existing = await findDocByField('permissions', 'name', perm.name)
    if (!existing) {
      await createDoc('permissions', perm)
      count++
    }
  }
  return count
}

/**
 * Seed blog categories if they don't exist
 */
async function seedCategories(): Promise<number> {
  const hasCats = await collectionHasDocs('categories')
  if (hasCats) {
    console.log('[Seed] Blog categories already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating blog categories...')
  const categories = [
    { name: 'Tecnologia', slug: 'tecnologia' },
    { name: 'Negócios', slug: 'negocios' },
    { name: 'Dicas', slug: 'dicas' },
    { name: 'Notícias', slug: 'noticias' },
    { name: 'Tutoriais', slug: 'tutoriais' },
  ]

  let count = 0
  for (const cat of categories) {
    const existing = await findDocByField('categories', 'slug', cat.slug)
    if (!existing) {
      await createDoc('categories', cat)
      count++
    }
  }
  return count
}

/**
 * Seed forum categories if they don't exist
 */
async function seedForumCategories(): Promise<number> {
  const hasCats = await collectionHasDocs('forum_categories')
  if (hasCats) {
    console.log('[Seed] Forum categories already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating forum categories...')
  const categories = [
    { name: 'Discussão Geral', slug: 'discussao-geral', description: 'Discussão geral sobre qualquer assunto relacionado ao Carsai Mozambique', order: 1 },
    { name: 'Ajuda & Suporte', slug: 'ajuda-suporte', description: 'Tire suas dúvidas e obtenha ajuda da comunidade', order: 2 },
    { name: 'Projectos & Portfolio', slug: 'projectos-portfolio', description: 'Partilhe os seus projectos e trabalhos', order: 3 },
    { name: 'Emprego & Freelance', slug: 'emprego-freelance', description: 'Oportunidades de emprego e trabalho freelance', order: 4 },
  ]

  let count = 0
  for (const cat of categories) {
    const existing = await findDocByField('forum_categories', 'slug', cat.slug)
    if (!existing) {
      await createDoc('forum_categories', cat)
      count++
    }
  }
  return count
}

/**
 * Seed site settings if they don't exist
 */
async function seedSettings(): Promise<number> {
  const hasSettings = await collectionHasDocs('settings')
  if (hasSettings) {
    console.log('[Seed] Settings already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating settings...')
  const settings: Record<string, string> = {
    company_name: 'Carsai Mozambique',
    contact_email: 'carsaimozambique@gmail.com',
    support_email: 'suporte.carsaimz@gmail.com',
    developer_email: 'carsaideveloper@gmail.com',
    contact_phone: '847545020 / 874512581 / 84246463 / 835020143',
    contact_address: 'Montepuez, Cabo Delgado, Mozambique',
    website_url: 'https://carsai.mz',
    ceo_name: 'Carimo Saide Mpinda',
    developer_name: 'CarsaiDev',
    social_whatsapp: '847545020',
    social_facebook: 'carsaimz',
    social_instagram: 'carsaimz',
    social_tiktok: 'carsaimz',
    social_youtube: 'carsaimz',
    social_discord: 'carsaimz',
    social_github: 'carsaimz',
    mpesa_number: '847545020',
  }

  if (!firestoreClient) return 0

  let count = 0
  for (const [key, value] of Object.entries(settings)) {
    const ref = doc(firestoreClient, 'settings', key)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { value, createdAt: new Date(), updatedAt: new Date() })
      count++
    }
  }
  return count
}

/**
 * Seed sample services if they don't exist
 */
async function seedServices(): Promise<number> {
  const hasServices = await collectionHasDocs('services')
  if (hasServices) {
    console.log('[Seed] Services already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating sample services...')
  const services = [
    { name: 'Desenvolvimento Web', slug: 'desenvolvimento-web', description: 'Criação de websites e aplicações web modernas e responsivas', icon: 'globe', price: 15000, currency: 'MZN', featured: true },
    { name: 'Desenvolvimento Mobile', slug: 'desenvolvimento-mobile', description: 'Aplicações nativas para Android e iOS', icon: 'smartphone', price: 25000, currency: 'MZN', featured: true },
    { name: 'Consultoria IT', slug: 'consultoria-it', description: 'Consultoria em tecnologia da informação e transformação digital', icon: 'cpu', price: 5000, currency: 'MZN', featured: false },
    { name: 'Design Gráfico', slug: 'design-grafico', description: 'Design de logos, identidade visual e materiais gráficos', icon: 'palette', price: 8000, currency: 'MZN', featured: true },
    { name: 'Marketing Digital', slug: 'marketing-digital', description: 'Estratégias de marketing digital e gestão de redes sociais', icon: 'trending-up', price: 10000, currency: 'MZN', featured: false },
    { name: 'Manutenção & Suporte', slug: 'manutencao-suporte', description: 'Manutenção e suporte técnico para sistemas e infraestrutura', icon: 'wrench', price: 3000, currency: 'MZN', featured: false },
  ]

  let count = 0
  for (const svc of services) {
    const existing = await findDocByField('services', 'slug', svc.slug)
    if (!existing) {
      await createDoc('services', svc)
      count++
    }
  }
  return count
}

/**
 * Seed sample projects if they don't exist
 */
async function seedProjects(): Promise<number> {
  const hasProjects = await collectionHasDocs('projects')
  if (hasProjects) {
    console.log('[Seed] Projects already exist, skipping')
    return 0
  }

  console.log('[Seed] Creating sample projects...')
  const projects = [
    { name: 'Portal Carsai Mozambique', slug: 'portal-carsai-mozambique', description: 'Portal web oficial da Carsai Mozambique', status: 'completed', featured: true },
    { name: 'App Carsai Mobile', slug: 'app-carsai-mobile', description: 'Aplicação móvel multiplataforma para clientes Carsai', status: 'in_progress', featured: true },
    { name: 'Sistema de Gestão', slug: 'sistema-gestao', description: 'Sistema de gestão empresarial para pequenas empresas', status: 'planning', featured: false },
  ]

  let count = 0
  for (const proj of projects) {
    const existing = await findDocByField('projects', 'slug', proj.slug)
    if (!existing) {
      await createDoc('projects', proj)
      count++
    }
  }
  return count
}

// ──────────────────────────────────────────────
// Main Seed Function
// ──────────────────────────────────────────────

/**
 * Seed all essential data for the app to function.
 * Safe to call multiple times — it checks for existing data before creating.
 *
 * This should be called from:
 * 1. A setup page on first run
 * 2. The browser console: window.seedInitialData()
 * 3. A dedicated admin "seed" button
 */
export async function seedInitialData(): Promise<SeedResult> {
  if (!firestoreClient) {
    return {
      success: false,
      message: 'Firestore não está disponível. Verifique a configuração do Firebase.',
      details: {},
    }
  }

  console.log('[Seed] Starting client-side Firestore seeding...')

  const details: Record<string, number> = {}

  try {
    details.roles = await seedRoles()
    details.permissions = await seedPermissions()
    details.categories = await seedCategories()
    details.forumCategories = await seedForumCategories()
    details.settings = await seedSettings()
    details.services = await seedServices()
    details.projects = await seedProjects()

    const totalCreated = Object.values(details).reduce((sum, n) => sum + n, 0)

    console.log('[Seed] Done! Created:', details)

    return {
      success: true,
      message: totalCreated > 0
        ? `Dados iniciais criados com sucesso! ${totalCreated} documentos adicionados.`
        : 'Todos os dados já existem. Nenhum documento novo foi criado.',
      details,
    }
  } catch (error) {
    console.error('[Seed] Error:', error)
    return {
      success: false,
      message: `Erro ao criar dados iniciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      details,
    }
  }
}

/**
 * Check if the database has been seeded with essential data.
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  if (!firestoreClient) return false

  try {
    const hasRoles = await collectionHasDocs('roles')
    const hasSettings = await collectionHasDocs('settings')
    return hasRoles && hasSettings
  } catch {
    return false
  }
}
