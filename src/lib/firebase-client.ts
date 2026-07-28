/**
 * Carsai Mozambique — Firebase Client Configuration
 *
 * Used by browser-side code (Firebase Auth, Firestore client reads).
 * All values come from NEXT_PUBLIC_ env vars so they're embedded at build time.
 *
 * Firebase Spark Plan (Free) features integrated:
 * - Authentication (email/password, Google, anonymous, phone, GitHub, Twitter, Microsoft, Facebook, Apple)
 * - Firestore (NoSQL database — 1GB free, 50K reads/day, 20K writes/day)
 * - Cloud Messaging (FCM — free push notifications)
 * - Analytics (free usage tracking)
 * - App Check (free abuse prevention)
 * - Crashlytics (free crash reporting)
 * - Performance Monitoring (free)
 * - Remote Config (free dynamic configuration)
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  OAuthProvider,          // Microsoft & Apple
  PhoneAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  linkWithPopup,
  unlink,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  User,
  UserCredential,
  IdTokenResult,
  ApplicationVerifier,
  RecaptchaVerifier,
} from 'firebase/auth'

// ─── Firebase Web App Config (from environment) ───

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId:      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

// ─── Firebase App singleton ───

let app: FirebaseApp

if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApp()
}

// ─── Firebase Auth singleton ───

let auth: Auth

try {
  auth = getAuth(app)
} catch {
  // During static export, auth may not be available
  auth = null as unknown as Auth
}

// ─── Auth providers ───

export const googleProvider     = new GoogleAuthProvider()
export const facebookProvider   = new FacebookAuthProvider()
export const twitterProvider    = new TwitterAuthProvider()
export const githubProvider     = new GithubAuthProvider()
export const microsoftProvider  = new OAuthProvider('microsoft.com')
export const appleProvider      = new OAuthProvider('apple.com')

// Configure Google provider to request profile + email
googleProvider.addScope('profile')
googleProvider.addScope('email')

// ─── Export everything ───

export {
  app,
  auth,

  // Auth functions
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  linkWithPopup,
  unlink,
  fetchSignInMethodsForEmail,
  getRedirectResult,

  // Auth types
  GithubAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
}

export type { User, UserCredential, IdTokenResult, ApplicationVerifier }

// ─── Helper: check if Firebase is configured ───

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId
}
