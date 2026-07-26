import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Carsai Mozambique - Enhanced AI Chat API Endpoint
 *
 * Connected to the database to read real site content (services, projects,
 * testimonials, posts, forum topics, pages, FAQ, settings).
 * Uses z-ai-web-dev-sdk for AI responses with full site context.
 * Supports session-based memory (messages passed from client localStorage).
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, sessionId } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // ── Fetch real site content from database ──
    const [
      services,
      projects,
      testimonials,
      publishedPosts,
      forumTopics,
      pages,
      settings,
      faqContent,
    ] = await Promise.all([
      db.service.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, description: true, basePrice: true, icon: true, isFeatured: true },
      }),
      db.project.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, description: true, client: true, technologies: true, demoUrl: true, isFeatured: true },
      }),
      db.testimonial.findMany({
        where: { isPublished: true },
        select: { id: true, name: true, company: true, content: true, rating: true },
      }),
      db.post.findMany({
        where: { published: true },
        select: { id: true, title: true, slug: true, excerpt: true, createdAt: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      db.forumTopic.findMany({
        select: { id: true, title: true, slug: true, isResolved: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      db.page.findMany({
        where: { isPublished: true },
        select: { id: true, slug: true, title: true, content: true },
      }),
      db.setting.findMany({
        select: { key: true, value: true },
      }),
      // Try to get FAQ content from pages or settings
      db.setting.findFirst({
        where: { key: 'faq_content' },
      }),
    ])

    // ── Build settings map ──
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value || ''
    }

    // ── Build comprehensive site context for the AI ──
    const servicesList = services.map(s =>
      `- ${s.title} (${s.slug}): ${s.description || 'N/A'} | Preço base: MT ${(s.basePrice || 0).toLocaleString()} | ${s.isFeatured ? 'Destacado' : 'Regular'}`
    ).join('\n')

    const projectsList = projects.map(p =>
      `- ${p.title} (${p.slug}): ${p.description || 'N/A'} | Cliente: ${p.client || 'N/A'} | Tecnologias: ${p.technologies || 'N/A'} | ${p.isFeatured ? 'Destacado' : 'Regular'}`
    ).join('\n')

    const testimonialsList = testimonials.map(t =>
      `- ${t.name} (${t.company || 'N/A'}): "${t.content}" | Rating: ${t.rating}/5`
    ).join('\n')

    const postsList = publishedPosts.map(p =>
      `- ${p.title} (${p.slug}): ${p.excerpt || 'N/A'}`
    ).join('\n')

    const forumTopicsList = forumTopics.map(f =>
      `- ${f.title} (${f.slug}): ${f.isResolved ? 'Resolvido' : 'Em discussão'}`
    ).join('\n')

    const pagesList = pages.map(p =>
      `- ${p.title} (${p.slug}): ${(p.content || '').substring(0, 200)}...`
    ).join('\n')

    const carsaiContext = `You are the Carsai Mozambique assistant — a knowledgeable, friendly, and concise AI chatbot. Carsai Moçambique offers Soluções Digitais e Desenvolvimento Web Gratuita — including FREE shared hosting (Apache) provided by ifastnet/byet.

=== CURRENT SITE CONTENT (from database) ===

SERVICES (${services.length} available):
${servicesList}

PROJECTS (${projects.length} completed):
${projectsList}

TESTIMONIALS (${testimonials.length}):
${testimonialsList}

BLOG POSTS (${publishedPosts.length} published):
${postsList}

FORUM TOPICS (${forumTopics.length}):
${forumTopicsList}

PAGES:
${pagesList}

SITE SETTINGS:
- Company: ${settingsMap['company_name'] || 'Carsai Moçambique'}
- Email: ${settingsMap['contact_email'] || 'info@carsai.mz'}
- Phone: ${settingsMap['contact_phone'] || '+258 21 000 000'}
- Address: ${settingsMap['contact_address'] || 'Maputo, Moçambique'}
- Website: ${settingsMap['website_url'] || 'https://carsai.mz'}
- Free Hosting: Yes, provided by ifastnet/byet (Apache shared hosting)

=== IMPORTANT RULES ===
1. Always use the REAL data above when answering questions about services, projects, prices, testimonials, blog posts, etc.
2. Never invent or guess information — if you don't find it in the context above, say you don't have that specific information and suggest the user contact us directly.
3. Be helpful, friendly, and concise.
4. Always respond in the same language the user writes in (Portuguese, English, etc.).
5. When asked about pricing, mention the base prices from the services list and that FREE hosting is available.
6. When asked about projects, reference the actual projects and clients listed above.
7. When asked about testimonials, reference the actual testimonials and ratings.
8. Mention our FREE hosting offering (Apache shared hosting by ifastnet/byet) when relevant.
9. Payment methods: M-Pesa (mobile money), bank transfers, international credit cards.
10. Currency: Mozambican Metical (MT), USD also accepted.
`

    // ── Build messages array with session context ──
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: carsaiContext },
    ]

    // Add session context (messages stored in localStorage on client side)
    if (context && Array.isArray(context)) {
      // Include up to 10 previous messages for better memory
      for (const ctxMsg of context.slice(-10)) {
        aiMessages.push({
          role: ctxMsg.role as string,
          content: ctxMsg.content as string,
        })
      }
    }

    // Add the current user message
    aiMessages.push({ role: 'user', content: message })

    // ── Try using z-ai-web-dev-sdk ──
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        model: 'default',
        messages: aiMessages,
      })

      const responseText = completion.choices?.[0]?.message?.content || ''

      if (responseText) {
        return NextResponse.json({
          success: true,
          response: responseText,
          sessionId: sessionId || `session-${Date.now()}`,
        })
      }
    } catch (aiError) {
      console.error('AI SDK error:', aiError)
      // Fall through to fallback response
    }

    // ── Fallback: Generate contextual response using real data ──
    const fallbackResponse = generateContextualFallback(message, services, projects, testimonials, publishedPosts, settingsMap)
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      sessionId: sessionId || `session-${Date.now()}`,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process your message',
      },
      { status: 500 }
    )
  }
}

