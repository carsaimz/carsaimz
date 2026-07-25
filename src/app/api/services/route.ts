import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
    })
  } catch (error) {
    console.error('Services fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch services',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
