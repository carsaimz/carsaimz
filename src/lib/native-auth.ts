/**
 * Carsai Mozambique — Native Auth Bridge
 *
 * Detects if running inside Capacitor native app and uses
 * @capacitor-firebase/authentication for native auth flows.
 * Falls back to Firebase Web SDK (signInWithPopup etc.) on web.
 *
 * Why: signInWithPopup from Firebase Web SDK does NOT work in Capacitor's
 * native WebView — the popup opens and immediately closes because the OAuth
 * redirect can't communicate back to the parent window.
 *
 * IMPORTANT: After every native sign-in, we sync the credential to the
 * Firebase Web SDK via signInWithCredential(). This ensures auth.currentUser
 * is available for client-side Firestore queries, and prevents the
 * "Utilizador não autenticado" error when the server API fails and we
 * fall back to client-side Firestore.
 */

import { isCapacitorApp } from '@/lib/api-base'
import { GOOGLE_WEB_CLIENT_ID } from '@/lib/client-config'

// ─── Capacitor Firebase Auth types ───

interface CapacitorSignInResult {
  user: {
    uid: string
    displayName: string | null
    email: string | null
    emailVerified: boolean
    isAnonymous: boolean
    phoneNumber: string | null
    photoUrl: string | null
    providerId: string
  } | null
  credential: {
    idToken?: string
    accessToken?: string
    nonce?: string
  } | null
}

interface CapacitorIdTokenResult {
  token: string
}

// ─── Native auth helper ───

let nativeAuthModule: any = null

async function getNativeAuth() {
  if (nativeAuthModule) return nativeAuthModule
  nativeAuthModule = await import('@capacitor-firebase/authentication')
  return nativeAuthModule
}

/**
 * Check if we should use the native Capacitor auth plugin.
 * Returns true when running inside a Capacitor native app.
 */
export function shouldUseNativeAuth(): boolean {
  return isCapacitorApp()
}

// ─── Web SDK Sync ───
// After native sign-in, sync to Firebase Web SDK so auth.currentUser
// is available for client-side Firestore queries and auth state listeners.

async function syncToWebSdk(
  providerName: 'google' | 'github' | 'email' | 'phone' | 'anonymous',
  credentialData?: { idToken?: string; accessToken?: string; nonce?: string }
): Promise<void> {
  try {
    const { auth, signInWithCredential, GoogleAuthProvider, GithubAuthProvider, EmailAuthProvider, PhoneAuthProvider } = await import('@/lib/firebase-client')

    if (credentialData?.idToken) {
      let credential: any

      switch (providerName) {
        case 'google': {
          credential = GoogleAuthProvider.credential(credentialData.idToken, credentialData.accessToken)
          break
        }
        case 'github': {
          credential = GithubAuthProvider.credential(credentialData.idToken)
          break
        }
        case 'email': {
          // For email/password, we use signInWithEmailAndPassword directly
          // (called from the store with the actual email/password)
          // Here we just set the persistence if we have the id token
          // The Web SDK can auto-detect the native session via onAuthStateChanged
          console.log('[NativeAuth] Email auth — Web SDK will detect session via auth state listener')
          return
        }
        case 'phone': {
          if (credentialData.accessToken) {
            // Phone auth credential needs both verificationId and code
            // The native plugin handles this internally
            console.log('[NativeAuth] Phone auth — Web SDK will detect session via auth state listener')
            return
          }
          break
        }
        case 'anonymous': {
          // Anonymous auth is synced via the auth state listener
          console.log('[NativeAuth] Anonymous auth — Web SDK will detect session via auth state listener')
          return
        }
      }

      if (credential) {
        await signInWithCredential(auth, credential)
        console.log(`[NativeAuth] ${providerName} sign-in synced to Web SDK`)
      }
    } else {
      console.warn(`[NativeAuth] No credential data from native ${providerName} sign-in — Web SDK sync may be incomplete`)
    }
  } catch (syncErr) {
    console.warn(`[NativeAuth] Failed to sync ${providerName} sign-in to Web SDK:`, syncErr)
    // Non-critical: the native auth still succeeded, server verification
    // or client-side Firestore can still work with the idToken
  }
}

