import { NextRequest, NextResponse } from 'next/server'
import { queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

const VALID_TYPES = ['posts', 'services', 'projects'] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const filters: Array<{ field: string; op: '==' | '!=' | '>' | '<' | '>=' | '<='; value: any }> = []

    if (type && VALID_TYPES.includes(type as any)) {
      filters.push({ field: 'type', op: '==', value: type })
    }

    const categories = await queryDocs('categories', filters, 'name', 'asc')
    return NextResponse.json({
      success: true,
      data: serializeFirestore(categories),
      count: categories.length,
    })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
