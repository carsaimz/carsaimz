import { NextResponse } from 'next/server'
import { queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all categories for admin dropdowns
export async function GET() {
  try {
    const categories = await queryDocs('categories', [], 'name', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(categories) })
  } catch (error) {
    console.error('Admin categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
