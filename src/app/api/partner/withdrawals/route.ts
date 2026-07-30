import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { createDoc, getDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET withdrawal requests for a partner
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 })
    }

    const withdrawals = await safeQueryDocs('partner_withdrawals', [
      { field: 'partnerId', op: '==', value: userId },
    ], 'createdAt', 'desc')

    return NextResponse.json({ success: true, data: serializeFirestore(withdrawals) })
  } catch (error) {
    console.error('Partner withdrawals fetch error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch withdrawals' }, { status: 500 })
  }
}

// POST create a withdrawal request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, amount, method, accountDetails } = body

    if (!partnerId || !amount) {
      return NextResponse.json({ success: false, message: 'partnerId and amount are required' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number' }, { status: 400 })
    }

    const withdrawalId = await createDoc('partner_withdrawals', {
      partnerId,
      amount: parsedAmount,
      method: method || 'mpesa',
      accountDetails: accountDetails || null,
      status: 'pending',
    })

    const withdrawal = await getDoc('partner_withdrawals', withdrawalId)
    return NextResponse.json({ success: true, data: serializeFirestore(withdrawal) }, { status: 201 })
  } catch (error) {
    console.error('Partner withdrawal create error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create withdrawal' }, { status: 500 })
  }
}

// PUT update a withdrawal (admin approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'id and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'paid']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    await updateDoc('partner_withdrawals', id, { status })
    const withdrawal = await getDoc('partner_withdrawals', id)
    return NextResponse.json({ success: true, data: serializeFirestore(withdrawal) })
  } catch (error) {
    console.error('Partner withdrawal update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update withdrawal' }, { status: 500 })
  }
}
