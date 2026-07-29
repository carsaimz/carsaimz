import { NextResponse } from 'next/server'

/**
 * Health Check Endpoint
 *
 * Tests Firebase Admin SDK connectivity and returns diagnostic info.
 * Use this to debug HTTP 500 errors on dashboard/stats/history endpoints.
 */
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_PROJECT_ID_VALUE: process.env.FIREBASE_ADMIN_PROJECT_ID || null,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_ADMIN_PRIVATE_KEY_LENGTH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
      FIREBASE_ADMIN_PRIVATE_KEY_HAS_NEWLINES: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes('\\n') || false,
      GOOGLE_APPLICATION_CREDENTIALS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    },
  }

  // Test Firebase Admin SDK initialization
  try {
    const { getAdminFirestore, getAdminInitError } = await import('@/lib/firebase-admin')
    const db = getAdminFirestore()
    const initErr = getAdminInitError()
    diagnostics.firebaseAdminInit = initErr ? 'OK_WITH_WARNINGS' : 'OK'
    if (initErr) diagnostics.initWarning = initErr

    // Test Firestore read
    try {
      const snap = await db.collection('roles').limit(1).get()
      diagnostics.firestoreRead = 'OK'
      diagnostics.rolesCount = snap.size
      if (!snap.empty) {
        diagnostics.sampleRole = { id: snap.docs[0].id, ...snap.docs[0].data() }
      }
    } catch (fsErr: any) {
      diagnostics.firestoreRead = 'FAILED'
      diagnostics.firestoreError = fsErr.message
    }

    // Test users collection
    try {
      const usersSnap = await db.collection('users').limit(1).get()
      diagnostics.usersRead = 'OK'
      diagnostics.usersCount = usersSnap.size
      if (!usersSnap.empty) {
        const userData = usersSnap.docs[0].data()
        diagnostics.sampleUser = {
          id: usersSnap.docs[0].id,
          hasRoleId: !!userData.roleId,
          hasRole: !!userData.role,
          role: userData.role || null,
          roleId: userData.roleId || null,
        }
      }
    } catch (uErr: any) {
      diagnostics.usersRead = 'FAILED'
      diagnostics.usersError = uErr.message
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
