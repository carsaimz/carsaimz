/**
 * Carsai Mozambique — Maintenance Mode API Route
 *
 * GET: Returns the current maintenance mode status from Firestore settings.
 * Reads from the `settings` collection, document ID `maintenanceMode`.
 */

import { NextResponse } from 'next/server'
import { getDoc } from '@/lib/db'

export async function GET() {
  try {
    const setting = await getDoc('settings', 'maintenanceMode')

    const isActive = setting?.value === 'true'

    return NextResponse.json({
      success: true,
      maintenanceMode: isActive,
    })
  } catch (error) {
    console.error('Maintenance status fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        maintenanceMode: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
