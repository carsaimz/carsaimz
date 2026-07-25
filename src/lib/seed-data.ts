import { db } from '@/lib/db'

/**
 * Helper: Convert an SVG string to a base64 data URI.
 * Used to generate compact placeholder images for seed data.
 */
function svgToDataUri(svg: string): string {
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

// === Base64 Placeholder SVGs ===

const AVATAR_SVG_TEMPLATE = (initials: string, bgColor: string, textColor: string = '#fff') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="${bgColor}"/><text x="40" y="44" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`

const PROJECT_IMAGE_SVG = (title: string, gradientFrom: string, gradientTo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${gradientFrom}"/><stop offset="100%" style="stop-color:${gradientTo}"/></linearGradient></defs><rect width="400" height="240" fill="url(#g)" rx="8"/><text x="200" y="130" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">${title}</text></svg>`

const FEATURED_IMAGE_SVG = (title: string, gradientFrom: string, gradientTo: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${gradientFrom}"/><stop offset="100%" style="stop-color:${gradientTo}"/></linearGradient></defs><rect width="600" height="300" fill="url(#g)" rx="6"/><text x="300" y="160" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">${title}</text></svg>`

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#10b981"/><path d="M8 16 L16 8 L24 16 L16 24 Z" fill="#fff"/></svg>`

// Pre-generated base64 data URIs for seed data
const AVATAR_ADMIN = svgToDataUri(AVATAR_SVG_TEMPLATE('CS', '#10b981'))
const AVATAR_PARTNER = svgToDataUri(AVATAR_SVG_TEMPLATE('AF', '#8b5cf6'))
const AVATAR_USER = svgToDataUri(AVATAR_SVG_TEMPLATE('JM', '#f59e0b'))

const TESTIMONIAL_AVATARS = [
  svgToDataUri(AVATAR_SVG_TEMPLATE('RM', '#2563eb')),
  svgToDataUri(AVATAR_SVG_TEMPLATE('TN', '#dc2626')),
  svgToDataUri(AVATAR_SVG_TEMPLATE('AZ', '#7c3aed')),
  svgToDataUri(AVATAR_SVG_TEMPLATE('ML', '#059669')),
]

const PROJECT_IMAGES_DATA: Record<string, string[]> = {
  'carsai-portal': [
    svgToDataUri(PROJECT_IMAGE_SVG('Carsai Portal - Home', '#10b981', '#0d9488')),
    svgToDataUri(PROJECT_IMAGE_SVG('Carsai Portal - Dashboard', '#059669', '#047857')),
  ],
  'mpesa-dashboard': [
    svgToDataUri(PROJECT_IMAGE_SVG('M-Pesa Dashboard - Analytics', '#2563eb', '#1d4ed8')),
    svgToDataUri(PROJECT_IMAGE_SVG('M-Pesa Dashboard - Transactions', '#3b82f6', '#2563eb')),
  ],
  'edumoz-learning': [
    svgToDataUri(PROJECT_IMAGE_SVG('EduMoz - Learning Platform', '#f59e0b', '#d97706')),
    svgToDataUri(PROJECT_IMAGE_SVG('EduMoz - Course View', '#eab308', '#ca8a04')),
  ],
  'govmoz-digital': [
    svgToDataUri(PROJECT_IMAGE_SVG('GovMoz - Digital Services', '#dc2626', '#b91c1c')),
    svgToDataUri(PROJECT_IMAGE_SVG('GovMoz - Citizen Portal', '#ef4444', '#dc2626')),
  ],
  'agritech-platform': [
    svgToDataUri(PROJECT_IMAGE_SVG('AgriTech - Farm Dashboard', '#22c55e', '#16a34a')),
    svgToDataUri(PROJECT_IMAGE_SVG('AgriTech - Marketplace', '#4ade80', '#22c55e')),
  ],
  'healthconnect': [
    svgToDataUri(PROJECT_IMAGE_SVG('HealthConnect - Telemedicine', '#0ea5e9', '#0284c7')),
    svgToDataUri(PROJECT_IMAGE_SVG('HealthConnect - Appointments', '#38bdf8', '#0ea5e9')),
  ],
}

const POST_FEATURED_IMAGES = [
  svgToDataUri(FEATURED_IMAGE_SVG('Transformação Digital', '#10b981', '#047857')),
  svgToDataUri(FEATURED_IMAGE_SVG('Next.js 16', '#2563eb', '#1d4ed8')),
  svgToDataUri(FEATURED_IMAGE_SVG('Negócio Digital', '#f59e0b', '#d97706')),
  svgToDataUri(FEATURED_IMAGE_SVG('UI Design Moçambique', '#8b5cf6', '#7c3aed')),
  svgToDataUri(FEATURED_IMAGE_SVG('React Native MZ', '#0ea5e9', '#0284c7')),
  svgToDataUri(FEATURED_IMAGE_SVG('IA & Futuro', '#dc2626', '#b91c1c')),
]

const LOGO_DATA_URI = svgToDataUri(LOGO_SVG)

/**
 * Seeds the Carsai Mozambique database with demo data.
 * Clears existing data first to ensure clean state.
 * Uses base64 data URIs for images and files instead of server file paths.
 */
export async function seedDatabase() {
  console.log('🇲🇿 Starting Carsai Mozambique database seeding...')

  // Clear existing data in reverse dependency order
  console.log('Cleaning existing data...')
  await db.notification.deleteMany()
  await db.forumLike.deleteMany()
  await db.forumPost.deleteMany()
  await db.forumTopic.deleteMany()
  await db.forumCategory.deleteMany()
  await db.postTag.deleteMany()
  await db.comment.deleteMany()
  await db.post.deleteMany()
  await db.tag.deleteMany()
  await db.category.deleteMany()
  await db.subscriber.deleteMany()
  await db.testimonial.deleteMany()
  await db.project.deleteMany()
  await db.service.deleteMany()
  await db.invoiceItem.deleteMany()
  await db.invoice.deleteMany()
  await db.payment.deleteMany()
  await db.proposal.deleteMany()
  await db.quote.deleteMany()
  await db.affiliateCommission.deleteMany()
  await db.affiliateClick.deleteMany()
  await db.supportTicket.deleteMany()
  await db.ticketReply.deleteMany()
  await db.rolePermission.deleteMany()
  await db.setting.deleteMany()
  await db.log.deleteMany()
  await db.page.deleteMany()
  await db.user.deleteMany()
  await db.permission.deleteMany()
  await db.role.deleteMany()
  await db.fileAttachment.deleteMany()

  // === 1. Roles ===
  console.log('Creating roles...')
  const adminRole = await db.role.create({
    data: {
      name: 'admin',
      description: 'Administrador com acesso total ao sistema',
    },
  })

  const partnerRole = await db.role.create({
    data: {
      name: 'partner',
      description: 'Parceiro comercial com acesso a funcionalidades de gestão',
    },
  })

  const userRole = await db.role.create({
    data: {
      name: 'user',
      description: 'Utilizador padrão com acesso básico',
    },
  })

  // === 2. Demo Users (with base64 avatars) ===
  console.log('Creating demo users...')
  const adminUser = await db.user.create({
    data: {
      email: 'admin@carsai.mz',
      name: 'Carlos Silva',
      phone: '+258 84 123 4567',
      company: 'Carsai Moçambique',
      bio: 'Director Executivo da Carsai Moçambique',
      address: 'Maputo, Moçambique',
      avatar: AVATAR_ADMIN,
      roleId: adminRole.id,
      isActive: true,
      emailVerified: true,
    },
  })

  const partnerUser = await db.user.create({
    data: {
      email: 'partner@carsai.mz',
      name: 'Ana Ferreira',
      phone: '+258 85 234 5678',
      company: 'Digital Solutions MZ',
      bio: 'Parceira estratégica com foco em marketing digital',
      address: 'Beira, Moçambique',
      avatar: AVATAR_PARTNER,
      roleId: partnerRole.id,
      isActive: true,
      emailVerified: true,
    },
  })

  const demoUser = await db.user.create({
    data: {
      email: 'user@carsai.mz',
      name: 'João Machado',
      phone: '+258 86 345 6789',
      company: 'Tech Startup MZ',
      bio: 'Empreendedor tech em Maputo',
      address: 'Maputo, Moçambique',
      avatar: AVATAR_USER,
      roleId: userRole.id,
      isActive: true,
      emailVerified: true,
    },
  })

  // === 3. Services (with base64 icon SVGs) ===
  console.log('Creating services...')
  const serviceIconSvgs = {
    'web-development': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#fff" fill="none" stroke-width="1.5"/></svg>`,
    'mobile-apps': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3" fill="#8b5cf6"/><rect x="7" y="4" width="10" height="14" rx="1" fill="#fff"/><circle cx="12" cy="19" r="1.5" fill="#fff"/></svg>`,
    'ui-ux-design': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" fill="#f59e0b"/><circle cx="8" cy="8" r="2" fill="#fff"/><rect x="12" y="6" width="8" height="2" rx="1" fill="#fff"/><rect x="4" y="14" width="16" height="6" rx="2" fill="#fff" opacity="0.9"/></svg>`,
    'cloud-solutions': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#2563eb"/></svg>`,
    'devops': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="2" fill="#0ea5e9"/><circle cx="8" cy="12" r="2" fill="#fff"/><circle cx="16" cy="12" r="2" fill="#fff"/><line x1="10" y1="12" x2="14" y2="12" stroke="#fff" stroke-width="1.5"/></svg>`,
    'ai-data-analytics': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/><circle cx="9" cy="10" r="2.5" fill="#fff"/><circle cx="15" cy="10" r="2.5" fill="#fff"/><path d="M8 16 Q12 19 16 16" stroke="#fff" stroke-width="1.5" fill="none"/></svg>`,
  }

  const services = await Promise.all([
    db.service.create({
      data: {
        slug: 'web-development',
        title: 'Web Development',
        description: 'Desenvolvimento de websites e aplicações web modernas com Next.js, React e TypeScript. Soluções completas para empresas moçambicanas que necessitam de presença digital profissional.',
        icon: svgToDataUri(serviceIconSvgs['web-development']),
        basePrice: 15000,
        isFeatured: true,
        isPublished: true,
        order: 1,
      },
    }),
    db.service.create({
      data: {
        slug: 'mobile-apps',
        title: 'Mobile Apps',
        description: 'Desenvolvimento de aplicações móveis nativas e híbridas para Android e iOS. Integração com APIs locais como M-Pesa e serviços governamentais de Moçambique.',
        icon: svgToDataUri(serviceIconSvgs['mobile-apps']),
        basePrice: 25000,
        isFeatured: true,
        isPublished: true,
        order: 2,
      },
    }),
    db.service.create({
      data: {
        slug: 'ui-ux-design',
        title: 'UI/UX Design',
        description: 'Design de interfaces intuitivas e experiências de utilizador centradas no contexto moçambicano. Prototipagem, testes de usabilidade e design systems completos.',
        icon: svgToDataUri(serviceIconSvgs['ui-ux-design']),
        basePrice: 8000,
        isFeatured: true,
        isPublished: true,
        order: 3,
      },
    }),
    db.service.create({
      data: {
        slug: 'cloud-solutions',
        title: 'Cloud Solutions',
        description: 'Infraestrutura cloud e migração de sistemas para AWS, Azure e Google Cloud. Soluções de armazenamento e computação adaptadas às necessidades de empresas em Maputo e beyond.',
        icon: svgToDataUri(serviceIconSvgs['cloud-solutions']),
        basePrice: 12000,
        isFeatured: false,
        isPublished: true,
        order: 4,
      },
    }),
    db.service.create({
      data: {
        slug: 'devops',
        title: 'DevOps',
        description: 'Automatização de pipelines CI/CD, monitorização e gestão de infraestrutura. Docker, Kubernetes e Terraform para operações eficientes em Moçambique.',
        icon: svgToDataUri(serviceIconSvgs['devops']),
        basePrice: 10000,
        isFeatured: false,
        isPublished: true,
        order: 5,
      },
    }),
    db.service.create({
      data: {
        slug: 'ai-data-analytics',
        title: 'AI & Data Analytics',
        description: 'Inteligência artificial e análise de dados para decisões empresariais informadas. Machine learning, dashboards analytics e processamento de dados específicos para o mercado moçambicano.',
        icon: svgToDataUri(serviceIconSvgs['ai-data-analytics']),
        basePrice: 20000,
        isFeatured: true,
        isPublished: true,
        order: 6,
      },
    }),
  ])

  // === 4. Projects (with base64 images) ===
  console.log('Creating projects...')
  const projects = await Promise.all([
    db.project.create({
      data: {
        slug: 'carsai-portal',
        title: 'Carsai Portal',
        description: 'Portal web completo para a Carsai Mozambique com gestão de conteúdos, blog integrado e área de clientes. Construído com Next.js e Prisma.',
        client: 'Carsai Mozambique',
        technologies: 'Next.js, React, TypeScript, Prisma, Tailwind CSS',
        demoUrl: 'https://carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['carsai-portal']),
        isPublished: true,
        isFeatured: true,
      },
    }),
    db.project.create({
      data: {
        slug: 'mpesa-dashboard',
        title: 'M-Pesa Dashboard',
        description: 'Dashboard de gestão financeira integrado com Vodacom M-Pesa para visualização de transações, relatórios e analytics em tempo real.',
        client: 'Vodacom Mozambique',
        technologies: 'React, Node.js, PostgreSQL, Chart.js, M-Pesa API',
        demoUrl: 'https://mpesa-dashboard.carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['mpesa-dashboard']),
        isPublished: true,
        isFeatured: true,
      },
    }),
    db.project.create({
      data: {
        slug: 'edumoz-learning',
        title: 'EduMoz Learning',
        description: 'Plataforma de e-learning para escolas moçambicanas com cursos online, avaliações e certificados digitais. Suporte para ensino primário e secundário.',
        client: 'Ministério da Educação Mozambique',
        technologies: 'Next.js, Supabase, Tailwind CSS, Framer Motion',
        demoUrl: 'https://edumoz.carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['edumoz-learning']),
        isPublished: true,
        isFeatured: true,
      },
    }),
    db.project.create({
      data: {
        slug: 'govmoz-digital',
        title: 'GovMoz Digital',
        description: 'Plataforma de serviços governamentais digitais para simplificar processos burocráticos. Emissão de documentos, pagamentos de taxas e registo civil online.',
        client: 'Governo de Mozambique',
        technologies: 'Angular, Java Spring, PostgreSQL, Docker, Kubernetes',
        demoUrl: 'https://govmoz.carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['govmoz-digital']),
        isPublished: true,
        isFeatured: false,
      },
    }),
    db.project.create({
      data: {
        slug: 'agritech-platform',
        title: 'AgriTech Platform',
        description: 'Plataforma de gestão agrícola para agricultores moçambicanos com monitorização de culturas, previsão meteorológica e marketplace de produtos.',
        client: 'AgriTech Mozambique',
        technologies: 'React Native, Node.js, MongoDB, TensorFlow Lite',
        demoUrl: 'https://agritech.carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['agritech-platform']),
        isPublished: true,
        isFeatured: true,
      },
    }),
    db.project.create({
      data: {
        slug: 'healthconnect',
        title: 'HealthConnect',
        description: 'Sistema de telemedicina conectando pacientes moçambicanos com médicos em Maputo, Beira e Nampula. Consultas online, prescrições digitais e gestão de historial médico.',
        client: 'Hospital Central de Maputo',
        technologies: 'Next.js, Socket.io, Prisma, WebRTC, Twilio',
        demoUrl: 'https://healthconnect.carsai.mz',
        images: JSON.stringify(PROJECT_IMAGES_DATA['healthconnect']),
        isPublished: true,
        isFeatured: false,
      },
    }),
    db.project.create({
      data: {
        slug: 'tourism-moz-portal',
        title: 'Tourism Moz Portal',
        description: 'Portal turístico para promover destinos moçambicanos - desde as praias de Tofo até à Ilha de Mozambique. Reservas online, mapas interativos e guias culturais.',
        client: 'Ministério do Turismo Mozambique',
        technologies: 'Next.js, MapboxGL, Stripe, Prisma, Tailwind CSS',
        demoUrl: 'https://tourism.carsai.mz',
        images: JSON.stringify([svgToDataUri(PROJECT_IMAGE_SVG('Tourism Moz - Destinos', '#f97316', '#ea580c')), svgToDataUri(PROJECT_IMAGE_SVG('Tourism Moz - Reservas', '#fb923c', '#f97316'))]),
        isPublished: true,
        isFeatured: true,
      },
    }),
    db.project.create({
      data: {
        slug: 'fintech-mz-platform',
        title: 'FinTech MZ Platform',
        description: 'Plataforma financeira para micro-crédito e pagamentos móveis em Mozambique. Integração com múltiplos operadores e compliance com regulamentações do Banco de Moçambique.',
        client: 'FinTech Mozambique',
        technologies: 'React, Node.js, PostgreSQL, Redis, M-Pesa API, e-Mola API',
        demoUrl: 'https://fintech.carsai.mz',
        images: JSON.stringify([svgToDataUri(PROJECT_IMAGE_SVG('FinTech MZ - Dashboard', '#059669', '#047857')), svgToDataUri(PROJECT_IMAGE_SVG('FinTech MZ - Transactions', '#10b981', '#059669'))]),
        isPublished: true,
        isFeatured: false,
      },
    }),
  ])

  // === 5. Testimonials (with base64 avatars) ===
  console.log('Creating testimonials...')
  const testimonials = await Promise.all([
    db.testimonial.create({
      data: {
        name: 'Ricardo Mondlane',
        company: 'Vodacom Mozambique',
        content: 'A Carsai transformou completamente a nossa visão digital. O dashboard M-Pesa que desenvolveram é intuitivo, rápido e totalmente adaptado ao nosso mercado. A equipa understanding do contexto local moçambicano foi fundamental para o sucesso.',
        rating: 5,
        avatar: TESTIMONIAL_AVATARS[0],
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Teresa Nhaca',
        company: 'Banco Commercial de Mozambique',
        content: 'Trabalhar com a Carsai foi uma experiência excepcional. A plataforma de gestão financeira que criaram para nós reduziu o tempo de processamento de transações em 60%. Recomendo sem hesitação.',
        rating: 5,
        avatar: TESTIMONIAL_AVATARS[1],
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Antonio Zuvale',
        company: 'AgriTech Mozambique',
        content: 'A Carsai compreendeu as necessidades únicas dos agricultores moçambicanos e criou uma plataforma que realmente funciona no nosso contexto. A integração com dados meteorológicos locais e o marketplace foram um game-changer.',
        rating: 4,
        avatar: TESTIMONIAL_AVATARS[2],
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Maria Langa',
        company: 'Instituto Nacional de Saúde',
        content: 'O sistema HealthConnect da Carsai está a salvar vidas em Mozambique. A telemedicina permite que pacientes em zonas rurais acedam a médicos especializados em Maputo. A tecnologia adaptada às nossas realidades.',
        rating: 5,
        avatar: TESTIMONIAL_AVATARS[3],
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Fernando Macamo',
        company: 'Porto de Maputo',
        content: 'A Carsai desenvolveu um sistema de gestão portuária que optimizou as operações de carga e descarga. A eficiência aumentou 40% e os custos operacionais diminuíram significativamente.',
        rating: 5,
        avatar: svgToDataUri(AVATAR_SVG_TEMPLATE('FM', '#ea580c')),
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Luísa Chissano',
        company: 'Universidade Eduardo Mondlane',
        content: 'A plataforma de gestão académica desenvolvida pela Carsai transformou a nossa universidade. Inscrições online, gestão de notas e comunicação com estudantes - tudo digitalizado.',
        rating: 4,
        avatar: svgToDataUri(AVATAR_SVG_TEMPLATE('LC', '#be185d')),
        isPublished: true,
      },
    }),
  ])

  // === 6. Blog Categories ===
  console.log('Creating blog categories...')
  const categories = await Promise.all([
    db.category.create({
      data: { name: 'Technology', slug: 'technology' },
    }),
    db.category.create({
      data: { name: 'Business', slug: 'business' },
    }),
    db.category.create({
      data: { name: 'Design', slug: 'design' },
    }),
    db.category.create({
      data: { name: 'Mobile', slug: 'mobile' },
    }),
    db.category.create({
      data: { name: 'AI', slug: 'ai' },
    }),
  ])

  // === 7. Tags ===
  console.log('Creating tags...')
  const tags = await Promise.all([
    db.tag.create({ data: { name: 'javascript', slug: 'javascript' } }),
    db.tag.create({ data: { name: 'react', slug: 'react' } }),
    db.tag.create({ data: { name: 'mobile', slug: 'mobile' } }),
    db.tag.create({ data: { name: 'cloud', slug: 'cloud' } }),
    db.tag.create({ data: { name: 'design', slug: 'design' } }),
    db.tag.create({ data: { name: 'ai', slug: 'ai' } }),
    db.tag.create({ data: { name: 'supabase', slug: 'supabase' } }),
    db.tag.create({ data: { name: 'nodejs', slug: 'nodejs' } }),
  ])

  // === 8. Blog Posts (with base64 featured images) ===
  console.log('Creating blog posts...')
  const post1 = await db.post.create({
    data: {
      title: 'Como a Transformação Digital está a Mudar Mozambique',
      slug: 'transformacao-digital-mozambique',
      excerpt: 'Mozambique está a atravessar uma revolução digital. Desde Maputo até Nampula, empresas e governos estão a adoptar tecnologia para melhorar serviços e criar novas oportunidades económicas.',
      content: `Mozambique está a atravessar uma revolução digital significativa. Desde a capital Maputo até às províncias de Nampula e Sofala, a tecnologia está a transformar a forma como empresas operam e governos servem os cidadãos.

## O Impacto Digital em Mozambique

O crescimento da infraestrutura digital em Mozambique tem sido impressionante. Com mais de 12 milhões de utilizadores de internet móvel, o país está a criar uma base sólida para a economia digital.

### Sector Financeiro
A integração do M-Pesa e outras soluções de pagamento móvel revolucionou o acesso a serviços financeiros. Mais de 4 milhões de moçambicanos agora têm acesso a serviços bancários através do smartphone.

### Sector Educativo
Plataformas como EduMoz estão a democratizar o acesso à educação, permitindo que estudantes em zonas rurais acedam a recursos educativos de qualidade.

### Sector Agrícola
A tecnologia está a ajudar agricultores moçambicanos a optimizar produções, aceder a mercados e receber informações meteorológicas em tempo real.

## O Futuro é Digital

A Carsai Mozambique está comprometida em ser a ponte entre a tecnologia global e as necessidades locais. Adaptamos soluções de última geração ao contexto moçambicano, garantindo impacto real e sustentável.`,
      featuredImage: POST_FEATURED_IMAGES[0],
      published: true,
      authorId: adminUser.id,
      categoryId: categories[0].id,
    },
  })

  const post2 = await db.post.create({
    data: {
      title: 'Next.js 16: O Futuro do Desenvolvimento Web em Mozambique',
      slug: 'nextjs-16-futuro-web-mozambique',
      excerpt: 'Next.js 16 traz funcionalidades revolucionárias que permitem desenvolvedores moçambicanos criar aplicações web mais rápidas e eficientes. Descubra como aproveitar esta tecnologia.',
      content: `Next.js 16 representa um marco no desenvolvimento web moderno. Para desenvolvedores moçambicanos, esta versão traz oportunidades únicas para criar aplicações que competem globalmente.

## Novidades do Next.js 16

### App Router
O App Router oferece uma nova abordagem à navegação e routing, com suporte nativo para layouts, loading states e error handling.

### Server Components
React Server Components permitem renderização no servidor, reduzindo dramaticamente o JavaScript enviado ao cliente. Ideal para conexões moçambicanas que podem ser mais lentas.

### Streaming SSR
O streaming de conteúdo permite que utilizadores vejam partes da página antes que toda a resposta esteja completa, melhorando significativamente a experiência em conexões 3G.

## Aplicação Prática em Mozambique

Na Carsai, utilizamos Next.js 16 em todos os nossos projectos principais. O Portal Carsai, EduMoz Learning e o M-Pesa Dashboard são construídos com esta tecnologia, garantindo performance óptima mesmo em condições de rede limitadas.`,
      featuredImage: POST_FEATURED_IMAGES[1],
      published: true,
      authorId: adminUser.id,
      categoryId: categories[0].id,
    },
  })

  const post3 = await db.post.create({
    data: {
      title: 'Estratégias de Negócio Digital para Empresas Moçambicanas',
      slug: 'estrategias-negocio-digital-mozambique',
      excerpt: 'Descubra as melhores estratégias para transformar o seu negócio moçambicano com tecnologia. From e-commerce to gestão digital, tudo o que precisa saber para competir no mercado.',
      content: `O mercado moçambicano está a evoluir rapidamente, e empresas que não adoptam estratégias digitais ficam atrás. Este artigo explora as melhores abordagens para negócios em Mozambique.

## Estratégias Fundamentais

### 1. Presença Digital Profissional
Um website profissional é a base de qualquer estratégia digital. Em Mozambique, onde a confiança online ainda está a crescer, um site bem construído estabelece credibilidade.

### 2. E-commerce Local
Plataformas de e-commerce adaptadas ao mercado moçambicano, com integração M-Pesa e métodos de pagamento local, são essenciais.

### 3. Marketing Digital Contextual
Estratégias de marketing que consideram o contexto local - idioma português, redes sociais populares e comportamentos de consumo moçambicanos.

### 4. Gestão de Dados
Utilizar analytics e dados para tomar decisões informadas. A análise de padrões de consumo local pode revelar oportunidades únicas.

## Casos de Sucesso em Mozambique

Empresas como a Vodacom, BCM e CDM já estão a ver resultados significativos com estratégias digitais bem executadas. A transformação não é opcional - é necessária.`,
      featuredImage: POST_FEATURED_IMAGES[2],
      published: true,
      authorId: partnerUser.id,
      categoryId: categories[1].id,
    },
  })

  const post4 = await db.post.create({
    data: {
      title: 'UI Design para o Contexto Moçambicano: Boas Práticas',
      slug: 'ui-design-contexto-mozambicano',
      excerpt: 'Como criar interfaces que funcionam para utilizadores moçambicanos. Considerações culturais, de conectividade e de acessibilidade que fazem a diferença.',
      content: `Design de interfaces não é universal. Para criar produtos que realmente funcionam em Mozambique, precisamos considerar factores locais específicos.

## Considerações Culturais

### Idioma e Comunicação
O português moçambicano tem particularidades. Interfaces devem usar linguagem familiar, evitando termos técnicos em inglês quando existe equivalente local.

### Cores e Simbolismo
Certos cores e símbolos têm significados específicos em Mozambique. Por exemplo, os cores da bandeira (verde, negro, amarelo, branco e vermelho) evocam patriotismo e união.

### Navegação e Layout
Utilizadores moçambicanos preferem navegação clara e directa. Menus complexos ou padrões ocultos podem causar frustração.

## Considerações Técnicas

### Conectividade
Design para conexões lentas - imagens optimizadas, lazy loading e conteúdo prioritário visível primeiro.

### Dispositivos
A maioria dos moçambicanos acede à internet via smartphone Android. Design mobile-first é obrigatório.

### Tamanho de Touch Targets
Em climas quentes e húmidos, precisão de touch é reduzida. Targets maiores (48px+) são essenciais.

## Boas Práticas da Carsai

Todos os nossos designs passam por testes com utilizadores moçambicanos reais. Esta abordagem garante que cada interface funciona no contexto local.`,
      featuredImage: POST_FEATURED_IMAGES[3],
      published: true,
      authorId: adminUser.id,
      categoryId: categories[2].id,
    },
  })

  const post5 = await db.post.create({
    data: {
      title: 'Desenvolvimento Mobile com React Native em Mozambique',
      slug: 'react-native-mozambique',
      excerpt: 'React Native permite criar apps móveis para o mercado moçambicano com eficiência. Descubra como integrar com M-Pesa e serviços locais.',
      content: `O desenvolvimento mobile é crucial para Mozambique, onde o smartphone é o principal dispositivo de acesso à internet. React Native oferece uma solução eficiente.

## Porque React Native?

### Performance Nativa
React Native cria apps com performance próxima de nativas, essencial para utilizadores com dispositivos Android mais básicos, comuns em Mozambique.

### Desenvolvimento Cross-Platform
Uma base de código para Android e iOS reduz custos significativamente - factor importante para startups moçambicanas com budgets limitados.

### Comunidade e Suporte
A vasta comunidade React Native significa mais recursos, bibliotecas e soluções para problemas comuns.

## Integrações Locais Moçambicanas

### M-Pesa API
Integração directa com a API do Vodacom M-Pesa para pagamentos dentro da app.

### Serviços Governamentais
Conexão com APIs de serviços públicos para emissão de documentos e pagamentos de taxas.

### Geolocalização Local
Suporte para mapas e localização adaptados às infraestruturas moçambicanas.

## Caso Prático: AgriTech Platform

A AgriTech Platform que desenvolvemos usa React Native para servir agricultores em todas as províncias de Mozambique, com funcionalidades offline para zonas sem connectivity.`,
      featuredImage: POST_FEATURED_IMAGES[4],
      published: true,
      authorId: partnerUser.id,
      categoryId: categories[3].id,
    },
  })

  const post6 = await db.post.create({
    data: {
      title: 'Inteligência Artificial e o Futuro de Mozambique',
      slug: 'inteligencia-artificial-mozambique-futuro',
      excerpt: 'A IA está a chegar a Mozambique. Desde agricultura inteligente até saúde digital, descubra como a inteligência artificial pode transformar o país.',
      content: `A inteligência artificial não é apenas para países desenvolvidos. Mozambique tem oportunidades únicas para leverage IA em sectores críticos.

## IA na Agricultura Moçambicana

### Previsão de Culturas
Machine learning models podem prever produtividade baseado em dados meteorológicos históricos de Mozambique, ajudando agricultores a planear melhor.

### Detecção de Doenças
Computer vision permite identificar doenças em culturas através de fotos tiradas com smartphones - acessível para qualquer agricultor moçambicano.

### Marketplace Inteligente
Algoritmos de recomendação conectam agricultores com compradores, optimizando a cadeia de distribuição local.

## IA na Saúde

### Telemedicina Assistida
Chatbots médicos podem fazer triagem inicial, direcionando pacientes moçambicanos para o especialista correcto sem necessidade de deslocamento.

### Análise de Historial
Processamento de dados históricos permite identificar padrões de saúde regionais, crucial para um país com desafios de saúde pública.

## IA na Educação

### Personalização de Conteúdo
Algoritmos adaptativos ajustam conteúdo educativo ao nível e progresso de cada estudante moçambicano.

### Tradução Automática
Modelos de tradução permitem criar conteúdo em línguas locais (Macua, Tsonga, Sena) automaticamente.

## A Visão da Carsai

A Carsai está a desenvolver soluções IA especificamente para o contexto moçambicano, com datasets locais e modelos treinados para as nossas realidades.`,
      featuredImage: POST_FEATURED_IMAGES[5],
      published: true,
      authorId: adminUser.id,
      categoryId: categories[4].id,
    },
  })

  const post7 = await db.post.create({
    data: {
      title: 'Cybersecurity em Mozambique: Protegendo o Futuro Digital',
      slug: 'cybersecurity-mozambique-futuro-digital',
      excerpt: 'A segurança digital é essencial para o crescimento económico de Mozambique. Saiba como proteger dados e infraestruturas contra ameaças cibernéticas.',
      content: `A cybersecurity é um desafio crescente em Mozambique. Com a digitalização acelerada, proteger dados e infraestruturas tornou-se prioritário.

## O Estado da Cybersecurity em Mozambique

### Desafios Actuais
Mozambique enfrenta desafios únicos em cybersecurity: falta de profissionais qualificados, infraestrutura limitada e regulamentação ainda em desenvolvimento.

### Leis e Regulamentação
O Decreto-Lei sobre Protecção de Dados Personais está a ser implementado, mas empresas precisam de adoptar práticas de segurança proactivamente.

## Boas Práticas para Empresas Moçambicanas

### 1. Formação e Conscientização
Investir em formação de cybersecurity para todos os colaboradores. O phishing e scams por email são as maiores ameaças.

### 2. Infraestrutura Segura
Implementar firewalls, VPNs e sistemas de detecção de intrusão. Cloud providers como AWS oferecem security layers robustas.

### 3. Backup e Recovery
Planos de backup regular e disaster recovery são essenciais. Dados devem ser armazenados em múltiplas localizações.

## A Abordagem da Carsai

Todos os projectos da Carsai integram cybersecurity desde o design. Segurança não é um add-on - é parte fundamental da arquitectura.`,
      featuredImage: svgToDataUri(FEATURED_IMAGE_SVG('Cybersecurity MZ', '#dc2626', '#991b1b')),
      published: true,
      authorId: partnerUser.id,
      categoryId: categories[0].id,
    },
  })

  const post8 = await db.post.create({
    data: {
      title: 'E-commerce em Mozambique: Tendências e Oportunidades',
      slug: 'ecommerce-mozambique-tendencias-oportunidades',
      excerpt: 'O mercado de e-commerce em Mozambique está a crescer rapidamente. Descubra as tendências e oportunidades para empreendedores moçambicanos.',
      content: `O e-commerce em Mozambique está numa fase de crescimento exponencial. Com mais moçambicanos a aceder à internet via smartphone, as oportunidades são vastas.

## Tendências do E-commerce MZ

### Mobile-First Commerce
Mais de 90% das transações online em Mozambique acontecem via smartphone. Lojas online devem ser optimizadas para mobile.

### Pagamentos Móveis
M-Pesa, e-Mola e mKash são os métodos de pagamento dominantes. A integração com estas plataformas é obrigatória.

### Social Commerce
Facebook e Instagram são os principais canais de venda. Many small businesses operam exclusively through social media.

## Oportunidades por Sector

### Moda e Vestuário
O mercado de moda online está a crescer 30% ao ano. Marcas locais como MOZA Fashion estão a ganhar tração.

### Alimentos e Bebidas
Delivery de alimentos está a expandir-se em Maputo. Plataformas como Glovo e Deliveroo estão a criar o mercado.

### Serviços Digitais
From web development a consultoria digital, serviços profissionais estão cada vez mais commercializados online.

## Como Começar

A Carsai oferece soluções completas de e-commerce adaptadas ao mercado moçambicano - desde a loja online até integração de pagamentos.`,
      featuredImage: svgToDataUri(FEATURED_IMAGE_SVG('E-commerce MZ', '#f59e0b', '#b45309')),
      published: true,
      authorId: adminUser.id,
      categoryId: categories[1].id,
    },
  })

  const post9 = await db.post.create({
    data: {
      title: 'DevOps e Cloud: Infraestrutura Moderna para Mozambique',
      slug: 'devops-cloud-infraestrutura-mozambique',
      excerpt: 'Como DevOps e cloud computing estão a transformar a infraestrutura tecnológica de empresas moçambicanas. Docker, Kubernetes e CI/CD no contexto local.',
      content: `DevOps e cloud computing são fundamentais para empresas moçambicanas que querem escalar operações digitais eficientemente.

## DevOps em Mozambique

### Containerização com Docker
Docker permite deploy consistente independentemente do ambiente. Para empresas moçambicanas com infraestrutura limitada, isto é revolucionário.

### CI/CD Pipelines
Automatização de deploy reduz erros e aumenta velocidade. GitHub Actions e GitLab CI são acessíveis e eficazes.

### Monitorização
Tools como Prometheus e Grafana permitem monitorizar aplicações em tempo real, crucial para serviços que servem milhões de moçambicanos.

## Cloud Solutions

### AWS em Mozambique
AWS oferece regions em África (Cape Town), reduzindo latência para aplicações moçambicanas.

### Azure Africa
Microsoft Azure tem investimentos significativos em África, com data centres em South Africa.

### Google Cloud
Google Cloud Platform oferece tools de AI e analytics que podem ser leverage para o mercado moçambicano.

## Caso Prático: Carsai Portal

O Portal Carsai utiliza CI/CD com GitHub Actions, deploy automático em Vercel, e monitorização com Sentry. Resultado: deploy em 2 minutos, zero downtime.`,
      featuredImage: svgToDataUri(FEATURED_IMAGE_SVG('DevOps Cloud MZ', '#2563eb', '#1e40af')),
      published: true,
      authorId: partnerUser.id,
      categoryId: categories[0].id,
    },
  })

  // Post Tags
  console.log('Creating post tags...')
  await Promise.all([
    db.postTag.create({ data: { postId: post1.id, tagId: tags[0].id } }),
    db.postTag.create({ data: { postId: post1.id, tagId: tags[4].id } }),
    db.postTag.create({ data: { postId: post2.id, tagId: tags[0].id } }),
    db.postTag.create({ data: { postId: post2.id, tagId: tags[1].id } }),
    db.postTag.create({ data: { postId: post3.id, tagId: tags[2].id } }),
    db.postTag.create({ data: { postId: post3.id, tagId: tags[6].id } }),
    db.postTag.create({ data: { postId: post4.id, tagId: tags[4].id } }),
    db.postTag.create({ data: { postId: post5.id, tagId: tags[2].id } }),
    db.postTag.create({ data: { postId: post5.id, tagId: tags[1].id } }),
    db.postTag.create({ data: { postId: post6.id, tagId: tags[5].id } }),
    db.postTag.create({ data: { postId: post6.id, tagId: tags[0].id } }),
    db.postTag.create({ data: { postId: post7.id, tagId: tags[3].id } }),
    db.postTag.create({ data: { postId: post7.id, tagId: tags[5].id } }),
    db.postTag.create({ data: { postId: post8.id, tagId: tags[2].id } }),
    db.postTag.create({ data: { postId: post8.id, tagId: tags[4].id } }),
    db.postTag.create({ data: { postId: post9.id, tagId: tags[3].id } }),
    db.postTag.create({ data: { postId: post9.id, tagId: tags[7].id } }),
  ])

  // === 9. Forum Categories & Topics ===
  console.log('Creating forum categories and topics...')
  const forumCat1 = await db.forumCategory.create({
    data: {
      name: 'Discussão General',
      slug: 'discussao-general',
      description: 'Discussões gerais sobre tecnologia e desenvolvimento em Mozambique',
      order: 1,
    },
  })

  const forumCat2 = await db.forumCategory.create({
    data: {
      name: 'Ajuda & Suporte',
      slug: 'ajuda-suporte',
      description: 'Pedir ajuda sobre questões técnicas e de desenvolvimento',
      order: 2,
    },
  })

  const forumCat3 = await db.forumCategory.create({
    data: {
      name: 'Projectos & Portfólio',
      slug: 'projectos-portfolio',
      description: 'Partilhar projectos e pedir feedback da comunidade moçambicana',
      order: 3,
    },
  })

  const forumCat4 = await db.forumCategory.create({
    data: {
      name: 'Emprego & Freelance',
      slug: 'emprego-freelance',
      description: 'Oportunidades de emprego e freelance em Mozambique e África',
      order: 4,
    },
  })

  // Forum Topics
  console.log('Creating forum topics...')
  await Promise.all([
    db.forumTopic.create({
      data: {
        title: 'Qual a melhor framework para desenvolvedores moçambicanos em 2024?',
        slug: 'melhor-framework-mozambique-2024',
        content: 'Pessoal, quais frameworks vocês estão a usar com mais sucesso no mercado moçambicano? Next.js, Angular ou Vue? Considerando factores como performance em conexões lentas e demanda do mercado local.',
        categoryId: forumCat1.id,
        authorId: demoUser.id,
        isPinned: true,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Como integrar M-Pesa numa aplicação web?',
        slug: 'integrar-mpesa-aplicacao-web',
        content: 'Estou a desenvolver uma aplicação e-commerce para um cliente em Maputo e preciso integrar pagamentos M-Pesa. Alguém tem experiência com a API do Vodacom? Que documentação existe disponível?',
        categoryId: forumCat2.id,
        authorId: demoUser.id,
        isPinned: true,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Partilha: Carsai Portal - Next.js 16 App Router',
        slug: 'carsai-portal-nextjs-16',
        content: 'Quero partilhar a experiência de desenvolver o Portal Carsai com Next.js 16 e App Router. A architecture com Server Components e Streaming SSR funcionou muito bem para o nosso contexto moçambicano.',
        categoryId: forumCat3.id,
        authorId: adminUser.id,
        isPinned: false,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Problemas com deploy em servidores moçambicanos',
        slug: 'problemas-deploy-servidores-mozambique',
        content: 'Alguém tem problemas com deploy de aplicações Node.js em ISPs moçambicanos? Latência, DNS resolução e certificados SSL são desafios constantes. Que soluções vocês encontraram?',
        categoryId: forumCat2.id,
        authorId: demoUser.id,
        isPinned: false,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Vagas de desenvolvedor em Maputo - Q1 2024',
        slug: 'vagas-desenvolvedor-maputo-2024',
        content: 'Estou a compilar vagas de desenvolvedor em Maputo para Q1 2024. Empresas como Vodacom, BCM e几家 startups estão a recrutar. Partilhe oportunidades que conheçam!',
        categoryId: forumCat4.id,
        authorId: partnerUser.id,
        isPinned: true,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'React Native vs Flutter para apps moçambicanas',
        slug: 'react-native-vs-flutter-mozambique',
        content: 'Qual a melhor escolha para desenvolvimento mobile em Mozambique? React Native ou Flutter? Considerando factors como custo de desenvolvimento, performance e integração com APIs locais.',
        categoryId: forumCat1.id,
        authorId: demoUser.id,
        isPinned: false,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'TypeScript vs JavaScript: Qual usar em Mozambique?',
        slug: 'typescript-vs-javascript-mozambique',
        content: 'Para projetos moçambicanos, TypeScript ou JavaScript puro? Considerando a escassez de desenvolvedores com experiência em TypeScript e a necessidade de código robusto.',
        categoryId: forumCat1.id,
        authorId: partnerUser.id,
        isPinned: false,
        isResolved: true,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Como construir um SaaS para o mercado moçambicano',
        slug: 'construir-saas-mercado-mozambicano',
        content: 'Quero criar um SaaS de gestão empresarial para pequenas empresas em Maputo. Que funcionalidades são mais valorizadas? Facturação, inventory, payroll? Como price para MZN?',
        categoryId: forumCat3.id,
        authorId: demoUser.id,
        isPinned: false,
      },
    }),
    db.forumTopic.create({
      data: {
        title: 'Telecommuting em Mozambique: Desafios e Soluções',
        slug: 'telecommuting-mozambique-desafios-solucoes',
        content: 'O trabalho remoto está a crescer em Mozambique mas enfrenta desafios: internet instável, falta de home office setups, e cultura de trabalho presencial. Como superar?',
        categoryId: forumCat4.id,
        authorId: adminUser.id,
        isPinned: false,
      },
    }),
  ])

  // === 11. Quotes ===
  console.log('Creating quotes...')
  const quote1 = await db.quote.create({
    data: {
      title: 'Website para Restaurante em Maputo',
      description: 'Necessito de um website profissional para o meu restaurante na Baixa de Maputo. Menu online, reservas e integração com M-Pesa para pagamentos.',
      status: 'proposed',
      userId: demoUser.id,
    },
  })

  const quote2 = await db.quote.create({
    data: {
      title: 'App Mobile para Logística',
      description: 'Desenvolvimento de aplicação móvel para gestão de entregas e tracking de carga no corridor Maputo-Beira.',
      status: 'accepted',
      userId: partnerUser.id,
    },
  })

  const quote3 = await db.quote.create({
    data: {
      title: 'Dashboard de Analytics para Farmácia',
      description: 'Dashboard para monitorização de vendas, stock e analytics de uma cadeia de farmácias em Mozambique.',
      status: 'pending',
      userId: demoUser.id,
    },
  })

  const quote4 = await db.quote.create({
    data: {
      title: 'Sistema de Gestão Escolar',
      description: 'Plataforma de gestão académica para escolas secundárias com notas, inscrições e comunicação com pais.',
      status: 'reviewed',
      userId: partnerUser.id,
    },
  })

  const quote5 = await db.quote.create({
    data: {
      title: 'Portal de Turismo para Inhambane',
      description: 'Portal turístico promovendo destinos em Inhambane - Tofo, Barra e Praia do Tofo. Reservas e informações.',
      status: 'proposed',
      userId: demoUser.id,
    },
  })

  const quote6 = await db.quote.create({
    data: {
      title: 'E-commerce para Boutique em Maputo',
      description: 'Loja online para boutique de moda com pagamento M-Pesa e delivery em Maputo.',
      status: 'accepted',
      userId: adminUser.id,
    },
  })

  const quote7 = await db.quote.create({
    data: {
      title: 'App de Micro-crédito',
      description: 'Aplicação para micro-crédito rural em Mozambique com scoring automático e pagamentos móveis.',
      status: 'rejected',
      userId: partnerUser.id,
    },
  })

  const quote8 = await db.quote.create({
    data: {
      title: 'Sistema de Facturação Electrónica',
      description: 'Sistema compliant com regulamentações do Banco de Moçambique para facturação electrónica.',
      status: 'pending',
      userId: demoUser.id,
    },
  })

  const quote9 = await db.quote.create({
    data: {
      title: 'Plataforma de Telemedicina',
      description: 'Extensão do HealthConnect para zonas rurais de Nampula e Zambezia com videochamadas.',
      status: 'reviewed',
      userId: adminUser.id,
    },
  })

  const quote10 = await db.quote.create({
    data: {
      title: 'Marketplace Agrícola Digital',
      description: 'Marketplace para connecting agricultores moçambicanos com compradores e distribuidores.',
      status: 'proposed',
      userId: partnerUser.id,
    },
  })

  // === 12. Proposals ===
  console.log('Creating proposals...')
  const proposal1 = await db.proposal.create({
    data: {
      quoteId: quote1.id,
      title: 'Proposta - Website Restaurante Maputo',
      description: 'Website profissional com design responsivo, menu digital, sistema de reservas e integração M-Pesa.',
      items: JSON.stringify([
        { description: 'Design UI/UX responsivo', quantity: 1, unitPrice: 8000, total: 8000 },
        { description: 'Desenvolvimento Frontend (Next.js)', quantity: 1, unitPrice: 12000, total: 12000 },
        { description: 'Integração M-Pesa', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Sistema de reservas', quantity: 1, unitPrice: 6000, total: 6000 },
      ]),
      totalAmount: 31000,
      validUntil: new Date('2025-06-30'),
      status: 'sent',
    },
  })

  const proposal2 = await db.proposal.create({
    data: {
      quoteId: quote2.id,
      title: 'Proposta - App Mobile Logística',
      description: 'Aplicação móvel React Native com tracking GPS, gestão de entregas e dashboard de analytics.',
      items: JSON.stringify([
        { description: 'Design UI/UX mobile', quantity: 1, unitPrice: 15000, total: 15000 },
        { description: 'Desenvolvimento React Native', quantity: 1, unitPrice: 35000, total: 35000 },
        { description: 'Backend API & GPS integration', quantity: 1, unitPrice: 20000, total: 20000 },
      ]),
      totalAmount: 70000,
      validUntil: new Date('2025-07-15'),
      status: 'accepted',
    },
  })

  const proposal3 = await db.proposal.create({
    data: {
      quoteId: quote6.id,
      title: 'Proposta - E-commerce Boutique',
      description: 'Loja online com catalogo de produtos, checkout M-Pesa/e-Mola e delivery management.',
      items: JSON.stringify([
        { description: 'E-commerce platform (Next.js)', quantity: 1, unitPrice: 25000, total: 25000 },
        { description: 'Payment integration (M-Pesa + e-Mola)', quantity: 1, unitPrice: 8000, total: 8000 },
        { description: 'Admin dashboard & inventory', quantity: 1, unitPrice: 12000, total: 12000 },
      ]),
      totalAmount: 45000,
      validUntil: new Date('2025-05-31'),
      status: 'sent',
    },
  })

  const proposal4 = await db.proposal.create({
    data: {
      quoteId: quote5.id,
      title: 'Proposta - Portal Turismo Inhambane',
      description: 'Portal turístico com destinos, reservas de accommodation, mapas interativos e blog.',
      items: JSON.stringify([
        { description: 'Portal design & development', quantity: 1, unitPrice: 22000, total: 22000 },
        { description: 'Booking system integration', quantity: 1, unitPrice: 10000, total: 10000 },
        { description: 'MapboxGL interactive maps', quantity: 1, unitPrice: 8000, total: 8000 },
      ]),
      totalAmount: 40000,
      validUntil: new Date('2025-08-30'),
      status: 'sent',
    },
  })

  // === 13. Payments ===
  console.log('Creating payments...')
  await Promise.all([
    db.payment.create({
      data: {
        proposalId: proposal2.id,
        userId: partnerUser.id,
        amount: 35000,
        method: 'mpesa',
        status: 'confirmed',
        reference: 'MPESA-2024-00123',
      },
    }),
    db.payment.create({
      data: {
        proposalId: proposal1.id,
        userId: demoUser.id,
        amount: 15500,
        method: 'transfer',
        status: 'pending',
        reference: 'BIM-2024-45678',
      },
    }),
    db.payment.create({
      data: {
        userId: demoUser.id,
        amount: 25000,
        method: 'mpesa',
        status: 'confirmed',
        reference: 'MPESA-2024-00456',
      },
    }),
    db.payment.create({
      data: {
        proposalId: proposal3.id,
        userId: adminUser.id,
        amount: 22500,
        method: 'deposit',
        status: 'confirmed',
        reference: 'DEP-2024-78901',
      },
    }),
    db.payment.create({
      data: {
        userId: partnerUser.id,
        amount: 12000,
        method: 'mpesa',
        status: 'failed',
        reference: 'MPESA-2024-00345',
      },
    }),
    db.payment.create({
      data: {
        proposalId: proposal4.id,
        userId: demoUser.id,
        amount: 20000,
        method: 'transfer',
        status: 'pending',
        reference: 'BIM-2024-11223',
      },
    }),
    db.payment.create({
      data: {
        userId: adminUser.id,
        amount: 8000,
        method: 'deposit',
        status: 'confirmed',
        reference: 'DEP-2024-33456',
      },
    }),
  ])

  // === 14. Invoices ===
  console.log('Creating invoices...')
  await Promise.all([
    db.invoice.create({
      data: {
        proposalId: proposal2.id,
        number: 'INV-2024-001',
        totalAmount: 70000,
        status: 'issued',
        dueDate: new Date('2025-04-30'),
        items: {
          create: [
            { description: 'Design UI/UX mobile', quantity: 1, unitPrice: 15000, total: 15000 },
            { description: 'Desenvolvimento React Native', quantity: 1, unitPrice: 35000, total: 35000 },
            { description: 'Backend API & GPS integration', quantity: 1, unitPrice: 20000, total: 20000 },
          ],
        },
      },
    }),
    db.invoice.create({
      data: {
        proposalId: proposal1.id,
        number: 'INV-2024-002',
        totalAmount: 31000,
        status: 'paid',
        dueDate: new Date('2025-03-15'),
        items: {
          create: [
            { description: 'Design UI/UX responsivo', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Desenvolvimento Frontend (Next.js)', quantity: 1, unitPrice: 12000, total: 12000 },
            { description: 'Integração M-Pesa', quantity: 1, unitPrice: 5000, total: 5000 },
            { description: 'Sistema de reservas', quantity: 1, unitPrice: 6000, total: 6000 },
          ],
        },
      },
    }),
    db.invoice.create({
      data: {
        proposalId: proposal3.id,
        number: 'INV-2024-003',
        totalAmount: 45000,
        status: 'overdue',
        dueDate: new Date('2025-02-28'),
        items: {
          create: [
            { description: 'E-commerce platform (Next.js)', quantity: 1, unitPrice: 25000, total: 25000 },
            { description: 'Payment integration (M-Pesa + e-Mola)', quantity: 1, unitPrice: 8000, total: 8000 },
            { description: 'Admin dashboard & inventory', quantity: 1, unitPrice: 12000, total: 12000 },
          ],
        },
      },
    }),
  ])

  // === 15. Support Tickets ===
  console.log('Creating support tickets...')
  await Promise.all([
    db.supportTicket.create({
      data: {
        userId: demoUser.id,
        subject: 'Problema com pagamento M-Pesa',
        status: 'open',
        priority: 'high',
      },
    }),
    db.supportTicket.create({
      data: {
        userId: partnerUser.id,
        subject: 'Erro no dashboard de analytics',
        status: 'in_progress',
        priority: 'medium',
      },
    }),
    db.supportTicket.create({
      data: {
        userId: demoUser.id,
        subject: 'Pedido de funcionalidade: exportação PDF',
        status: 'resolved',
        priority: 'low',
      },
    }),
    db.supportTicket.create({
      data: {
        userId: adminUser.id,
        subject: 'Configuração de SSL para domínio custom',
        status: 'closed',
        priority: 'medium',
      },
    }),
    db.supportTicket.create({
      data: {
        userId: partnerUser.id,
        subject: 'Integração com API externa não funciona',
        status: 'open',
        priority: 'urgent',
      },
    }),
    db.supportTicket.create({
      data: {
        userId: demoUser.id,
        subject: 'Dúvida sobre pricing de serviços',
        status: 'in_progress',
        priority: 'low',
      },
    }),
  ])

  // === 16. Affiliate Clicks & Commissions ===
  console.log('Creating affiliate data...')
  await Promise.all([
    db.affiliateClick.create({ data: { userId: partnerUser.id, linkCode: 'PARTNER-AF-001', ip: '192.168.1.100' } }),
    db.affiliateClick.create({ data: { userId: partnerUser.id, linkCode: 'PARTNER-AF-002', ip: '10.0.0.50' } }),
    db.affiliateClick.create({ data: { userId: partnerUser.id, linkCode: 'PARTNER-AF-003', ip: '172.16.0.25' } }),
    db.affiliateClick.create({ data: { userId: adminUser.id, linkCode: 'ADMIN-AF-001', ip: '192.168.1.200' } }),
    db.affiliateClick.create({ data: { userId: adminUser.id, linkCode: 'ADMIN-AF-002', ip: '10.0.0.75' } }),
    db.affiliateClick.create({ data: { userId: demoUser.id, linkCode: 'USER-AF-001', ip: '192.168.1.150' } }),
    db.affiliateClick.create({ data: { userId: demoUser.id, linkCode: 'USER-AF-002', ip: '172.16.0.100' } }),
    db.affiliateClick.create({ data: { userId: partnerUser.id, linkCode: 'PARTNER-AF-004', ip: '10.0.0.120' } }),
    db.affiliateClick.create({ data: { userId: partnerUser.id, linkCode: 'PARTNER-AF-005', ip: '192.168.1.180' } }),
  ])
  await Promise.all([
    db.affiliateCommission.create({ data: { userId: partnerUser.id, amount: 1500, status: 'approved' } }),
    db.affiliateCommission.create({ data: { userId: partnerUser.id, amount: 2000, status: 'pending' } }),
    db.affiliateCommission.create({ data: { userId: partnerUser.id, amount: 800, status: 'paid' } }),
    db.affiliateCommission.create({ data: { userId: adminUser.id, amount: 3000, status: 'approved' } }),
    db.affiliateCommission.create({ data: { userId: adminUser.id, amount: 1200, status: 'pending' } }),
    db.affiliateCommission.create({ data: { userId: demoUser.id, amount: 500, status: 'pending' } }),
    db.affiliateCommission.create({ data: { userId: demoUser.id, amount: 750, status: 'paid' } }),
    db.affiliateCommission.create({ data: { userId: partnerUser.id, amount: 1800, status: 'approved' } }),
    db.affiliateCommission.create({ data: { userId: partnerUser.id, amount: 2500, status: 'pending' } }),
  ])

  // === 10. Settings ===
  console.log('Creating settings...')
  await Promise.all([
    db.setting.create({
      data: {
        key: 'site_title',
        value: 'Carsai Mozambique',
      },
    }),
    db.setting.create({
      data: {
        key: 'default_language',
        value: 'pt-pt',
      },
    }),
    db.setting.create({
      data: {
        key: 'site_description',
        value: 'Carsai Mozambique - Soluções tecnológicas inovadoras para empresas moçambicanas. Web development, mobile apps, UI/UX design, cloud solutions e mais.',
      },
    }),
    db.setting.create({
      data: {
        key: 'contact_email',
        value: 'info@carsai.mz',
      },
    }),
    db.setting.create({
      data: {
        key: 'contact_phone',
        value: '+258 21 123 456',
      },
    }),
    db.setting.create({
      data: {
        key: 'address',
        value: 'Av. Julius Nyerere, 123, Maputo, Mozambique',
      },
    }),
    db.setting.create({
      data: {
        key: 'currency',
        value: 'MZN',
      },
    }),
    db.setting.create({
      data: {
        key: 'social_facebook',
        value: 'https://facebook.com/carsaimz',
      },
    }),
    db.setting.create({
      data: {
        key: 'social_instagram',
        value: 'https://instagram.com/carsaimz',
      },
    }),
    db.setting.create({
      data: {
        key: 'social_linkedin',
        value: 'https://linkedin.com/company/carsai-mozambique',
      },
    }),
  ])

  // === 11. Notifications ===
  console.log('Creating notifications...')
  await Promise.all([
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Bem-vindo ao Carsai Mozambique!',
        message: 'O seu registo foi confirmado. Explore os nossos serviços e comece a transformar o seu negócio digital.',
        type: 'success',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Novo serviço disponível',
        message: 'O serviço de AI & Data Analytics está agora disponível. Descubra como a inteligência artificial pode ajudar o seu negócio.',
        type: 'info',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Actualização do Portal Carsai',
        message: 'Novas funcionalidades foram adicionadas ao portal: gestão de projectos e área de forum.',
        type: 'info',
        isRead: true,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Manutenção programada',
        message: 'O sistema estará em manutenção no sábado de 02:00-04:00 GMT. Planeie as suas actividades accordingly.',
        type: 'warning',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Proposta aceite',
        message: 'A sua proposta para o projecto EduMoz Learning foi aceite! Contacte o gestor de projecto para iniciar.',
        type: 'success',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Pagamento confirmado',
        message: 'O pagamento de MZN 25,000 via M-Pesa foi confirmado. O recibo está disponível na sua área de cliente.',
        type: 'success',
        isRead: true,
      },
    }),
    db.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Nova proposta recebida',
        message: 'Uma nova proposta para E-commerce Boutique foi submetida. Revise e responda no painel administrativo.',
        type: 'info',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: partnerUser.id,
        title: 'Commission aprovada',
        message: 'A sua affiliate commission de MZN 1,500 foi aprovada. O pagamento será processado no próximo ciclo.',
        type: 'success',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Invoice overdue',
        message: 'A invoice INV-2024-003 está overdue. Contacte o cliente para follow-up.',
        type: 'warning',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: partnerUser.id,
        title: 'Novo ticket de suporte',
        message: 'Um ticket urgente sobre integração de API externa foi criado. Prioridade alta - necessita atenção imediata.',
        type: 'error',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: demoUser.id,
        title: 'Nova funcionalidade: Profile editing',
        message: 'Agora pode editar o seu perfil - nome, telefone, empresa, bio e endereço. Actualize a sua informação!',
        type: 'info',
        isRead: false,
      },
    }),
    db.notification.create({
      data: {
        userId: adminUser.id,
        title: 'Relatório mensal disponível',
        message: 'O relatório mensal de Março 2025 está disponível com analytics de vendas, proposals e customer insights.',
        type: 'success',
        isRead: true,
      },
    }),
  ])

  // === 12. File Attachments (base64 stored files) ===
  console.log('Creating file attachments...')
  const fileAttachments = await Promise.all([
    db.fileAttachment.create({
      data: {
        name: 'carsai-logo.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(LOGO_SVG).length,
        data: LOGO_DATA_URI,
        category: 'image',
        userId: adminUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'admin-avatar.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(AVATAR_SVG_TEMPLATE('CS', '#10b981')).length,
        data: AVATAR_ADMIN,
        category: 'avatar',
        userId: adminUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'partner-avatar.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(AVATAR_SVG_TEMPLATE('AF', '#8b5cf6')).length,
        data: AVATAR_PARTNER,
        category: 'avatar',
        userId: partnerUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'user-avatar.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(AVATAR_SVG_TEMPLATE('JM', '#f59e0b')).length,
        data: AVATAR_USER,
        category: 'avatar',
        userId: demoUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'project-carsai-portal-home.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(PROJECT_IMAGE_SVG('Carsai Portal - Home', '#10b981', '#0d9488')).length,
        data: PROJECT_IMAGES_DATA['carsai-portal'][0],
        category: 'image',
        userId: adminUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'project-mpesa-dashboard.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(PROJECT_IMAGE_SVG('M-Pesa Dashboard - Analytics', '#2563eb', '#1d4ed8')).length,
        data: PROJECT_IMAGES_DATA['mpesa-dashboard'][0],
        category: 'image',
        userId: adminUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'post-featured-digital-transformation.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(FEATURED_IMAGE_SVG('Transformação Digital', '#10b981', '#047857')).length,
        data: POST_FEATURED_IMAGES[0],
        category: 'image',
        userId: adminUser.id,
      },
    }),
    db.fileAttachment.create({
      data: {
        name: 'testimonial-ricardo-avatar.svg',
        mimeType: 'image/svg+xml',
        size: Buffer.from(AVATAR_SVG_TEMPLATE('RM', '#2563eb')).length,
        data: TESTIMONIAL_AVATARS[0],
        category: 'avatar',
        userId: adminUser.id,
      },
    }),
  ])

  // === Summary ===
  console.log('🇲🇿 Carsai Mozambique seeding completed!')
  console.log(`  - Roles: 3 (admin, partner, user)`)
  console.log(`  - Users: 3 (admin, partner, demo) - with company, bio, address, base64 avatars`)
  console.log(`  - Services: ${services.length} - with base64 icon SVGs`)
  console.log(`  - Projects: ${projects.length} - with base64 images`)
  console.log(`  - Testimonials: ${testimonials.length} - with base64 avatars`)
  console.log(`  - Categories: ${categories.length}`)
  console.log(`  - Tags: ${tags.length}`)
  console.log(`  - Posts: 9 - with base64 featured images`)
  console.log(`  - Forum Categories: 4`)
  console.log(`  - Forum Topics: 9`)
  console.log(`  - Quotes: 10`)
  console.log(`  - Proposals: 4`)
  console.log(`  - Payments: 7`)
  console.log(`  - Invoices: 3`)
  console.log(`  - Support Tickets: 6`)
  console.log(`  - Affiliate Clicks: 9`)
  console.log(`  - Affiliate Commissions: 9`)
  console.log(`  - Settings: 10`)
  console.log(`  - Notifications: 13`)
  console.log(`  - File Attachments: ${fileAttachments.length} - base64 stored files`)

  return {
    roles: 3,
    users: 3,
    services: services.length,
    projects: projects.length,
    testimonials: testimonials.length,
    categories: categories.length,
    tags: tags.length,
    posts: 9,
    forumCategories: 4,
    forumTopics: 9,
    quotes: 10,
    proposals: 4,
    payments: 7,
    invoices: 3,
    supportTickets: 6,
    affiliateClicks: 9,
    affiliateCommissions: 9,
    settings: 10,
    notifications: 13,
    fileAttachments: fileAttachments.length,
  }
}
