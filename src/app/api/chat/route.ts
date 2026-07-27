import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Multi-provider failover system:
 * 1. Try providers in priority order (Z.ai first by default)
 * 2. If one fails, try the next one
 * 3. Admin can add/configure providers via /api/admin/ai-providers
 * 4. NO hardcoded fallback responses — always use real AI
 *
 * Connected to database for real site context.
 */

// ── Provider call implementations ──

async function callZai(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      model: 'default',
      messages,
    })
    return completion.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[Z.ai] Provider error:', err)
    return null
  }
}

async function callOpenAICompatible(
  apiKey: string,
  baseUrl: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  extraConfig?: Record<string, unknown>
): Promise<string | null> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
    const body = {
      model,
      messages,
      ...extraConfig,
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000), // 15s timeout
    })
    if (!res.ok) {
      console.error(`[OpenAI-compatible] HTTP ${res.status} from ${url}`)
      return null
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[OpenAI-compatible] Provider error:', err)
    return null
  }
}

// ── Route handler ──

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
    ] = await Promise.all([
      db.service.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, description: true, basePrice: true, isFeatured: true },
      }),
      db.project.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, description: true, client: true, technologies: true, isFeatured: true },
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
    ])

    // ── Build settings map ──
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value || ''
    }

    // ── Build comprehensive site context ──
    const servicesList = services.map(s =>
      `- ${s.title} (${s.slug}): ${s.description || 'N/A'} | Preço base: MT ${(s.basePrice || 0).toLocaleString()} | ${s.isFeatured ? 'Destacado' : 'Regular'}`
    ).join('\n')

    const projectsList = projects.map(p =>
      `- ${p.title} (${p.slug}): ${p.description || 'N/A'} | Cliente: ${p.client || 'N/A'} | Tecnologias: ${p.technologies || 'N/A'}`
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

    const carsaiContext = `You are the Carsai Mozambique assistant — a knowledgeable, friendly, and concise AI chatbot. Carsai Mozambique offers Soluções Digitais e Hospedagem Web Gratuita — including FREE shared hosting (Apache) provided by ifastnet/byet.

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
- Company: ${settingsMap['company_name'] || 'Carsai Mozambique'}
- Email: ${settingsMap['contact_email'] || 'info@carsai.mz'}
- Phone: ${settingsMap['contact_phone'] || '+258 21 000 000'}
- Address: ${settingsMap['contact_address'] || 'Maputo, Mozambique'}
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

    // Add session context
    if (context && Array.isArray(context)) {
      for (const ctxMsg of context.slice(-10)) {
        aiMessages.push({
          role: ctxMsg.role as string,
          content: ctxMsg.content as string,
        })
      }
    }

    // Add the current user message
    aiMessages.push({ role: 'user', content: message })

    // ── Multi-provider failover: try providers in priority order ──
    // Always try Z.ai first (built-in), then configured external providers

    // 1. Try Z.ai (always available, no key needed)
    const zaiResponse = await callZai(aiMessages)
    if (zaiResponse) {
      return NextResponse.json({
        success: true,
        response: zaiResponse,
        provider: 'z_ai',
        sessionId: sessionId || `session-${Date.now()}`,
      })
    }

    // 2. Try configured external providers in priority order
    const providers = await db.aiProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    })

    for (const provider of providers) {
      if (!provider.apiKey || !provider.baseUrl || !provider.model) continue

      // Parse extra config
      let extraConfig: Record<string, unknown> = {}
      if (provider.config) {
        try { extraConfig = JSON.parse(provider.config) } catch { /* ignore */ }
      }

      const response = await callOpenAICompatible(
        provider.apiKey,
        provider.baseUrl,
        provider.model,
        aiMessages,
        extraConfig,
      )

      if (response) {
        return NextResponse.json({
          success: true,
          response,
          provider: provider.name,
          sessionId: sessionId || `session-${Date.now()}`,
        })
      }
    }

    // ── All providers failed — return honest error, NO fake responses ──
    console.error('[Chat] All AI providers failed for message:', message.substring(0, 50))
    return NextResponse.json({
      success: false,
      error: 'Todos os provedores de IA estão indisponíveis no momento. Por favor, tente novamente em alguns minutos.',
      sessionId: sessionId || `session-${Date.now()}`,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno. Por favor, tente novamente.',
      },
      { status: 500 }
    )
  }
}
