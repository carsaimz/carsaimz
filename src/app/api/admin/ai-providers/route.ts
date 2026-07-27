import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Carsai Mozambique - AI Providers Admin API
 *
 * CRUD operations for managing AI providers (Groq, DeepSeek, Gemini, OpenRouter, etc.)
 * Admin can add, configure, activate/deactivate, and set priority for failover.
 */

// ── GET: List all providers ──
export async function GET() {
  try {
    const providers = await db.aiProvider.findMany({
      orderBy: { priority: 'asc' },
    })

    // Mask API keys for security (only show last 4 chars)
    const masked = providers.map(p => ({
      ...p,
      apiKey: p.apiKey ? `...${p.apiKey.slice(-4)}` : null,
    }))

    return NextResponse.json({ success: true, providers: masked })
  } catch (error) {
    console.error('AI providers GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

// ── POST: Create a new provider ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, displayName, apiKey, baseUrl, model, priority, isActive, config } = body

    if (!name) {
      return NextResponse.json({ error: 'Provider name is required' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await db.aiProvider.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Provider with this name already exists' }, { status: 409 })
    }

    // Predefined defaults for common providers
    const defaults: Record<string, { baseUrl: string; model: string; displayName: string }> = {
      groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        displayName: 'Groq (Llama 3.3 70B)',
      },
      deepseek: {
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        displayName: 'DeepSeek Chat',
      },
      gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash',
        displayName: 'Google Gemini Flash',
      },
      openrouter: {
        baseUrl: 'https://openrouter.ai/api/v1',
        model: 'openrouter/auto',
        displayName: 'OpenRouter (Auto)',
      },
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        displayName: 'OpenAI GPT-4o Mini',
      },
    }

    const preset = defaults[name.toLowerCase()] || {}

    const provider = await db.aiProvider.create({
      data: {
        name: name.toLowerCase(),
        displayName: displayName || preset.displayName || name,
        apiKey: apiKey || null,
        baseUrl: baseUrl || preset.baseUrl || null,
        model: model || preset.model || null,
        priority: priority ?? 10,
        isActive: isActive ?? true,
        config: config ? JSON.stringify(config) : null,
      },
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('AI providers POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create provider' },
      { status: 500 }
    )
  }
}

// ── PUT: Update a provider ──
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, apiKey, baseUrl, model, priority, isActive, displayName, config } = body

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    const provider = await db.aiProvider.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(apiKey !== undefined && { apiKey }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(model !== undefined && { model }),
        ...(priority !== undefined && { priority }),
        ...(isActive !== undefined && { isActive }),
        ...(config !== undefined && { config: JSON.stringify(config) }),
      },
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('AI providers PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

// ── DELETE: Remove a provider ──
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
    }

    await db.aiProvider.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AI providers DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete provider' },
      { status: 500 }
    )
  }
}
