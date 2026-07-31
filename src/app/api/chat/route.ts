import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { buildKnowledgeBase, invalidateKnowledgeCache } from '@/lib/chat-knowledge'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Uses direct OpenAI-compatible API calls (fetch).
 * All providers come from the Firestore `ai_providers` collection.
 * Knowledge base is dynamically built from Firestore data.
 *
 * Supported providers (all OpenAI-compatible):
 * - Groq (fast, free tier)
 * - DeepSeek (affordable, good quality)
 * - Google Gemini (via OpenAI-compatible endpoint)
 * - OpenRouter (aggregator, many models)
 * - OpenAI (original)
 * - Any OpenAI-compatible API
 */

// ── Provider cache ──

interface ProviderConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  priority: number
}

let cachedProviders: ProviderConfig[] | null = null
let providersCacheTime = 0
const PROVIDERS_CACHE_TTL = 60_000 // 1 minute cache

/**
 * Invalidate the provider cache.
 * Called when providers are updated via the admin API.
 */
export function invalidateProviderCache() {
  cachedProviders = null
  providersCacheTime = 0
}

/**
 * Invalidate both provider and knowledge caches.
 * Called when content is updated via admin APIs.
 */
export function invalidateAllChatCaches() {
  invalidateProviderCache()
  invalidateKnowledgeCache()
}

/**
 * Load active AI providers from Firestore, sorted by priority.
 * All providers come from the database — no built-in providers.
 *
 * Uses safeGetDocs + client-side filtering to avoid composite index requirement.
 * The .where('isActive', '==', true).orderBy('priority', 'asc') query requires
 * a composite Firestore index that may not exist. Fetching all docs and filtering
 * client-side works without any index.
 */
async function loadProviders(): Promise<ProviderConfig[]> {
  const now = Date.now()
  if (cachedProviders && (now - providersCacheTime) < PROVIDERS_CACHE_TTL) {
    return cachedProviders
  }

  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      console.warn('[Chat] Firebase Admin not configured:', adminError)
      return []
    }

    const db = getAdminFirestore()
    if (!db) {
      console.warn('[Chat] Could not get Firestore instance')
      return []
    }

    // Fetch ALL documents and filter client-side — avoids composite index requirement
    const snapshot = await db.collection('ai_providers').get()

    if (snapshot.empty) {
      console.warn('[Chat] No AI providers found in database')
      return []
    }

    const providers: ProviderConfig[] = []
    let totalDocs = 0
    let skippedCount = 0
    for (const doc of snapshot.docs) {
      const data = doc.data()
      totalDocs++
      // Filter: only active providers with required fields
      if (!data.isActive) {
        console.log(`[Chat] Provider "${data.name || doc.id}" is inactive — skipping`)
        skippedCount++
        continue
      }
      if (!data.baseUrl || !data.apiKey) {
        console.warn(`[Chat] Provider "${data.name || doc.id}" missing baseUrl or apiKey — skipping`)
        skippedCount++
        continue
      }

      providers.push({
        id: doc.id,
        name: data.name || data.displayName || 'unknown',
        baseUrl: data.baseUrl.replace(/\/+$/, ''), // Remove trailing slash
        apiKey: data.apiKey,
        model: data.model || 'gpt-3.5-turbo',
        priority: data.priority || 99,
      })
    }

    console.log(`[Chat] Loaded ${providers.length}/${totalDocs} providers (${skippedCount} skipped)`)

    // Sort by priority (ascending) — client-side instead of Firestore orderBy
    providers.sort((a, b) => a.priority - b.priority)

    cachedProviders = providers
    providersCacheTime = now
    return providers
  } catch (error) {
    console.warn('[Chat] Could not load providers from database:', error instanceof Error ? error.message : error)
    return []
  }
}

/**
 * Call an OpenAI-compatible chat completions API.
 * Supports: Groq, DeepSeek, Gemini, OpenRouter, OpenAI, and any compatible provider.
 */
