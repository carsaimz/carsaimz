import { NextResponse } from 'next/server'
import { safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { serializeFirestore } from '@/lib/serialize'

// GET all categories for admin dropdowns
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const categories = await safeQueryDocs('categories', [], 'name', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(categories) })
  } catch (error) {
    console.error('Admin categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
