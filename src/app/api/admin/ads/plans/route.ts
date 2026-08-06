/**
 * Carsai Mozambique — Admin Ads Plans API Route
 *
 * GET  /api/admin/ads/plans — Fetch all ad plans
 * POST /api/admin/ads/plans — Create a new ad plan (admin only)
 * PUT  /api/admin/ads/plans — Update an ad plan (admin only) - body includes id field
 *
 * Initializes default plans if none exist
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocs, getDoc, createDoc, updateDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { verifyAuthToken, isAdmin, initializeAdPlans } from '@/lib/ads-helpers'

// ─── GET — Fetch all ad plans ───

export async function GET(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const db = getAdminFirestore()
    if (!db) {
      return NextResponse.json({ success: false, message: 'Database not configured' }, { status: 503 })
    }

    // Initialize default plans if none exist
    await initializeAdPlans(db)

    // Fetch all plans, ordered by 'order' field
    const plans = await getDocs('ad_plans')

    // Sort by order field
    plans.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

    return NextResponse.json({
      success: true,
      data: serializeFirestore(plans),
    })
  } catch (error) {
    console.error('[Admin Ads Plans] GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch ad plans' },
      { status: 500 }
    )
  }
}

// ─── POST — Create a new ad plan (admin only) ───

export async function POST(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    // Verify auth and admin role
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isAdmin(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      nameI18n,
      descriptionI18n,
      price,
      features,
      isFree,
      isActive,
      order,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'name is required' },
        { status: 400 }
      )
    }

    if (!features || typeof features !== 'object') {
      return NextResponse.json(
        { success: false, message: 'features object is required' },
        { status: 400 }
      )
    }

    // Validate features sub-fields
    const requiredFeatureFields = ['maxAds', 'maxImpressions', 'placements', 'formats', 'customBranding', 'analytics', 'priority', 'supportLevel']
    for (const field of requiredFeatureFields) {
      if (features[field] === undefined) {
        return NextResponse.json(
          { success: false, message: `features.${field} is required` },
          { status: 400 }
        )
      }
    }

    if (!Array.isArray(features.placements)) {
      return NextResponse.json(
        { success: false, message: 'features.placements must be an array' },
        { status: 400 }
      )
    }

    if (!Array.isArray(features.formats)) {
      return NextResponse.json(
        { success: false, message: 'features.formats must be an array' },
        { status: 400 }
      )
    }

    // Create the plan
    const planId = await createDoc('ad_plans', {
      name,
      description: description || '',
      nameI18n: nameI18n || '',
      descriptionI18n: descriptionI18n || '',
      price: price || 0,
      features: {
        maxAds: features.maxAds || 0,
        maxImpressions: features.maxImpressions || 0,
        placements: features.placements,
        formats: features.formats,
        customBranding: features.customBranding || false,
        analytics: features.analytics || false,
        priority: features.priority || 50,
        supportLevel: features.supportLevel || 'community',
      },
      isFree: isFree !== undefined ? isFree : (price === 0),
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    })

    const plan = await getDoc('ad_plans', planId)

    return NextResponse.json(
      { success: true, data: serializeFirestore(plan) },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admin Ads Plans] POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create ad plan' },
      { status: 500 }
    )
  }
}

// ─── PUT — Update an ad plan (admin only) ───

export async function PUT(request: NextRequest) {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    // Verify auth and admin role
    const authHeader = request.headers.get('Authorization')
    const authResult = await verifyAuthToken(authHeader)

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!isAdmin(authResult.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, description, nameI18n, descriptionI18n, price, features, isFree, isActive, order } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      )
    }

    // Check if plan exists
    const existingPlan = await getDoc('ad_plans', id)
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, message: 'Ad plan not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: Record<string, any> = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (nameI18n !== undefined) updateData.nameI18n = nameI18n
    if (descriptionI18n !== undefined) updateData.descriptionI18n = descriptionI18n
    if (price !== undefined) updateData.price = price
    if (isFree !== undefined) updateData.isFree = isFree
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    // Handle features update
    if (features !== undefined) {
      if (typeof features !== 'object') {
        return NextResponse.json(
          { success: false, message: 'features must be an object' },
          { status: 400 }
        )
      }

      // Merge with existing features
      const existingFeatures = (existingPlan as any).features || {}
      updateData.features = {
        ...existingFeatures,
        ...(features.maxAds !== undefined && { maxAds: features.maxAds }),
        ...(features.maxImpressions !== undefined && { maxImpressions: features.maxImpressions }),
        ...(features.placements !== undefined && { placements: features.placements }),
        ...(features.formats !== undefined && { formats: features.formats }),
        ...(features.customBranding !== undefined && { customBranding: features.customBranding }),
        ...(features.analytics !== undefined && { analytics: features.analytics }),
        ...(features.priority !== undefined && { priority: features.priority }),
        ...(features.supportLevel !== undefined && { supportLevel: features.supportLevel }),
      }
    }

    await updateDoc('ad_plans', id, updateData)

    const updatedPlan = await getDoc('ad_plans', id)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(updatedPlan),
    })
  } catch (error) {
    console.error('[Admin Ads Plans] PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update ad plan' },
      { status: 500 }
    )
  }
}
