import { NextResponse } from 'next/server'
import { getDocs, createDoc, createDocWithId, createMany, deleteMany, countDocs } from '@/lib/db'

/**
 * Seed Firestore with Carsai Mozambique demo data.
 *
 * This replaces the old Prisma seed-data module which no longer exists.
 * All seeding now goes through the Firestore service layer.
 */

// ─── Seed Data ───

const ROLES = [
  { name: 'super_admin', description: 'Super Administrator with full access' },
  { name: 'admin', description: 'Administrator with management access' },
  { name: 'partner', description: 'Affiliate partner' },
  { name: 'user', description: 'Regular user' },
]

const CATEGORIES = [
  { name: 'Web Development', slug: 'web-development', description: 'Articles about web development technologies and best practices' },
  { name: 'Mobile Apps', slug: 'mobile-apps', description: 'Mobile application development and design' },
  { name: 'Hosting & Domains', slug: 'hosting-domains', description: 'Web hosting, domain registration, and server management' },
  { name: 'SEO & Marketing', slug: 'seo-marketing', description: 'Search engine optimization and digital marketing strategies' },
  { name: 'Design & Branding', slug: 'design-branding', description: 'Graphic design, branding, and visual identity' },
  { name: 'Business Tips', slug: 'business-tips', description: 'Business advice and entrepreneurship tips for Mozambique' },
]

const SERVICES = [
  { title: 'Web Development', titleI18n: '{"pt":"Desenvolvimento Web"}', slug: 'web-development', description: 'Custom websites, web apps, and e-commerce solutions', descriptionI18n: '{"pt":"Sites web personalizados, aplicações web e soluções e-commerce"}', icon: 'code', basePrice: 5000, isFeatured: true, isPublished: true, order: 1 },
  { title: 'FREE Web Hosting', titleI18n: '{"pt":"Hospedagem Web GRATUITA"}', slug: 'free-hosting', description: 'Apache shared hosting provided by ifastnet/byet — completely free!', descriptionI18n: '{"pt":"Hospedagem Apache compartilhada fornecida por ifastnet/byet — totalmente gratuita!"}', icon: 'server', basePrice: 0, isFeatured: true, isPublished: true, order: 2 },
  { title: 'Domain Registration', titleI18n: '{"pt":"Registo de Domínios"}', slug: 'domain-registration', description: '.mz, .com, .net, .org domain registration services', descriptionI18n: '{"pt":"Registo de domínios .mz, .com, .net, .org"}', icon: 'globe', basePrice: 1500, isFeatured: false, isPublished: true, order: 3 },
  { title: 'SSL Certificates', titleI18n: '{"pt":"Certificados SSL"}', slug: 'ssl-certificates', description: 'Free Let\'s Encrypt and premium SSL certificate options', descriptionI18n: '{"pt":"Let\'s Encrypt gratuito e opções de certificados SSL premium"}', icon: 'shield', basePrice: 0, isFeatured: false, isPublished: true, order: 4 },
  { title: 'SEO Optimization', titleI18n: '{"pt":"Otimização SEO"}', slug: 'seo-optimization', description: 'Search engine optimization for better visibility', descriptionI18n: '{"pt":"Otimização de motores de busca para melhor visibilidade"}', icon: 'search', basePrice: 3000, isFeatured: false, isPublished: true, order: 5 },
  { title: 'Mobile App Development', titleI18n: '{"pt":"Desenvolvimento de Apps Mobile"}', slug: 'mobile-apps', description: 'Android and iOS mobile application development', descriptionI18n: '{"pt":"Desenvolvimento de aplicações móveis Android e iOS"}', icon: 'smartphone', basePrice: 15000, isFeatured: true, isPublished: true, order: 6 },
  { title: 'Graphic Design', titleI18n: '{"pt":"Design Gráfico"}', slug: 'graphic-design', description: 'Logos, branding, and marketing materials', descriptionI18n: '{"pt":"Logótipos, branding e materiais de marketing"}', icon: 'palette', basePrice: 2000, isFeatured: false, isPublished: true, order: 7 },
]

const TESTIMONIALS = [
  { name: 'Ana Silva', company: 'Silva Consulting', content: 'Carsai helped us launch our website in just 2 weeks. Professional and affordable!', contentI18n: '{"pt":"Carsai ajudou-nos a lançar o nosso site em apenas 2 semanas. Profissional e acessível!"}', rating: 5, isPublished: true },
  { name: 'Carlos Mendes', company: 'Mendes Logistics', content: 'The free hosting is amazing. Our small business finally has a web presence.', contentI18n: '{"pt":"A hospedagem gratuita é incrível. O nosso pequeno negócio finalmente tem presença web."}', rating: 5, isPublished: true },
  { name: 'Fatima Abdula', company: 'Abdula Fashion', content: 'Great SEO work! Our traffic increased by 300% in just 3 months.', contentI18n: '{"pt":"Excelente trabalho SEO! O nosso tráfego aumentou 300% em apenas 3 meses."}', rating: 4, isPublished: true },
  { name: 'João Macamo', company: 'Macamo Tech', content: 'The mobile app they built for us is perfect. Our customers love it!', contentI18n: '{"pt":"A app mobile que construíram para nós é perfeita. Os nossos clientes adoram!"}', rating: 5, isPublished: true },
]

const SETTINGS = [
  { key: 'site_name', value: 'Carsai Mozambique' },
  { key: 'site_description', value: 'Soluções Digitais e Hospedagem Web Gratuita' },
  { key: 'site_email', value: 'carsaimozambique@gmail.com' },
  { key: 'site_phone', value: '847545020' },
  { key: 'site_address', value: 'Montepuez, Cabo Delgado, Mozambique' },
  { key: 'site_url', value: 'https://carsai.mz' },
  { key: 'currency', value: 'MT' },
  { key: 'currency_code', value: 'MZN' },
  { key: 'mpesa_number', value: '847545020' },
  { key: 'whatsapp_number', value: '258847545020' },
  { key: 'default_language', value: 'pt' },
]

