/**
 * DB Manager API - Execute Custom SQL Query
 *
 * STUB: This route used Prisma which is not installed. The project uses Firestore.
 * Returns a friendly error so the admin UI can display an appropriate message.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL query execution is not available. This project uses Firestore, not a SQL database. Use Firebase Console to manage data directly.',
    },
    { status: 501 }
  )
}
