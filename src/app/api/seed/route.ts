import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed-data'

export async function POST() {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Carsai Mozambique demo data',
      data: result,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Carsai Mozambique demo data',
      data: result,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed database',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
