import { NextResponse } from 'next/server'
import { verifySmtpConnection } from '@/lib/email'

export async function POST() {
  try {
    const result = await verifySmtpConnection()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
