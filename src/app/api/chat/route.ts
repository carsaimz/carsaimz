import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Multi-provider failover system (NO Prisma/Database dependency):
 * 1. Try Z.ai SDK first (reads .z-ai-config automatically)
 * 2. Try Z.ai Direct API (reads .z-ai-config and calls API directly)
 * 3. Try configured external providers (from AI_PROVIDER_CONFIG env var)
 *
 * Site context is hardcoded — no database needed.
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

// ── Config caching for .z-ai-config ──

let cachedConfig: { baseUrl: string; apiKey: string; token?: string; chatId?: string; userId?: string } | null = null

async function loadZaiConfig() {
  if (cachedConfig) return cachedConfig

  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(require('os').homedir(), '.z-ai-config'),
    '/etc/.z-ai-config',
  ]

  for (const filePath of configPaths) {
    try {
      const configStr = await fs.readFile(filePath, 'utf-8')
      const config = JSON.parse(configStr)
      if (config.baseUrl && config.apiKey) {
        cachedConfig = config
        return config
      }
    } catch {
      // Continue to next path
    }
  }

  return null
}

// ── Provider call implementations ──

async function callZai(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  try {
    // Dynamic import — z-ai-web-dev-sdk reads .z-ai-config automatically
    let ZAI
    try {
      const sdkModule = await import('z-ai-web-dev-sdk')
      ZAI = sdkModule.default || sdkModule
    } catch (importErr) {
      console.warn('[Z.ai] SDK not available:', (importErr as Error).message)
      return null
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      model: 'default',
      messages,
    })
    return completion.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[Z.ai] SDK error:', err)
    return null
  }
}

async function callZaiDirect(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  try {
    const config = await loadZaiConfig()
    if (!config) return null

    const url = `${config.baseUrl}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z',
    }

    if (config.chatId) headers['X-Chat-Id'] = config.chatId
    if (config.userId) headers['X-User-Id'] = config.userId
    if (config.token) headers['X-Token'] = config.token

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        thinking: { type: 'disabled' },
      }),
      signal: AbortSignal.timeout(20000), // 20s timeout
    })

    if (!response.ok) {
      console.error(`[Z.ai Direct] HTTP ${response.status} from ${url}`)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[Z.ai Direct] Error:', err)
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
    const body = { model, messages, ...extraConfig }
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
    console.error('[OpenAI-compatible] Error:', err)
    return null
  }
}

// ── Load external providers from environment ──

interface ExternalProvider {
  name: string
  apiKey: string
  baseUrl: string
  model: string
  priority?: number
  config?: Record<string, unknown>
}

function loadExternalProviders(): ExternalProvider[] {
  try {
    const configStr = process.env.AI_PROVIDER_CONFIG
    if (!configStr) return []
    const providers = JSON.parse(configStr)
    if (!Array.isArray(providers)) return []
    return providers.filter((p: ExternalProvider) => p.apiKey && p.baseUrl && p.model)
  } catch {
    return []
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

    // ── Build messages array with session context ──
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: CARSAI_CONTEXT },
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

    // 1. Try Z.ai SDK (reads .z-ai-config automatically)
    const zaiResponse = await callZai(aiMessages)
    if (zaiResponse) {
      return NextResponse.json({
        success: true,
        response: zaiResponse,
        provider: 'z_ai',
        sessionId: sessionId || `session-${Date.now()}`,
      })
    }

    // 2. Try Z.ai Direct API (bypasses SDK, reads .z-ai-config manually)
    const zaiDirectResponse = await callZaiDirect(aiMessages)
    if (zaiDirectResponse) {
      return NextResponse.json({
        success: true,
        response: zaiDirectResponse,
        provider: 'z_ai_direct',
        sessionId: sessionId || `session-${Date.now()}`,
      })
    }

    // 3. Try configured external providers in priority order
    const providers = loadExternalProviders()
    providers.sort((a, b) => (a.priority || 999) - (b.priority || 999))

    for (const provider of providers) {
      const response = await callOpenAICompatible(
        provider.apiKey,
        provider.baseUrl,
        provider.model,
        aiMessages,
        provider.config,
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
      error: 'Todos os provedores de IA estão indisponíveis no momento. Por favor, tente novamente em alguns minutos ou contacte-nos via carsaimozambique@gmail.com',
      sessionId: sessionId || `session-${Date.now()}`,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno. Por favor, tente novamente ou contacte-nos via carsaimozambique@gmail.com',
      },
      { status: 500 }
    )
  }
}