async function callProvider(
  provider: ProviderConfig,
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const url = `${provider.baseUrl}/chat/completions`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000) // 30s timeout

  try {
    // Build headers — OpenRouter needs HTTP-Referer and X-Title
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    }

    if (provider.name === 'openrouter') {
      headers['HTTP-Referer'] = 'https://carsaimz.vercel.app'
      headers['X-Title'] = 'Carsai Mozambique'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        // Some providers don't support stream
        stream: false,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.warn(`[Chat] Provider ${provider.name} returned ${response.status}: ${errorText.slice(0, 200)}`)
      return null
    }

    const data = await response.json()

    // Standard OpenAI response format
    const content = data?.choices?.[0]?.message?.content
    if (content && typeof content === 'string' && content.trim().length > 0) {
      return content.trim()
    }

    // Some providers use different response formats
    // DeepSeek sometimes wraps in extra object
    const altContent = data?.output?.text || data?.result?.content || data?.response
    if (altContent && typeof altContent === 'string' && altContent.trim().length > 0) {
      return altContent.trim()
    }

    console.warn(`[Chat] Provider ${provider.name} returned empty/unexpected format:`, JSON.stringify(data).slice(0, 200))
    return null
  } catch (error: any) {
    clearTimeout(timeout)

    if (error.name === 'AbortError') {
      console.warn(`[Chat] Provider ${provider.name} timed out (30s)`)
    } else {
      console.warn(`[Chat] Provider ${provider.name} error:`, error.message)
    }
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

    // ── Build dynamic knowledge base ──
    console.log('[Chat] Building knowledge base from Firestore...')
    const knowledgeBase = await buildKnowledgeBase()

    // ── Build system prompt ──
    const systemPrompt = `You are the Carsai Mozambique assistant — a knowledgeable, friendly, and concise AI chatbot. You have access to the company's entire database of services, projects, blog posts, testimonials, and more. Use this information to provide accurate, helpful responses.

${knowledgeBase}`

    // ── Build messages array ──
    const aiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    // Add session context (previous messages)
    if (context && Array.isArray(context)) {
      for (const ctxMsg of context.slice(-10)) {
        const role = ctxMsg.role as string
        if (role === 'user' || role === 'assistant') {
          aiMessages.push({ role, content: ctxMsg.content as string })
        }
      }
    }

    // Add the current user message
    aiMessages.push({ role: 'user', content: message })

    // ── Try providers from database in priority order ──
    const dbProviders = await loadProviders()

    if (dbProviders.length === 0) {
      // Check if there are inactive providers in the database
      let hasInactiveProviders = false
      try {
        const adminError = checkFirebaseAdmin()
        if (!adminError) {
          const db = getAdminFirestore()
          if (db) {
            const snapshot = await db.collection('ai_providers').limit(1).get()
            hasInactiveProviders = !snapshot.empty
          }
        }
      } catch { /* ignore */ }

      const errorMsg = hasInactiveProviders
        ? 'Existem provedores de IA configurados, mas estão desactivados. Active pelo menos um provedor no painel de administração (Definições → Provedores de IA).'
        : 'O assistente de IA não está configurado. Adicione um provedor de IA no painel de administração.'

      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          debug: 'Configure and activate an AI provider in the admin dashboard (Settings → AI Providers).',
        },
        { status: 503 }
      )
    }

    // Try each provider in order until one succeeds
    for (const provider of dbProviders) {
      const response = await callProvider(provider, aiMessages)

      if (response) {
        return NextResponse.json({
          success: true,
          response,
          sessionId: sessionId || `session-${Date.now()}`,
          provider: provider.name, // Let the client know which provider responded
        })
      }
    }

    // ── All providers failed ──
    console.error('[Chat] All AI providers failed')
    return NextResponse.json({
      success: false,
      error: 'Não foi possível gerar uma resposta. Os provedores de IA podem estar temporariamente indisponíveis. Por favor, tente novamente em alguns minutos ou contacte-nos via carsaimozambique@gmail.com',
      sessionId: sessionId || `session-${Date.now()}`,
    })

  } catch (error) {
    console.error('[Chat] Error:', error)

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
