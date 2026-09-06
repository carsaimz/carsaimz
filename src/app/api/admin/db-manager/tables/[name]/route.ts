/**
 * DB Manager API - Table Data (Browse + CRUD)
 *
 * STUB: This route used Prisma which is not installed. The project uses Firestore.
 * Returns a friendly error so the admin UI can display an appropriate message.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL table browsing is not available. This project uses Firestore.',
      rows: [],
    },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL row insert is not available. This project uses Firestore.',
    },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL row update is not available. This project uses Firestore.',
    },
    { status: 501 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'SQL row delete is not available. This project uses Firestore.',
    },
    { status: 501 }
  )
}