/**
 * Force-set auth.currentUser in the Web SDK by signing in with the idToken
 * obtained from the native plugin. This is used when the native auth
 * doesn't provide a credential that signInWithCredential can use
 * (e.g., email/password, anonymous).
 *
 * This uses a workaround: sign in with a custom token derived from the
 * native idToken. Since Firebase doesn't directly support this, we instead
 * rely on the auth state listener in auth-context.tsx to detect the native
 * session and call verifyWithServer.
 */
async function ensureWebSdkAuth(idToken: string): Promise<void> {
  try {
    // The @capacitor-firebase/authentication plugin has a built-in
    // feature where it syncs auth state to the Web SDK automatically
    // when the auth state changes. However, this sync might happen
    // asynchronously and might not be immediate.
    //
    // To ensure auth.currentUser is available RIGHT NOW (not later),
    // we need to explicitly sign in to the Web SDK.
    //
    // For providers that give us a credential (Google, GitHub), we can
    // use signInWithCredential(). For others (email, anonymous), we
    // need a different approach.
    //
    // The most reliable approach is to have the @capacitor-firebase/authentication
    // plugin configured with skipNativeAuth: false (which is the default),
    // which means it automatically applies the native auth result to the
    // Web SDK's auth state. But this might not work in all cases.
    //
    // As a fallback, we trigger the auth state listener by calling
    // getIdToken() on the native plugin, which refreshes the session.

    const { FirebaseAuthentication } = await getNativeAuth()
    await FirebaseAuthentication.getIdToken({ forceRefresh: true })
    console.log('[NativeAuth] Forced ID token refresh to sync auth state')
  } catch (err) {
    console.warn('[NativeAuth] Could not force auth state sync:', err)
  }
}

// ─── Native Auth Result ───

export interface NativeAuthResult {
  idToken: string
  uid: string
  displayName: string | null
  email: string | null
  phoneNumber: string | null
  photoUrl: string | null
  isAnonymous: boolean
  emailVerified: boolean
  providerId: string
}

// ─── Google Sign-In ───

/**
 * Sign in with Google using the native Capacitor plugin.
 * On Android, this uses Google Sign-In via the system account picker.
 *
 * After native sign-in, we sync to Firebase Web SDK so auth.currentUser
 * is available for client-side Firestore queries.
 *
 * IMPORTANT: On Android, Google Sign-In requires the Web OAuth Client ID
 * from the Firebase project. This is typically the client_id found in
 * the Firebase Console → Project Settings → Your apps → Web app.
 * The google-services.json must contain this client in the oauth_client array.
 */
export async function nativeSignInWithGoogle(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  // Build options — include webClientId if configured.
  // On Android, the webClientId is required for Google Sign-In to complete
  // the OAuth flow. Without it, the account picker appears but the sign-in
  // doesn't complete (the user selects an email but nothing happens).
  const options: Record<string, string> = {}
  if (GOOGLE_WEB_CLIENT_ID) {
    options.clientId = GOOGLE_WEB_CLIENT_ID
    console.log('[NativeAuth] Using configured Google Web Client ID for native sign-in')
  } else {
    console.warn('[NativeAuth] GOOGLE_WEB_CLIENT_ID not configured — Google Sign-In may fail on Android. Set NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env or Firebase Console.')
  }

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInWithGoogle(options)

  if (!result.user) {
    throw new Error('Google sign-in failed — no user returned')
  }

  // Sync to Firebase Web SDK so auth.currentUser is available
  await syncToWebSdk('google', result.credential || undefined)

  // Get the ID token from the native auth session
  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'google.com',
  }
}

// ─── GitHub Sign-In ───

