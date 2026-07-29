import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Uses z-ai-web-dev-sdk as the AI provider.
 *
 * Configuration priority (first available wins):
 * 1. Database (Firestore `ai_providers` collection — active, highest priority)
 * 2. .z-ai-config file (auto-detected by SDK — local dev)
 * 3. Environment variables (ZAI_BASE_URL, ZAI_API_KEY, ZAI_TOKEN — Vercel)
 * 4. Hardcoded fallback (z.ai internal API — works in this environment)
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

// ── ZAI Instance Cache ──
// Cache key = config source, so we reinitialize when config changes.

let zaiInstance: InstanceType<typeof ZAI> | null = null
let zaiInitPromise: Promise<InstanceType<typeof ZAI>> | null = null
let cachedConfigKey: string | null = null

/**
 * Build ZAI config from environment variables.
 * Used as fallback when .z-ai-config file is not available (e.g. Vercel).
 */
function buildConfigFromEnv() {
  const baseUrl = process.env.ZAI_BASE_URL
  const apiKey = process.env.ZAI_API_KEY

  if (!baseUrl || !apiKey) return null

  return {
    baseUrl,
    apiKey,
    chatId: process.env.ZAI_CHAT_ID || '',
    userId: process.env.ZAI_USER_ID || '',
    token: process.env.ZAI_TOKEN || '',
  }
}

/**
 * Try to load AI provider config from Firestore (ai_providers collection).
 * Returns the first active provider sorted by priority, or null if not available.
 */
async function loadProviderFromDatabase(): Promise<{
  config: { baseUrl: string; apiKey: string; chatId: string; userId: string; token: string; model?: string }
  key: string
} | null> {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) return null

    const db = getAdminFirestore()
    if (!db) return null

    const snapshot = await db
      .collection('ai_providers')
      .where('isActive', '==', true)
      .orderBy('priority', 'asc')
      .limit(1)
      .get()

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    const data = doc.data()

    if (!data.baseUrl || !data.apiKey) return null

    // Parse extra config if available
    let extraConfig: Record<string, string> = {}
    if (data.config) {
      try {
        extraConfig = typeof data.config === 'string' ? JSON.parse(data.config) : data.config
      } catch {
        extraConfig = {}
      }
    }

    return {
      config: {
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        chatId: extraConfig.chatId || '',
        userId: extraConfig.userId || '',
        token: extraConfig.token || '',
        model: data.model || undefined,
      },
      key: `db:${doc.id}:${data.priority}`,
    }
  } catch (error) {
    // Database not available — fall through to other methods
    console.warn('[Chat] Could not load provider from database:', error instanceof Error ? error.message : error)
    return null
  }
}

async function getZaiInstance() {
  // ── Try 1: Database provider (highest priority, admin-configurable) ──
  const dbProvider = await loadProviderFromDatabase()

  if (dbProvider) {
    // If the config hasn't changed, reuse the cached instance
    if (zaiInstance && cachedConfigKey === dbProvider.key) {
      return zaiInstance
    }

    // Create new instance with DB config
    try {
      const zai = new ZAI(dbProvider.config)
      zaiInstance = zai
      cachedConfigKey = dbProvider.key
      return zai
    } catch (err) {
      console.warn('[Chat] DB provider config failed, falling back:', err instanceof Error ? err.message : err)
    }
  }

  // ── Reuse cached instance if available and DB had no provider ──
  if (zaiInstance && cachedConfigKey?.startsWith('fallback:')) {
    return zaiInstance
  }

  // ── Prevent concurrent initialization ──
  if (zaiInitPromise) return zaiInitPromise

  zaiInitPromise = (async () => {
    try {
      // ── Try 2: Use SDK's auto-detection (.z-ai-config file) ──
      const zai = await ZAI.create()
      zaiInstance = zai
      cachedConfigKey = 'fallback:file'
      return zai
    } catch {
      // ── Try 3: Use environment variables (for Vercel/serverless) ──
      const envConfig = buildConfigFromEnv()
      if (envConfig) {
        const zai = new ZAI(envConfig)
        zaiInstance = zai
        cachedConfigKey = 'fallback:env'
        return zai
      }

      // No config available — throw descriptive error
      throw new Error(
        'ZAI SDK not configured. Configure an AI provider in the admin dashboard, create .z-ai-config file, or set ZAI_BASE_URL and ZAI_API_KEY environment variables.'
      )
    }
  })()

  try {
    return await zaiInitPromise
  } catch (err) {
    zaiInitPromise = null
    throw err
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
    zaiInitPromise = null
    cachedConfigKey = null

    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error'

    // Config not found — helpful message for developers
    if (errorMessage.includes('not configured') || errorMessage.includes('Configuration file not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'O assistente de IA não está configurado. Por favor, contacte o administrador.',
          debug: 'Configure an AI provider in the admin dashboard, or set ZAI_BASE_URL/ZAI_API_KEY env vars.',
        },
        { status: 503 }
      )
    }

    // Auth error (expired token, etc.)
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('missing X-Token')) {
      return NextResponse.json(
        {
          success: false,
          error: 'A autenticação do assistente de IA expirou. Por favor, contacte o administrador.',
        },
        { status: 503 }
      )
    }

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
