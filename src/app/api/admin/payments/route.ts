import { NextRequest, NextResponse } from 'next/server'
import { safeGetDocs, safeGetDoc, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all payments (admin view)
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let payments: any[]

    if (status) {
      payments = await safeQueryDocs('payments', [
        { field: 'status', op: '==', value: status },
      ], 'createdAt', 'desc')
    } else {
      payments = await safeGetDocs('payments')
      // Sort by createdAt descending
      payments.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        const bTime = b.createdAt ? new Date(typeof b.createdAt === 'string' ? b.createdAt : b.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        return bTime - aTime
      })
    }

    // Enrich each payment with user data
    const enrichedPayments = await Promise.all(
      payments.map(async (payment: any) => {
        try {
          const paymentUser = payment.userId ? await safeGetDoc('users', payment.userId) : null
          return serializeFirestore({
            ...payment,
            user: paymentUser ? {
              id: (paymentUser as any).id,
              name: (paymentUser as any).name,
              email: (paymentUser as any).email,
              avatar: (paymentUser as any).avatar,
            } : null,
          })
        } catch {
          return serializeFirestore(payment)
        }
      })
    )

    return NextResponse.json({ success: true, data: enrichedPayments })
  } catch (error) {
    console.error('Admin payments fetch error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch payments' }, { status: 500 })
  }
}

// PUT update payment status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const payment = await getDoc('payments', id)
    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 })
    }

    await updateDoc('payments', id, { status })
    const updated = await getDoc('payments', id)
    return NextResponse.json({ success: true, data: serializeFirestore(updated) })
  } catch (error) {
    console.error('Admin payment update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update payment' }, { status: 500 })
  }
}