const FORUM_CATEGORIES = [
  { name: 'General Discussion', slug: 'general', description: 'General discussions about web development and digital services', order: 1 },
  { name: 'Support & Help', slug: 'support', description: 'Get help with our services and troubleshoot issues', order: 2 },
  { name: 'Feature Requests', slug: 'feature-requests', description: 'Suggest new features and improvements', order: 3 },
  { name: 'Showcase', slug: 'showcase', description: 'Show off your projects built with Carsai services', order: 4 },
]

async function seedDatabase() {
  const results: Record<string, any> = {}

  // ── Clear existing data ──
  const collectionsToClear = [
    'roles', 'permissions', 'role_permissions',
    'services', 'projects', 'testimonials',
    'posts', 'categories', 'tags', 'post_tags', 'comments', 'subscribers',
    'forum_categories', 'forum_topics', 'forum_posts', 'forum_likes',
    'quotes', 'proposals', 'payments', 'invoices', 'invoice_items',
    'affiliate_clicks', 'affiliate_commissions',
    'notifications', 'support_tickets', 'ticket_replies',
    'file_attachments', 'settings', 'ai_providers', 'logs', 'pages',
  ]

  for (const col of collectionsToClear) {
    try {
      await deleteMany(col)
    } catch {
      // Collection might not exist yet — ignore
    }
  }

  // ── Seed Roles ──
  const roleIds: Record<string, string> = {}
  for (const role of ROLES) {
    const id = await createDoc('roles', role)
    roleIds[role.name] = id
  }
  results.roles = ROLES.length

  // ── Seed Categories ──
  const categoryIds: string[] = []
  for (const cat of CATEGORIES) {
    const id = await createDoc('categories', cat)
    categoryIds.push(id)
  }
  results.categories = CATEGORIES.length

  // ── Seed Services ──
  for (const service of SERVICES) {
    await createDoc('services', service)
  }
  results.services = SERVICES.length

  // ── Seed Testimonials ──
  for (const testimonial of TESTIMONIALS) {
    await createDoc('testimonials', testimonial)
  }
  results.testimonials = TESTIMONIALS.length

  // ── Seed Settings (using key as doc ID) ──
  for (const setting of SETTINGS) {
    await createDocWithId('settings', setting.key, { key: setting.key, value: setting.value })
  }
  results.settings = SETTINGS.length

  // ── Seed Forum Categories ──
  for (const forumCat of FORUM_CATEGORIES) {
    await createDoc('forum_categories', forumCat)
  }
  results.forum_categories = FORUM_CATEGORIES.length

  // ── Seed a demo super_admin user ──
  // NOTE: In production, auth users are created via Firebase Auth.
  // Here we just create the Firestore profile document.
  const superAdminId = await createDoc('users', {
    name: 'Carsai Admin',
    email: 'carsaimozambique@gmail.com',
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // hash of 'password'
    roleId: roleIds['super_admin'],
    isActive: true,
    emailVerified: true,
    avatar: null,
    phone: '847545020',
    company: 'Carsai Mozambique',
    bio: 'Super Administrator',
    address: 'Montepuez, Cabo Delgado, Mozambique',
  })
  results.superAdmin = superAdminId

  // ── Seed a demo admin user ──
  const adminId = await createDoc('users', {
    name: 'Admin User',
    email: 'admin@carsai.mz',
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    roleId: roleIds['admin'],
    isActive: true,
    emailVerified: true,
    avatar: null,
    phone: '874512581',
    company: 'Carsai Mozambique',
    bio: 'Administrator',
    address: 'Maputo, Mozambique',
  })
  results.admin = adminId

  // ── Seed demo posts ──
  const posts = [
    {
      title: 'Welcome to Carsai Mozambique',
      slug: 'welcome-to-carsai-mozambique',
      excerpt: 'Discover our digital solutions and free web hosting services.',
      content: 'Carsai Mozambique offers Soluções Digitais e Hospedagem Web Gratuita...',
      authorId: adminId,
      categoryId: categoryIds[0],
      published: true,
    },
    {
      title: 'FREE Web Hosting with Apache',
      slug: 'free-web-hosting-apache',
      excerpt: 'Get started with FREE Apache shared hosting powered by ifastnet/byet.',
      content: 'Our FREE hosting plan includes...',
      authorId: adminId,
      categoryId: categoryIds[2],
      published: true,
    },
  ]

  for (const post of posts) {
    await createDoc('posts', post)
  }
  results.posts = posts.length

  // ── Seed demo projects ──
  const projects = [
    {
      title: 'Silva Consulting Website',
      slug: 'silva-consulting-website',
      description: 'Professional consulting website with booking system',
      client: 'Silva Consulting',
      technologies: ['Next.js', 'Tailwind CSS', 'Firebase'],
      isFeatured: true,
      isPublished: true,
    },
    {
      title: 'Mendes Logistics Portal',
      slug: 'mendes-logistics-portal',
      description: 'Logistics tracking and management portal',
      client: 'Mendes Logistics',
      technologies: ['React', 'Node.js', 'MongoDB'],
      isFeatured: false,
      isPublished: true,
    },
  ]

  for (const project of projects) {
    await createDoc('projects', project)
  }
  results.projects = projects.length

  return results
}

export async function POST() {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: 'Firestore seeded successfully with Carsai Mozambique demo data',
      data: result,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed Firestore',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: 'Firestore seeded successfully with Carsai Mozambique demo data',
      data: result,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed Firestore',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
