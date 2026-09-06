/**
 * DB Manager API - List Tables
 *
 * STUB: This route used Prisma which is not installed. The project uses Firestore.
 * Returns a friendly error so the admin UI can display an appropriate message.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL tables listing is not available. This project uses Firestore collections, not SQL tables. Use Firebase Console to browse data.',
      tables: [],
    },
    { status: 501 }
  )
}
