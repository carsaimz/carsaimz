import { NextRequest, NextResponse } from 'next/server'
import { safeCountDocs, safeGetDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDoc, deleteDoc, countDocs, getDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// Known Firestore collections (from the db.ts schema)
const KNOWN_COLLECTIONS = [
  'users', 'roles', 'permissions', 'role_permissions',
  'services', 'projects', 'testimonials', 'posts',
  'categories', 'tags', 'post_tags', 'comments',
  'subscribers', 'forum_categories', 'forum_topics',
  'forum_posts', 'forum_likes', 'quotes', 'proposals',
  'payments', 'invoices', 'invoice_items',
  'affiliate_clicks', 'affiliate_commissions',
  'notifications', 'support_tickets', 'ticket_replies',
  'file_attachments', 'settings', 'ai_providers',
  'logs', 'pages',
]

// GET — list collections, browse documents, or view a single document
export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is configured
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection')
    const docId = searchParams.get('docId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // ── Get a single document ──
    if (collectionName && docId) {
      const doc = await safeGetDoc(collectionName, docId)
      if (!doc) {
        return NextResponse.json(
          { success: false, message: 'Document not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: serializeFirestore(doc) })
    }

    // ── Get documents in a collection (paginated) ──
    if (collectionName) {
      const allDocs = await safeGetDocs(collectionName)
      const total = allDocs.length
      const start = (page - 1) * limit
      const paginatedDocs = allDocs.slice(start, start + limit)

      return NextResponse.json({
        success: true,
        data: {
          documents: serializeFirestore(paginatedDocs),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      })
    }

    // ── List all collections with document counts ──
    const collections: Array<{ name: string; count: number }> = []

    for (const name of KNOWN_COLLECTIONS) {
      const count = await safeCountDocs(name)
      collections.push({ name, count })
    }

    // Also try to discover any additional collections via listCollections
    try {
      const { getDb } = await import('@/lib/db')
      const db = getDb()
      const existingCollections = await db.listCollections()
      for (const col of existingCollections) {
        if (!KNOWN_COLLECTIONS.includes(col.id)) {
          const count = await safeCountDocs(col.id)
          collections.push({ name: col.id, count })
        }
      }
    } catch {
      // listCollections may fail on Spark plan — ignore
    }

    // Sort: collections with documents first, then alphabetically
    collections.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ success: true, data: collections })
  } catch (error) {
    console.error('DB Manager GET error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE — delete a document
export async function DELETE(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is configured
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection')
    const docId = searchParams.get('docId')

    if (!collectionName || !docId) {
      return NextResponse.json(
        { success: false, message: 'Collection and docId are required' },
        { status: 400 }
      )
    }

    // Verify document exists
    const doc = await safeGetDoc(collectionName, docId)
    if (!doc) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      )
    }

    await deleteDoc(collectionName, docId)
    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    console.error('DB Manager DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
