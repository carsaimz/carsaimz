import { NextRequest, NextResponse } from 'next/server'
import { safeGetDocs, safeGetDoc, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, updateDoc, createDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all partners (users with role=partner) + their withdrawal requests
export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    // Fetch all users and roles
    const allUsers = await safeGetDocs('users')
    const roles = await safeGetDocs('roles')
    const roleMap = new Map(roles.map(r => [r.id, r]))

    // Filter to partner users
    const partnerUsers = allUsers.filter((u: any) => {
      const userRole = u.roleId ? roleMap.get(u.roleId) : null
      const roleName = userRole?.name || 'user'
      return roleName === 'partner'
    })

    // Enrich each partner with their commissions, referrals, and withdrawals
    const enrichedPartners = await Promise.all(
      partnerUsers.map(async (partner: any) => {
        try {
          const commissions = await safeQueryDocs('affiliate_commissions', [
            { field: 'userId', op: '==', value: partner.id },
          ], 'createdAt', 'desc')

          const clicks = await safeQueryDocs('affiliate_clicks', [
            { field: 'userId', op: '==', value: partner.id },
          ], 'createdAt', 'desc')

          const withdrawals = await safeQueryDocs('partner_withdrawals', [
            { field: 'partnerId', op: '==', value: partner.id },
          ], 'createdAt', 'desc')

          const totalCommissionAmount = commissions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
          const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'pending')

          return serializeFirestore({
            ...partner,
            commissions: commissions.slice(0, 10),
            clicks: clicks.slice(0, 10),
            withdrawals,
            totalCommissionAmount,
            pendingWithdrawals,
            stats: {
              totalClicks: clicks.length,
              totalCommissions: commissions.length,
              totalCommissionAmount,
              pendingWithdrawals: pendingWithdrawals.length,
            },
          })
        } catch {
          return serializeFirestore(partner)
        }
      })
    )

    return NextResponse.json({ success: true, data: enrichedPartners })
  } catch (error) {
    console.error('Admin partner fetch error:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch partners' }, { status: 500 })
  }
}

// PUT update partner status, approve/reject withdrawals
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, withdrawalId, status, commissionRate } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 })
    }

    // Handle withdrawal approval/rejection
    if (action === 'updateWithdrawal' && withdrawalId && status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'paid']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
      }
      await updateDoc('partner_withdrawals', withdrawalId, { status })
      const updated = await getDoc('partner_withdrawals', withdrawalId)
      return NextResponse.json({ success: true, data: serializeFirestore(updated) })
    }

    // Handle partner commission rate update
    if (commissionRate !== undefined) {
      await updateDoc('users', id, { commissionRate })
      const updated = await getDoc('users', id)
      return NextResponse.json({ success: true, data: serializeFirestore(updated) })
    }

    // Handle general partner status update
    const partner = await getDoc('users', id)
    if (!partner) {
      return NextResponse.json({ success: false, message: 'Partner not found' }, { status: 404 })
    }

    await updateDoc('users', id, { status: status || 'active' })
    const updated = await getDoc('users', id)
    return NextResponse.json({ success: true, data: serializeFirestore(updated) })
  } catch (error) {
    console.error('Admin partner update error:', error)
    return NextResponse.json({ success: false, message: 'Failed to update partner' }, { status: 500 })
  }
}

// POST create coupon codes for partners
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, code, discountPercent, description, expiresAt } = body

    if (!partnerId || !code || !discountPercent) {
      return NextResponse.json({ success: false, message: 'partnerId, code, and discountPercent are required' }, { status: 400 })
    }

    const couponId = await createDoc('coupons', {
      partnerId,
      code: code.toUpperCase(),
      discountPercent: parseFloat(discountPercent),
      description: description || null,
      expiresAt: expiresAt || null,
      isActive: true,
      usageCount: 0,
    })

    const coupon = await getDoc('coupons', couponId)
    return NextResponse.json({ success: true, data: serializeFirestore(coupon) }, { status: 201 })
  } catch (error) {
    console.error('Admin partner coupon create error:', error)
    return NextResponse.json({ success: false, message: 'Failed to create coupon' }, { status: 500 })
  }
}