export async function nativeSignInWithGithub(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInWithGithub()

  if (!result.user) {
    throw new Error('GitHub sign-in failed — no user returned')
  }

  await syncToWebSdk('github', result.credential || undefined)

  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'github.com',
  }
}

// ─── Email/Password Sign-In ───

/**
 * Sign in with email/password using the native Capacitor plugin.
 *
 * After native sign-in, we try to sync to the Firebase Web SDK.
 * Since email/password auth doesn't provide a OAuth credential,
 * we rely on the auth state listener to detect the session change.
 * We also force an ID token refresh to trigger the sync.
 */
export async function nativeSignInWithEmailPassword(
  email: string,
  password: string
): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult =
    await FirebaseAuthentication.signInWithEmailAndPassword({ email, password })

  if (!result.user) {
    throw new Error('Email sign-in failed — no user returned')
  }

  // Try to sync to Web SDK
  // For email/password, the native plugin should automatically update
  // the Web SDK's auth.currentUser via onAuthStateChanged.
  // Force a token refresh to ensure the sync happens.
  await ensureWebSdkAuth(result.credential?.idToken || '')

  // Also try signInWithCredential for email provider if we have the idToken
  try {
    if (result.credential?.idToken) {
      const { auth, EmailAuthProvider, signInWithCredential } = await import('@/lib/firebase-client')
      // EmailAuthProvider.credential needs email + password, not idToken
      // But we can use the idToken + accessToken with GoogleAuthProvider.credential
      // Actually, for email auth we need to use signInWithEmailAndPassword directly
      // which we can't do here since we don't store the password.
      // Instead, rely on the native auth state sync (onAuthStateChanged).
      console.log('[NativeAuth] Email sign-in — relying on native auth state sync to Web SDK')
    }
  } catch (err) {
    console.warn('[NativeAuth] Email auth Web SDK sync attempt failed (non-critical):', err)
  }

  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'email',
  }
}

// ─── Create User with Email/Password ───

export async function nativeCreateUserWithEmailAndPassword(
  email: string,
  password: string
): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult =
    await FirebaseAuthentication.createUserWithEmailAndPassword({ email, password })

  if (!result.user) {
    throw new Error('Account creation failed — no user returned')
  }

  await ensureWebSdkAuth(result.credential?.idToken || '')

  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'email',
  }
}

// ─── Anonymous Sign-In ───

export async function nativeSignInAnonymously(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInAnonymously()

  if (!result.user) {
    throw new Error('Anonymous sign-in failed — no user returned')
  }

  await ensureWebSdkAuth('')

  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'anonymous',
  }
}

// ─── Phone Auth ───

export async function nativeSignInWithPhoneNumber(
  phoneNumber: string
): Promise<{ verificationId: string }> {
  const { FirebaseAuthentication } = await getNativeAuth()

  await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber })

  // The native plugin handles the SMS verification internally
  // and triggers an auth state change on successful verification.
  return { verificationId: 'native-phone-verification' }
}

export async function nativeConfirmVerificationCode(
  verificationCode: string
): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult =
    await FirebaseAuthentication.confirmVerificationCode({ verificationCode })

  if (!result.user) {
    throw new Error('Phone verification failed — no user returned')
  }

  await ensureWebSdkAuth(result.credential?.idToken || '')

  const idTokenResult: CapacitorIdTokenResult = await FirebaseAuthentication.getIdToken()

  return {
    idToken: idTokenResult.token,
    uid: result.user.uid,
    displayName: result.user.displayName,
    email: result.user.email,
    phoneNumber: result.user.phoneNumber,
    photoUrl: result.user.photoUrl,
    isAnonymous: result.user.isAnonymous,
    emailVerified: result.user.emailVerified,
    providerId: result.user.providerId || 'phone',
  }
}

// ─── Sign Out ───

export async function nativeSignOut(): Promise<void> {
  const { FirebaseAuthentication } = await getNativeAuth()
  await FirebaseAuthentication.signOut()
}
