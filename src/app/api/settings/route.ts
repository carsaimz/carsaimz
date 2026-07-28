import { NextResponse } from 'next/server'
import { getDocs, getDoc, updateDoc, createDocWithId } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    const settings = await getDocs('settings')

    // Convert array to key-value object for easier consumption
    const settingsMap = settings.reduce(
      (acc: Record<string, string | null>, setting: any) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>
    )

    return NextResponse.json({
      success: true,
      data: {
        raw: serializeFirestore(settings),
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

    // Upsert each setting (check if exists, then update or create)
    const results = await Promise.all(
      settings.map(async (setting: { key: string; value: string | null }) => {
        const existing = await getDoc('settings', setting.key)

        if (existing) {
          await updateDoc('settings', setting.key, { value: setting.value ?? null })
          const updated = await getDoc('settings', setting.key)
          return serializeFirestore(updated)
        } else {
          await createDocWithId('settings', setting.key, { key: setting.key, value: setting.value ?? null })
          const created = await getDoc('settings', setting.key)
          return serializeFirestore(created)
        }
      })
    )

    // Return the updated settings map
    const settingsMap = results.reduce(
      (acc: Record<string, string | null>, setting: any) => {
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
