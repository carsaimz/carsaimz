import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Uses z-ai-web-dev-sdk as the primary AI provider.
 * The SDK auto-configures via ZAI.create() — no .z-ai-config file needed.
 *
 * IMPORTANT: z-ai-web-dev-sdk MUST be used in backend code only.
 * System prompts use role: 'assistant' (not 'system') per SDK convention.
 */

// ── Hardcoded Site Context (no database dependency) ──

const CARSAI_CONTEXT = `You are the Carsai Mozambique assistant — a knowledgeable, friendly, and concise AI chatbot. Carsai Mozambique offers Soluções Digitais e Hospedagem Web Gratuita — including FREE shared hosting (Apache) provided by ifastnet/byet.

=== COMPANY INFORMATION ===
- Company: Carsai Mozambique
- Email: carsaimozambique@gmail.com, suporte.carsaimz@gmail.com
- Phone/M-Pesa: 847545020, 874512581, 84246463, 835020143
- WhatsApp: wa.me/258847545020
- Address: Montepuez, Cabo Delgado, Mozambique
- Website: https://carsai.mz
- GitHub: https://github.com/carsaimz

=== SERVICES ===
- Web Development: Custom websites, web apps, e-commerce — starting from MT 5,000
- FREE Web Hosting: Apache shared hosting provided by ifastnet/byet (no cost!)
- Domain Registration: .mz, .com, .net, .org domains
- SSL Certificates: Free Let's Encrypt and premium options
- SEO Optimization: Search engine optimization for better visibility
- Mobile App Development: Android and iOS apps
- Graphic Design: Logos, branding, marketing materials

=== IMPORTANT RULES ===
1. Always respond in the same language the user writes in (Portuguese, English, French, etc.).
2. Be helpful, friendly, and concise.
3. Never invent or guess information — if you don't know, say so and suggest contacting us directly.
4. When asked about pricing, mention base prices from the services list and that FREE hosting is available.
5. Mention our FREE hosting offering (Apache shared hosting by ifastnet/byet) when relevant.
6. Payment methods: M-Pesa (mobile money), bank transfers, international credit cards.
7. Currency: Mozambican Metical (MT), USD also accepted.
8. For detailed quotes, direct users to contact us via email or WhatsApp.
9. Development services start at MT 5,000 — no service is completely free except web hosting.
10. The FREE hosting is provided by ifastnet/byet (Apache shared hosting), not by Carsai directly.
`

// ── Singleton ZAI instance (reuse across requests) ──

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZaiInstance() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
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

    // ── Build messages array with session context ──
    // Note: SDK uses role: 'assistant' for system prompts, not 'system'
    const aiMessages: Array<{ role: 'assistant' | 'user'; content: string }> = [
      { role: 'assistant', content: CARSAI_CONTEXT },
    ]

    // Add session context (previous messages)
    if (context && Array.isArray(context)) {
      for (const ctxMsg of context.slice(-10)) {
        const role = ctxMsg.role as string
        if (role === 'user' || role === 'assistant') {
          aiMessages.push({
            role: role as 'assistant' | 'user',
            content: ctxMsg.content as string,
          })
        }
      }
    }

    // Add the current user message
    aiMessages.push({ role: 'user', content: message })

    // ── Call Z.ai SDK ──
    const zai = await getZaiInstance()
    const completion = await zai.chat.completions.create({
      messages: aiMessages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices?.[0]?.message?.content

    if (response && response.trim().length > 0) {
      return NextResponse.json({
        success: true,
        response,
        provider: 'z_ai',
        sessionId: sessionId || `session-${Date.now()}`,
      })
    }

    // ── Empty response from Z.ai ──
    console.error('[Chat] Z.ai returned empty response')
    return NextResponse.json({
      success: false,
      error: 'Não foi possível gerar uma resposta. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com',
      sessionId: sessionId || `session-${Date.now()}`,
    })

  } catch (error) {
    console.error('[Chat] Error:', error)

    // Reset ZAI instance on error (might be stale)
    zaiInstance = null

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error'

    // Check if it's a connection/config error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return NextResponse.json({
        success: false,
        error: 'Erro de ligação ao servidor de IA. Por favor, tente novamente em alguns minutos.',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com',
      },
      { status: 500 }
    )
  }
}
