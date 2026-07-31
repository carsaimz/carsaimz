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
 * Seed forum categories if they don't exist.
 * Also updates existing categories with nameI18n if they don't have it.
 */
async function seedForumCategories(): Promise<number> {
  const hasCats = await collectionHasDocs('forum_categories')

  const i18nData: Record<string, Record<string, string>> = {
    'discussao-geral': {
      'pt-pt': 'Discussão Geral', 'en-us': 'General Discussion', 'pt-br': 'Discussão Geral',
      'fr-fr': 'Discussion Générale', 'es-es': 'Discusión General', 'zh-cn': '综合讨论',
      'de-de': 'Allgemeine Diskussion', 'sw-tz': 'Majadiliano ya Kawaida',
    },
    'ajuda-suporte': {
      'pt-pt': 'Ajuda & Suporte', 'en-us': 'Help & Support', 'pt-br': 'Ajuda & Suporte',
      'fr-fr': 'Aide & Support', 'es-es': 'Ayuda & Soporte', 'zh-cn': '帮助与支持',
      'de-de': 'Hilfe & Support', 'sw-tz': 'Msaada & Usaidizi',
    },
    'projectos-portfolio': {
      'pt-pt': 'Projectos & Portfolio', 'en-us': 'Projects & Portfolio', 'pt-br': 'Projetos & Portfólio',
      'fr-fr': 'Projets & Portfolio', 'es-es': 'Proyectos & Portafolio', 'zh-cn': '项目与作品集',
      'de-de': 'Projekte & Portfolio', 'sw-tz': 'Miradi & Portfolio',
    },
    'emprego-freelance': {
      'pt-pt': 'Emprego & Freelance', 'en-us': 'Jobs & Freelance', 'pt-br': 'Emprego & Freelance',
      'fr-fr': 'Emploi & Freelance', 'es-es': 'Empleo & Freelance', 'zh-cn': '工作与自由职业',
      'de-de': 'Jobs & Freelance', 'sw-tz': 'Kazi & Freelance',
    },
  }

  // Update existing categories with nameI18n if they don't have it
  if (hasCats && firestoreClient) {
    try {
      const { getDocs, collection, doc, setDoc, getDoc } = await import('firebase/firestore')
      const snap = await getDocs(collection(firestoreClient, 'forum_categories'))
      for (const d of snap.docs) {
        const data = d.data()
        if (!data.nameI18n && data.slug && i18nData[data.slug]) {
          await setDoc(doc(firestoreClient, 'forum_categories', d.id), {
            ...data,
            nameI18n: i18nData[data.slug],
            updatedAt: new Date(),
          })
          console.log(`[Seed] Updated forum category "${data.slug}" with nameI18n`)
        }
      }
    } catch (err) {
      console.warn('[Seed] Could not update forum categories with nameI18n:', err)
    }
    return 0 // No new categories created
  }

  console.log('[Seed] Creating forum categories...')
  const categories = [
    {
      name: 'Discussão Geral',
      slug: 'discussao-geral',
      description: 'Discussão geral sobre qualquer assunto relacionado ao Carsai Mozambique',
      order: 1,
      nameI18n: i18nData['discussao-geral'],
    },
    {
      name: 'Ajuda & Suporte',
      slug: 'ajuda-suporte',
      description: 'Tire suas dúvidas e obtenha ajuda da comunidade',
      order: 2,
      nameI18n: i18nData['ajuda-suporte'],
    },
    {
      name: 'Projectos & Portfolio',
      slug: 'projectos-portfolio',
      description: 'Partilhe os seus projectos e trabalhos',
      order: 3,
      nameI18n: i18nData['projectos-portfolio'],
    },
    {
      name: 'Emprego & Freelance',
      slug: 'emprego-freelance',
      description: 'Oportunidades de emprego e trabalho freelance',
      order: 4,
      nameI18n: i18nData['emprego-freelance'],
    },
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
    { title: 'Desenvolvimento Web', titleI18n: JSON.stringify({ 'pt-pt': 'Desenvolvimento Web', 'en-us': 'Web Development', 'pt-br': 'Desenvolvimento Web', 'fr-fr': 'Développement Web', 'es-es': 'Desarrollo Web', 'zh-cn': '网站开发', 'de-de': 'Webentwicklung', 'sw-tz': 'Uendelezaji Wavuti' }), slug: 'desenvolvimento-web', description: 'Criação de websites e aplicações web modernas e responsivas', descriptionI18n: JSON.stringify({ 'pt-pt': 'Criação de websites e aplicações web modernas e responsivas', 'en-us': 'Modern and responsive website and web application development', 'fr-fr': 'Création de sites web et applications web modernes et réactifs', 'es-es': 'Creación de sitios web y aplicaciones web modernas y responsivas', 'zh-cn': '创建现代和响应式网站及Web应用' }), icon: 'Globe', basePrice: 15000, isFeatured: true, isPublished: true, order: 1 },
    { title: 'Desenvolvimento Mobile', titleI18n: JSON.stringify({ 'pt-pt': 'Desenvolvimento Mobile', 'en-us': 'Mobile Development', 'pt-br': 'Desenvolvimento Mobile', 'fr-fr': 'Développement Mobile', 'es-es': 'Desarrollo Móvil', 'zh-cn': '移动开发', 'de-de': 'Mobile Entwicklung', 'sw-tz': 'Uendelezaji Simu' }), slug: 'desenvolvimento-mobile', description: 'Aplicações nativas e híbridas para Android e iOS', descriptionI18n: JSON.stringify({ 'pt-pt': 'Aplicações nativas e híbridas para Android e iOS', 'en-us': 'Native and hybrid apps for Android and iOS', 'fr-fr': 'Applications natives et hybrides pour Android et iOS', 'es-es': 'Aplicaciones nativas e híbridas para Android e iOS', 'zh-cn': 'Android和iOS原生及混合应用开发' }), icon: 'Smartphone', basePrice: 25000, isFeatured: true, isPublished: true, order: 2 },
    { title: 'Consultoria IT', titleI18n: JSON.stringify({ 'pt-pt': 'Consultoria IT', 'en-us': 'IT Consulting', 'pt-br': 'Consultoria IT', 'fr-fr': 'Consultation IT', 'es-es': 'Consultoría IT', 'zh-cn': 'IT咨询', 'de-de': 'IT-Beratung', 'sw-tz': 'Ushauri wa IT' }), slug: 'consultoria-it', description: 'Consultoria em tecnologia da informação e transformação digital', descriptionI18n: JSON.stringify({ 'pt-pt': 'Consultoria em tecnologia da informação e transformação digital', 'en-us': 'Information technology consulting and digital transformation', 'fr-fr': 'Consultation en technologie de l\'information et transformation numérique', 'es-es': 'Consultoría en tecnología de la información y transformación digital', 'zh-cn': '信息技术咨询和数字化转型' }), icon: 'Server', basePrice: 5000, isFeatured: false, isPublished: true, order: 3 },
    { title: 'Design Gráfico', titleI18n: JSON.stringify({ 'pt-pt': 'Design Gráfico', 'en-us': 'Graphic Design', 'pt-br': 'Design Gráfico', 'fr-fr': 'Design Graphique', 'es-es': 'Diseño Gráfico', 'zh-cn': '平面设计', 'de-de': 'Grafikdesign', 'sw-tz': 'Muundo wa Picha' }), slug: 'design-grafico', description: 'Design de logos, identidade visual e materiais gráficos', descriptionI18n: JSON.stringify({ 'pt-pt': 'Design de logos, identidade visual e materiais gráficos', 'en-us': 'Logo design, visual identity, and graphic materials', 'fr-fr': 'Design de logos, identité visuelle et matériaux graphiques', 'es-es': 'Diseño de logos, identidad visual y materiales gráficos', 'zh-cn': 'Logo设计、视觉识别和图形材料' }), icon: 'Palette', basePrice: 8000, isFeatured: true, isPublished: true, order: 4 },
    { title: 'Marketing Digital', titleI18n: JSON.stringify({ 'pt-pt': 'Marketing Digital', 'en-us': 'Digital Marketing', 'pt-br': 'Marketing Digital', 'fr-fr': 'Marketing Digital', 'es-es': 'Marketing Digital', 'zh-cn': '数字营销', 'de-de': 'Digitales Marketing', 'sw-tz': 'Masoko ya Kidijitali' }), slug: 'marketing-digital', description: 'Estratégias de marketing digital e gestão de redes sociais', descriptionI18n: JSON.stringify({ 'pt-pt': 'Estratégias de marketing digital e gestão de redes sociais', 'en-us': 'Digital marketing strategies and social media management', 'fr-fr': 'Stratégies de marketing digital et gestion des réseaux sociaux', 'es-es': 'Estrategias de marketing digital y gestión de redes sociales', 'zh-cn': '数字营销策略和社交媒体管理' }), icon: 'Cloud', basePrice: 10000, isFeatured: false, isPublished: true, order: 5 },
    { title: 'Manutenção & Suporte', titleI18n: JSON.stringify({ 'pt-pt': 'Manutenção & Suporte', 'en-us': 'Maintenance & Support', 'pt-br': 'Manutenção & Suporte', 'fr-fr': 'Maintenance & Support', 'es-es': 'Mantenimiento y Soporte', 'zh-cn': '维护与支持', 'de-de': 'Wartung & Support', 'sw-tz': 'Matengenezo & Usaidizi' }), slug: 'manutencao-suporte', description: 'Manutenção e suporte técnico para sistemas e infraestrutura', descriptionI18n: JSON.stringify({ 'pt-pt': 'Manutenção e suporte técnico para sistemas e infraestrutura', 'en-us': 'Technical maintenance and support for systems and infrastructure', 'fr-fr': 'Maintenance et support technique pour les systèmes et l\'infrastructure', 'es-es': 'Mantenimiento y soporte técnico para sistemas e infraestructura', 'zh-cn': '系统和基础设施的技术维护和支持' }), icon: 'Server', basePrice: 3000, isFeatured: false, isPublished: true, order: 6 },
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
 * Returns true if:
 *   - Firestore is not available (don't show banner — it's a config issue, not a seeding issue)
 *   - Essential collections (roles, settings) exist
 * Returns false only if Firestore is available AND data is missing.
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  if (!firestoreClient) return true // Don't show banner if Firestore is not available

  try {
    const hasRoles = await collectionHasDocs('roles')
    const hasSettings = await collectionHasDocs('settings')
    return hasRoles || hasSettings // If either exists, DB is seeded (partial is OK)
  } catch {
    return true // On error, assume seeded — don't show banner
  }
}
