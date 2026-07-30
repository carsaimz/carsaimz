import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 *
 * Tests Firebase Admin SDK connectivity and returns diagnostic info.
 * Use this to debug HTTP 500 errors on dashboard/stats/history endpoints.
 * No sensitive information (env var values, private key lengths) is exposed.
 */
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
  }

  // Test Firebase Admin SDK initialization
  try {
    const { getAdminFirestore, getAdminInitError } = await import('@/lib/firebase-admin')
    const db = getAdminFirestore()
    if (!db) {
      diagnostics.firebaseAdminInit = 'FAILED'
      diagnostics.initError = getAdminInitError() || 'Firebase Admin Firestore not configured'
    } else {
      const initErr = getAdminInitError()
      diagnostics.firebaseAdminInit = initErr ? 'OK_WITH_WARNINGS' : 'OK'
      if (initErr) diagnostics.initWarning = initErr

      // Test Firestore read
      try {
        const snap = await db.collection('roles').limit(1).get()
        diagnostics.firestoreRead = 'OK'
        diagnostics.rolesCount = snap.size
      } catch (fsErr: any) {
        diagnostics.firestoreRead = 'FAILED'
        diagnostics.firestoreError = fsErr.message
      }

      // Test users collection
      try {
        const usersSnap = await db.collection('users').limit(1).get()
        diagnostics.usersRead = 'OK'
        diagnostics.usersCount = usersSnap.size
      } catch (uErr: any) {
        diagnostics.usersRead = 'FAILED'
        diagnostics.usersError = uErr.message
      }
    }
  } catch (initErr: any) {
    diagnostics.firebaseAdminInit = 'FAILED'
    diagnostics.initError = initErr.message
  }

  const isHealthy = diagnostics.firebaseAdminInit !== 'FAILED' && diagnostics.firestoreRead === 'OK'

  return NextResponse.json(
    { success: isHealthy, diagnostics },
    { status: isHealthy ? 200 : 503 }
  )
}
