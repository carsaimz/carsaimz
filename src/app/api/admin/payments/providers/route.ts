import { NextRequest, NextResponse } from 'next/server'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDb } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import {
  initializePaymentProviders,
  getAllProviders,
  getProviderById,
} from '@/lib/payment-helpers'
import type { ProviderName } from '@/lib/payment-helpers'

// GET: List all payment providers
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    // Initialize default providers if none exist
    await initializePaymentProviders()

    const providers = await getAllProviders()

    return NextResponse.json({
      success: true,
      data: providers.map(p => serializeFirestore(p)),
    })
  } catch (error) {
    console.error('Payment providers fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment providers' },
      { status: 500 }
    )
  }
}

// POST: Create or update a payment provider
export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.json()
    const { name, displayName, description, isActive, isTestMode, config, supportedCurrencies, processingFee, processingFeeFixed, minAmount, maxAmount, order } = body

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Provider name is required' },
        { status: 400 }
      )
    }

    const validNames: ProviderName[] = ['stripe', 'paypal', 'mpesa', 'emola', 'bank_transfer']
    if (!validNames.includes(name)) {
      return NextResponse.json(
        { success: false, message: `Invalid provider name. Must be one of: ${validNames.join(', ')}` },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if provider with this name already exists
    const existingSnap = await db
      .collection('payment_providers')
      .where('name', '==', name)
      .limit(1)
      .get()

    if (!existingSnap.empty) {
      // Update existing provider
      const docId = existingSnap.docs[0].id
      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (displayName !== undefined) updateData.displayName = displayName
      if (description !== undefined) updateData.description = description
      if (isActive !== undefined) updateData.isActive = isActive
      if (isTestMode !== undefined) updateData.isTestMode = isTestMode
      if (config !== undefined) updateData.config = config
      if (supportedCurrencies !== undefined) updateData.supportedCurrencies = supportedCurrencies
      if (processingFee !== undefined) updateData.processingFee = processingFee
      if (processingFeeFixed !== undefined) updateData.processingFeeFixed = processingFeeFixed
      if (minAmount !== undefined) updateData.minAmount = minAmount
      if (maxAmount !== undefined) updateData.maxAmount = maxAmount
      if (order !== undefined) updateData.order = order

      await db.collection('payment_providers').doc(docId).update(updateData)

      const updated = await getProviderById(docId)
      return NextResponse.json({
        success: true,
        data: serializeFirestore(updated),
        message: 'Provider updated',
      })
    }

    // Create new provider
    const docRef = db.collection('payment_providers').doc()
    await docRef.set({
      name,
      displayName: displayName || name,
      description: description || '',
      isActive: isActive ?? false,
      isTestMode: isTestMode ?? true,
      config: config || {},
      supportedCurrencies: supportedCurrencies || ['MZN'],
      processingFee: processingFee || 0,
      processingFeeFixed: processingFeeFixed || 0,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || 0,
      order: order || 99,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const created = await getProviderById(docRef.id)
    return NextResponse.json({
      success: true,
      data: serializeFirestore(created),
      message: 'Provider created',
    })
  } catch (error) {
    console.error('Payment provider create/update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create/update payment provider' },
      { status: 500 }
    )
  }
}

// PUT: Update a provider (enable/disable, configure keys)
export async function PUT(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const provider = await getProviderById(id)
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      )
    }

    // Build update data, only include fields that are provided
    const updateData: Record<string, any> = { updatedAt: new Date() }
    const allowedFields = [
      'displayName', 'description', 'isActive', 'isTestMode',
      'config', 'supportedCurrencies', 'processingFee',
      'processingFeeFixed', 'minAmount', 'maxAmount', 'order',
    ]

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field]
      }
    }

    // Merge config if provided (don't overwrite existing keys that aren't in the update)
    if (updates.config) {
      updateData.config = {
        ...(provider.config || {}),
        ...updates.config,
      }
    }

    const db = getDb()
    await db.collection('payment_providers').doc(id).update(updateData)

    const updated = await getProviderById(id)
    return NextResponse.json({
      success: true,
      data: serializeFirestore(updated),
      message: 'Provider updated',
    })
  } catch (error) {
    console.error('Payment provider update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update payment provider' },
      { status: 500 }
    )
  }
}

// DELETE: Delete a provider
export async function DELETE(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Provider ID is required' },
        { status: 400 }
      )
    }

    const provider = await getProviderById(id)
    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      )
    }

    const db = getDb()
    await db.collection('payment_providers').doc(id).delete()

    return NextResponse.json({
      success: true,
      message: 'Provider deleted',
    })
  } catch (error) {
    console.error('Payment provider delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete payment provider' },
      { status: 500 }
    )
  }
}
