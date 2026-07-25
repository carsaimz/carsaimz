import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany()

    // Convert array to key-value object for easier consumption
    const settingsMap = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>
    )

    return NextResponse.json({
      success: true,
      data: {
        raw: settings,
        map: settingsMap,
      },
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
