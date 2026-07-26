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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body

    // Validate input
    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        {
          success: false,
          message: 'settings must be an array of {key, value} pairs',
        },
        { status: 400 }
      )
    }

    // Upsert each setting (create if not exists, update if exists)
    const results = await Promise.all(
      settings.map((setting: { key: string; value: string | null }) =>
        db.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value ?? undefined },
          create: {
            key: setting.key,
            value: setting.value ?? undefined,
          },
        })
      )
    )

    // Return the updated settings map
    const settingsMap = results.reduce(
      (acc: Record<string, string | null>, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>
    )

    return NextResponse.json({
      success: true,
      data: {
        raw: results,
        map: settingsMap,
      },
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
