import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDb, getDoc, updateDoc } from '@/lib/db'
import { getProviderByName } from '@/lib/payment-helpers'

// POST: M-Pesa callback handler
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.json()

    // M-Pesa callback format (Vodacom Mozambique)
    // The callback contains the transaction result
    const input = body.Input || body
    const transactionId = input?.TransactionID || input?.output_TransactionID
    const conversationId = input?.ConversationID || input?.output_ConversationID
    const thirdPartyReference = input?.ThirdPartyReference || input?.input_ThirdPartyReference
    const responseCode = input?.ResponseCode || input?.output_ResponseCode
    const responseDesc = input?.ResponseDescription || input?.output_ResponseDesc || ''
    const isSuccessful = responseCode === 'INS-0' || responseCode === '0' || responseCode === '00000000'

    // Try to find the payment by reference or conversation ID
    let paymentId: string | null = null
    if (thirdPartyReference) {
      try {
        // Check if it's a direct payment ID
        const payment = await getDoc('payments', thirdPartyReference)
        if (payment) {
          paymentId = thirdPartyReference
        }
      } catch {}
    }

    if (!paymentId && conversationId) {
      try {
        const db = getDb()
        const snap = await db
          .collection('payments')
          .where('providerTransactionId', '==', conversationId)
          .limit(1)
          .get()

        if (!snap.empty) {
          paymentId = snap.docs[0].id
        }
      } catch {}
    }

    if (!paymentId) {
      console.warn('[M-Pesa Webhook] Could not find payment for reference:', thirdPartyReference, 'conversation:', conversationId)
      // Still return 200 so M-Pesa doesn't retry
      return NextResponse.json({ success: true, message: 'Payment not found but acknowledged' })
    }

    // Update payment status
    const status = isSuccessful ? 'completed' : 'failed'
    await updateDoc('payments', paymentId, {
      status,
      providerTransactionId: transactionId || conversationId,
      metadata: {
        mpesaTransactionId: transactionId,
        mpesaConversationId: conversationId,
        mpesaResponseCode: responseCode,
        mpesaResponseDesc: responseDesc,
      },
    })

    console.log(`[M-Pesa Webhook] Payment ${paymentId} ${status}`)

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('M-Pesa webhook error:', error)
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