// ── Contextual fallback using real database data ──
function generateContextualFallback(
  message: string,
  services: Array<{ title: string; description: string | null; basePrice: number | null; slug: string }>,
  projects: Array<{ title: string; description: string | null; client: string | null; technologies: string | null; slug: string }>,
  testimonials: Array<{ name: string; company: string | null; content: string; rating: number }>,
  posts: Array<{ title: string; excerpt: string | null; slug: string }>,
  settingsMap: Record<string, string>
): string {
  const lowerMsg = message.toLowerCase()

  // Detect language
  const isPortuguese = /serviço|preço|cotação|parceiro|pagamento|moçambique|como|que|podemos|quando|quanto|hospedagem|gratis|gratuita/.test(lowerMsg)

  if (isPortuguese) {
    // Services question
    if (/serviço|service|offer|oferece|solução/.test(lowerMsg)) {
      const servicesList = services.map(s => `• ${s.title}: ${s.description || 'Soluções digitais'} (MT ${(s.basePrice || 0).toLocaleString()})`).join('\n')
      return `A Carsai Moçambique oferece Soluções Digitais e Desenvolvimento Web Gratuita! Nossos serviços:\n\n${servicesList}\n\n Também oferecemos hospedagem gratuita compartilhada (Apache) fornecida pela ifastnet/byet. Contacte-nos para mais detalhes!`
    }

    // Hosting question
    if (/hospedagem|hosting|gratis|gratuita|free/.test(lowerMsg)) {
      return `Sim! A Carsai Moçambique oferece hospedagem gratuita compartilhada (Apache) fornecida pela ifastnet/byet. Esta hospedagem é ideal para sites pessoais, blogs e pequenos projetos. Para planos mais avançados, contacte-nos directamente em ${settingsMap['contact_email'] || 'info@carsai.mz'}.`
    }

    // Projects question
    if (/projecto|projeto|project|portfolio|trabalho/.test(lowerMsg)) {
      const projectsList = projects.map(p => `• ${p.title} (${p.client || 'Cliente variado'}): ${p.description?.substring(0, 80) || 'Projecto digital'}`).join('\n')
      return `Nossos projectos completados:\n\n${projectsList}\n\nContacte-nos para ver demonstrações ou discutir o seu projecto!`
    }

    // Testimonials
    if (/depoimento|testimonial|opinião|review|feedback/.test(lowerMsg)) {
      if (testimonials.length === 0) return 'Ainda não temos depoimentos disponíveis. Seja o primeiro a deixar o seu feedback!'
      const topTestimonial = testimonials[0]
      return `Um dos nossos depoimentos: "${topTestimonial.content}" — ${topTestimonial.name}, ${topTestimonial.company || 'N/A'} (${topTestimonial.rating}/5). Temos ${testimonials.length} depoimentos de clientes satisfeitos!`
    }

    // Blog/posts
    if (/blog|artigo|post|notícia|conteúdo/.test(lowerMsg)) {
      if (posts.length === 0) return 'Ainda não temos artigos publicados. Fique atento para novidades!'
      const postsList = posts.slice(0, 5).map(p => `• ${p.title}`).join('\n')
      return `Artigos recentes no nosso blog:\n\n${postsList}\n\nVisite a secção Blog para ler mais!`
    }

    // Price/quote
    if (/cotação|quote|preço|price|custo|valor/.test(lowerMsg)) {
      return `Para solicitar uma cotação, use o formulário na secção "Financeiro" do nosso site, ou contacte-nos directamente via ${settingsMap['contact_email'] || 'info@carsai.mz'} ou ${settingsMap['contact_phone'] || '+258 21 000 000'}. Aceitamos M-Pesa, transferência bancária e cartão de crédito.`
    }

    // Payment
    if (/pagamento|payment|mpesa|banco/.test(lowerMsg)) {
      return `Aceitamos M-Pesa (dinheiro móvel), transferência bancária e pagamentos internacionais via cartão de crédito. O Metical (MT) é a nossa moeda principal, mas também aceitamos USD.`
    }

    // Partner
    if (/parceiro|partner|afiliado|comissão/.test(lowerMsg)) {
      return `O programa de parceiros Carsai permite ganhar comissões sobre cada referência! Registe-se no nosso site para se juntar ao programa e começar a ganhar.`
    }

    return `Olá! Sou o assistente virtual da Carsai Moçambique — Soluções Digitais e Desenvolvimento Web Gratuita. Posso ajudar com informações sobre nossos serviços (${services.length} disponíveis), projectos (${projects.length} completados), hospedagem gratuita, cotações, métodos de pagamento e programa de parceiros. Como posso ajudar?`
  }

  // English responses
  if (/service|offer|what|solution/.test(lowerMsg)) {
    const servicesList = services.map(s => `• ${s.title}: ${s.description || 'Digital solutions'} (MT ${(s.basePrice || 0).toLocaleString()})`).join('\n')
    return `Carsai Mozambique offers Digital Solutions & Free Web Development! Our services:\n\n${servicesList}\n\nWe also offer FREE shared hosting (Apache) provided by ifastnet/byet. Contact us for more details!`
  }

  if (/hosting|free|gratis|gratuita/.test(lowerMsg)) {
    return `Yes! Carsai Mozambique offers FREE shared hosting (Apache) provided by ifastnet/byet. This hosting is ideal for personal sites, blogs, and small projects. For more advanced plans, contact us at ${settingsMap['contact_email'] || 'info@carsai.mz'}.`
  }

  if (/project|portfolio|work/.test(lowerMsg)) {
    const projectsList = projects.map(p => `• ${p.title} (${p.client || 'Various client'}): ${p.description?.substring(0, 80) || 'Digital project'}`).join('\n')
    return `Our completed projects:\n\n${projectsList}\n\nContact us to see demos or discuss your project!`
  }

  if (/testimonial|review|feedback|opinion/.test(lowerMsg)) {
    if (testimonials.length === 0) return 'We don\'t have testimonials available yet. Be the first to leave your feedback!'
    const topTestimonial = testimonials[0]
    return `One of our testimonials: "${topTestimonial.content}" — ${topTestimonial.name}, ${topTestimonial.company || 'N/A'} (${topTestimonial.rating}/5). We have ${testimonials.length} testimonials from satisfied clients!`
  }

  return `Hello! I'm the Carsai Mozambique virtual assistant — Digital Solutions & Free Web Development. I can help with information about our ${services.length} services, ${projects.length} projects, free hosting, quotes, payment methods, and the partner program. How can I help you today?`
}
