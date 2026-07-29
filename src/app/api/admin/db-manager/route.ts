import { NextRequest, NextResponse } from 'next/server'
import { getDb, getDocs, getDoc, deleteDoc, countDocs } from '@/lib/db'
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
    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection')
    const docId = searchParams.get('docId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // ── Get a single document ──
    if (collectionName && docId) {
      const doc = await getDoc(collectionName, docId)
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
      const allDocs = await getDocs(collectionName)
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
      try {
        const count = await countDocs(name)
        collections.push({ name, count })
      } catch {
        // Collection might not exist yet — count as 0
        collections.push({ name, count: 0 })
      }
    }

    // Also try to discover any additional collections via listCollections
    try {
      const db = getDb()
      const existingCollections = await db.listCollections()
      for (const col of existingCollections) {
        if (!KNOWN_COLLECTIONS.includes(col.id)) {
          try {
            const count = await countDocs(col.id)
            collections.push({ name: col.id, count })
          } catch {
            collections.push({ name: col.id, count: 0 })
          }
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
      { success: false, message: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

// DELETE — delete a document
export async function DELETE(request: NextRequest) {
  try {
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
    const doc = await getDoc(collectionName, docId)
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
      { success: false, message: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
