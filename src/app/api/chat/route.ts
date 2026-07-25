import { NextResponse } from 'next/server'

/**
 * Carsai Mozambique - AI Chat API Endpoint
 *
 * Uses z-ai-web-dev-sdk (backend only!) to provide AI-generated responses
 * about Carsai Mozambique services.
 *
 * Accepts POST with { message, context }
 * Returns AI-generated response
 */

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, context } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // ── Carsai context for the AI ──
    const carsaiContext = `You are the Carsai Mozambique assistant. Carsai is a technology company based in Mozambique that provides digital transformation services for businesses. Key information about Carsai:

Services offered:
- Web Development: Modern and responsive websites and web applications
- Mobile Development: Native and hybrid mobile apps for Android and iOS
- Cloud Services: Cloud infrastructure and services for scalability and security
- Artificial Intelligence: AI solutions for automation and data analysis
- Tech Consulting: Strategic advice for digital transformation
- Maintenance & Support: Continuous technical support and system maintenance
- UI/UX Design: Intuitive interface design and user experience
- SEO Optimization: Search engine optimization and digital marketing

Payment methods: M-Pesa (mobile money), bank transfers, international credit cards
Currency: Mozambican Metical (MT), USD also accepted
Office: Av. 24 de Julho, 1234, Maputo, Mozambique
Contact: info@carsai.mz, +258 84 123 4567
Partner program: Earn commissions on referrals - tiers: Basic, Silver, Gold, Platinum

Be helpful, friendly, and concise. Answer questions about Carsai services, pricing, payment methods, partnerships, and general tech topics relevant to Mozambique. If you don't know something specific about Carsai, suggest the user contact us directly. Always respond in the same language the user writes in (Portuguese, English, or French).`

    // ── Build messages array for the AI ──
    const aiMessages = [
      { role: 'system', content: carsaiContext },
    ]

    // Add context messages if provided
    if (context && Array.isArray(context)) {
      for (const ctxMsg of context.slice(-6)) {
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
        messages: aiMessages as Array<{ role: string; content: string }>,
      })

      const responseText = completion.choices?.[0]?.message?.content || ''

      if (responseText) {
        return NextResponse.json({
          success: true,
          response: responseText,
        })
      }
    } catch (aiError) {
      console.error('AI SDK error:', aiError)
      // Fall through to fallback response
    }

    // ── Fallback: Generate contextual response ──
    const fallbackResponse = generateFallbackResponse(message)
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
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

// ── Fallback response generator ──
function generateFallbackResponse(message: string): string {
  const lowerMsg = message.toLowerCase()

  // Detect language
  const isPortuguese = lowerMsg.includes('serviço') || lowerMsg.includes('preço') || lowerMsg.includes('cotação') || lowerMsg.includes('parceiro') || lowerMsg.includes('pagamento') || lowerMsg.includes('moçambique') || /como|que|podemos|quando|quanto/.test(lowerMsg)

  if (isPortuguese) {
    if (/serviço|service|offer|oferece/.test(lowerMsg)) {
      return 'A Carsai Moçambique oferece serviços de desenvolvimento web, mobile, cloud, inteligência artificial, consultoria, manutenção e suporte, design UI/UX, e optimização SEO. Cada serviço é adaptado ao mercado moçambicano. Queira contactar-nos para mais detalhes!'
    }
    if (/cotação|quote|preço|price|custo/.test(lowerMsg)) {
      return 'Para solicitar uma cotação, pode usar o formulário na secção "Financeiro" do nosso site, ou contactar-nos directamente via info@carsai.mz ou +258 84 123 4567. Aceitamos M-Pesa, transferência bancária e cartão de crédito.'
    }
    if (/pagamento|payment|mpesa|banco/.test(lowerMsg)) {
      return 'Aceitamos M-Pesa (dinheiro móvel), transferência bancária e pagamentos internacionais via cartão de crédito. O Metical (MT) é a nossa moeda principal, mas também aceitamos USD.'
    }
    if (/parceiro|partner|afiliado|comissão/.test(lowerMsg)) {
      return 'O programa de parceiros Carsai permite ganhar comissões sobre cada referência! Temos 4 níveis: Básico, Prata, Ouro e Platina. Registe-se no nosso site para se juntar ao programa.'
    }
    return 'Olá! Sou o assistente virtual da Carsai Moçambique. Posso ajudar com informações sobre nossos serviços, cotações, métodos de pagamento e programa de parceiros. Como posso ajudar?'
  }

  // English responses
  if (/service|offer|what/.test(lowerMsg)) {
    return 'Carsai Mozambique offers web development, mobile apps, cloud services, AI solutions, tech consulting, maintenance & support, UI/UX design, and SEO optimization — all tailored for the Mozambican market. Contact us for more details!'
  }
  if (/quote|price|cost|how much/.test(lowerMsg)) {
    return 'To request a quote, use our Financial section form or contact us directly at info@carsai.mz or +258 84 123 4567. We accept M-Pesa, bank transfers, and credit card payments.'
  }
  if (/payment|mpesa|bank/.test(lowerMsg)) {
    return 'We accept M-Pesa (mobile money), bank transfers, and international credit card payments. The Mozambican Metical (MT) is our primary currency, but we also accept USD.'
  }
  if (/partner|affiliate|commission/.test(lowerMsg)) {
    return 'The Carsai Partner Program lets you earn commissions on referrals! We have 4 tiers: Basic, Silver, Gold, and Platinum. Sign up on our website to join the program.'
  }

  return 'Hello! I\'m the Carsai Mozambique virtual assistant. I can help with information about our services, quotes, payment methods, and the partner program. How can I help you today?'
}
