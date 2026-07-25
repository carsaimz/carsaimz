import { db } from '@/lib/db'

/**
 * Seeds the Carsai Mozambique database with demo data.
 * Clears existing data first to ensure clean state.
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

  // === 2. Demo Users ===
  console.log('Creating demo users...')
  const adminUser = await db.user.create({
    data: {
      email: 'admin@carsai.mz',
      name: 'Carlos Silva',
      phone: '+258 84 123 4567',
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
      roleId: userRole.id,
      isActive: true,
      emailVerified: true,
    },
  })

  // === 3. Services ===
  console.log('Creating services...')
  const services = await Promise.all([
    db.service.create({
      data: {
        slug: 'web-development',
        title: 'Web Development',
        description: 'Desenvolvimento de websites e aplicações web modernas com Next.js, React e TypeScript. Soluções completas para empresas moçambicanas que necessitam de presença digital profissional.',
        icon: 'Globe',
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
        icon: 'Smartphone',
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
        icon: 'Palette',
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
        icon: 'Cloud',
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
        icon: 'Server',
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
        icon: 'Brain',
        basePrice: 20000,
        isFeatured: true,
        isPublished: true,
        order: 6,
      },
    }),
  ])

  // === 4. Projects ===
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
        isPublished: true,
        isFeatured: false,
      },
    }),
  ])

  // === 5. Testimonials ===
  console.log('Creating testimonials...')
  const testimonials = await Promise.all([
    db.testimonial.create({
      data: {
        name: 'Ricardo Mondlane',
        company: 'Vodacom Mozambique',
        content: 'A Carsai transformou completamente a nossa visão digital. O dashboard M-Pesa que desenvolveram é intuitivo, rápido e totalmente adaptado ao nosso mercado. A equipa understanding do contexto local moçambicano foi fundamental para o sucesso.',
        rating: 5,
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Teresa Nhaca',
        company: 'Banco Commercial de Mozambique',
        content: 'Trabalhar com a Carsai foi uma experiência excepcional. A plataforma de gestão financeira que criaram para nós reduziu o tempo de processamento de transações em 60%. Recomendo sem hesitação.',
        rating: 5,
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Antonio Zuvale',
        company: 'AgriTech Mozambique',
        content: 'A Carsai compreendeu as necessidades únicas dos agricultores moçambicanos e criou uma plataforma que realmente funciona no nosso contexto. A integração com dados meteorológicos locais e o marketplace foram um game-changer.',
        rating: 4,
        isPublished: true,
      },
    }),
    db.testimonial.create({
      data: {
        name: 'Maria Langa',
        company: 'Instituto Nacional de Saúde',
        content: 'O sistema HealthConnect da Carsai está a salvar vidas em Mozambique. A telemedicina permite que pacientes em zonas rurais acedam a médicos especializados em Maputo. A tecnologia adaptada às nossas realidades.',
        rating: 5,
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

  // === 8. Blog Posts ===
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
      published: true,
      authorId: adminUser.id,
      categoryId: categories[4].id,
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
  ])

  // === Summary ===
  console.log('🇲🇿 Carsai Mozambique seeding completed!')
  console.log(`  - Roles: 3 (admin, partner, user)`)
  console.log(`  - Users: 3 (admin, partner, demo)`)
  console.log(`  - Services: ${services.length}`)
  console.log(`  - Projects: ${projects.length}`)
  console.log(`  - Testimonials: ${testimonials.length}`)
  console.log(`  - Categories: ${categories.length}`)
  console.log(`  - Tags: ${tags.length}`)
  console.log(`  - Posts: 6`)
  console.log(`  - Forum Categories: 4`)
  console.log(`  - Forum Topics: 6`)
  console.log(`  - Settings: 10`)
  console.log(`  - Notifications: 6`)

  return {
    roles: 3,
    users: 3,
    services: services.length,
    projects: projects.length,
    testimonials: testimonials.length,
    categories: categories.length,
    tags: tags.length,
    posts: 6,
    forumCategories: 4,
    forumTopics: 6,
    settings: 10,
    notifications: 6,
  }
}
