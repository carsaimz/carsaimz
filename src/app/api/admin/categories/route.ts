import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all categories for admin dropdowns
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Admin categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
