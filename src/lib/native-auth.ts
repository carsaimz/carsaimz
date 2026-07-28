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
 */

import { isCapacitorApp } from '@/lib/api-base'

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

// ─── Google Sign-In ───

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

/**
 * Sign in with Google using the native Capacitor plugin.
 * On Android, this uses Google Sign-In via the system account picker.
 * On iOS, this uses the ASAuthorizationAppleIDProvider flow.
 *
 * After native sign-in, we also sign in to the Firebase Web SDK
 * so that auth.currentUser is available for client-side Firestore queries.
 */
export async function nativeSignInWithGoogle(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInWithGoogle()

  if (!result.user) {
    throw new Error('Google sign-in failed — no user returned')
  }

  // Sync to Firebase Web SDK so auth.currentUser is available
  try {
    const { auth, GoogleAuthProvider, signInWithCredential } = await import('@/lib/firebase-client')
    if (result.credential?.idToken) {
      const credential = GoogleAuthProvider.credential(result.credential.idToken)
      await signInWithCredential(auth, credential)
      console.log('[NativeAuth] Google sign-in synced to Web SDK')
    } else {
      console.warn('[NativeAuth] No credential ID token from native Google sign-in — Web SDK not synced')
    }
  } catch (syncErr) {
    console.warn('[NativeAuth] Failed to sync Google sign-in to Web SDK:', syncErr)
  }

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

/**
 * Sign in with GitHub using the native Capacitor plugin.
 * Opens the GitHub OAuth flow in the system browser / in-app browser.
 *
 * After native sign-in, we also sign in to the Firebase Web SDK
 * so that auth.currentUser is available for client-side Firestore queries.
 */
export async function nativeSignInWithGithub(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInWithGithub()

  if (!result.user) {
    throw new Error('GitHub sign-in failed — no user returned')
  }

  // Sync to Firebase Web SDK so auth.currentUser is available
  try {
    const { auth, GithubAuthProvider, signInWithCredential } = await import('@/lib/firebase-client')
    if (result.credential?.idToken) {
      const credential = GithubAuthProvider.credential(result.credential.idToken)
      await signInWithCredential(auth, credential)
      console.log('[NativeAuth] GitHub sign-in synced to Web SDK')
    } else {
      console.warn('[NativeAuth] No credential ID token from native GitHub sign-in — Web SDK not synced')
    }
  } catch (syncErr) {
    console.warn('[NativeAuth] Failed to sync GitHub sign-in to Web SDK:', syncErr)
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
    providerId: result.user.providerId || 'github.com',
  }
}

/**
 * Sign in anonymously using the native Capacitor plugin.
 */
export async function nativeSignInAnonymously(): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult = await FirebaseAuthentication.signInAnonymously()

  if (!result.user) {
    throw new Error('Anonymous sign-in failed — no user returned')
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
    providerId: result.user.providerId || 'anonymous',
  }
}

/**
 * Sign in with email/password using the native Capacitor plugin.
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

/**
 * Create user with email/password using the native Capacitor plugin.
 */
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

/**
 * Sign in with phone number using the native Capacitor plugin.
 * Sends SMS OTP and returns verification ID for the second step.
 */
export async function nativeSignInWithPhoneNumber(
  phoneNumber: string
): Promise<{ verificationId: string }> {
  const { FirebaseAuthentication } = await getNativeAuth()

  await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber })

  // The native plugin handles the SMS verification internally
  // and triggers an auth state change on successful verification.
  // We return a marker that phone verification is in progress.
  return { verificationId: 'native-phone-verification' }
}

/**
 * Confirm phone verification code using the native Capacitor plugin.
 */
export async function nativeConfirmVerificationCode(
  verificationCode: string
): Promise<NativeAuthResult> {
  const { FirebaseAuthentication } = await getNativeAuth()

  const result: CapacitorSignInResult =
    await FirebaseAuthentication.confirmVerificationCode({ verificationCode })

  if (!result.user) {
    throw new Error('Phone verification failed — no user returned')
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
    providerId: result.user.providerId || 'phone',
  }
}

/**
 * Sign out from the native Capacitor auth session.
 */
export async function nativeSignOut(): Promise<void> {
  const { FirebaseAuthentication } = await getNativeAuth()
  await FirebaseAuthentication.signOut()
}
